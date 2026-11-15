/**
 * Host half of @local/session-tools.
 *
 * Two operations, each implemented once and shared by the sidebar menu (through
 * this package's private webServer route) and by the agent tool:
 *
 *   locate      — resolve a session id to its working directory and durable log directory
 *   open folder — delegate to ctx.sessionController.openWorkspacePath (the official native opener)
 *   delete      — archive the session first (it leaves the sidebar and its running work stops),
 *                 then permanently remove its durable log directory.
 *
 * The Harness exposes no session-deletion API (`dsh-session-persistence`: "No deletion or
 * retention API"; the JSONL backend: "Nothing deletes session files"), so this plugin owns
 * the filesystem removal and mirrors the JSONL backend's private path-derivation rules.
 */
import { readFileSync } from 'node:fs'
import { appendFile, copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'

/** Session-log filename format generations the JSONL backend may have written. */
const LOG_BASENAMES = [
  'session.jsonl',
  'session.jsonl.zstd',
  'session.v1.jsonl',
  'session.v1.jsonl.zstd',
  'session.v2.jsonl',
  'session.v2.jsonl.zstd',
  'session.v3.jsonl',
  'session.v3.jsonl.zstd',
  'session.v4.jsonl',
  'session.v4.jsonl.zstd',
]

/** Mirrors `@deepseek-ai/dsh-home-paths`: explicit config > $DSH_HOME > ~/.dsh. */
function resolveDshHome() {
  const configured = process.env.DSH_HOME
  if (typeof configured === 'string' && configured.trim() !== '') return resolve(configured.trim())
  return join(homedir(), '.dsh')
}

/** Mirrors the JSONL backend's private `encodeSegment` (session id -> safe path segment). */
function encodeSegment(raw) {
  if (raw.length === 0) throw new Error('cannot encode an empty path segment')
  if (raw === '.') return '~002E'
  if (raw === '..') return '~002E~002E'
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    const ch = String.fromCharCode(code)
    if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) out += ch
    else out += '~' + code.toString(16).toUpperCase().padStart(4, '0')
  }
  return out
}

/** Mirrors the JSONL backend's private `projectKey` (cwd -> readable `--…--` directory). */
function projectKey(cwd) {
  if (cwd.length === 0) throw new Error('cannot encode an empty project path')
  let readable = ''
  let separatorRun = false
  for (let i = 0; i < cwd.length; i++) {
    const code = cwd.charCodeAt(i)
    const ch = String.fromCharCode(code)
    if (ch === '/' || ch === '\\' || ch === ':') {
      if (!separatorRun) readable += '-'
      separatorRun = true
    } else if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch
      separatorRun = false
    } else {
      readable += '~' + code.toString(16).toUpperCase().padStart(4, '0')
      separatorRun = false
    }
  }
  return `--${(readable.replace(/^-+/, '') || 'root').slice(0, 251)}--`
}

class ToolError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

/** Windows paths are case-insensitive; normalize before any containment test. */
function comparable(path) {
  const value = resolve(path).replace(/[\\/]+$/, '')
  return process.platform === 'win32' ? value.toLowerCase() : value
}

/** True when `child` is strictly inside the already-resolved `parent`. */
function isInside(parent, child) {
  return comparable(child).startsWith(comparable(parent) + sep)
}

/** True when two roots are equal or one contains the other (copying would recurse). */
function pathsOverlap(a, b) {
  const left = comparable(a)
  const right = comparable(b)
  return left === right || left.startsWith(right + sep) || right.startsWith(left + sep)
}

/** Exact directory names the JSONL backend uses for one session id. */
function candidateProjectDirs(sessionsRoot, cwd, segment) {
  const dirs = []
  if (typeof cwd === 'string' && cwd !== '') dirs.push(join(sessionsRoot, projectKey(cwd), segment))
  dirs.push(join(sessionsRoot, '_no-cwd', segment))
  return dirs
}

export function apply(ctx, config = {}) {
  /**
   * The live session-log root: the persistence row's effective `root` (the user
   * may relocate it through this plugin's storage settings), with an explicit
   * plugin config override winning, and `<dshHome>/sessions` as the base default.
   */
  const currentSessionsRoot = () => {
    if (typeof config?.sessionsRoot === 'string' && config.sessionsRoot.trim() !== '') {
      return resolve(config.sessionsRoot.trim())
    }
    // locate/delete must follow the directory the backends are writing *now*,
    // not the one saved in the patch that a restart has not applied yet.
    return storageInfo('sessions').runtimeRoot
  }

  /**
   * Resolve one stored session into its working directory and its durable log directory.
   * Reads persistence header metadata only — never a log body.
   */
  async function locate(sessionId) {
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      throw new ToolError('bad-request', 'sessionId is required')
    }
    const id = sessionId.trim()
    const sessionsRoot = currentSessionsRoot()
    const snapshot = await ctx.sessionPersistence.stat(id)
    if (snapshot === undefined) throw new ToolError('not-found', `no stored session ${id}`)
    const header = snapshot.header ?? {}
    const cwd = typeof header.cwd === 'string' && header.cwd !== '' ? header.cwd : undefined
    const segment = encodeSegment(id)

    for (const dir of candidateProjectDirs(sessionsRoot, cwd, segment)) {
      const located = await confirmSessionDir(sessionsRoot, dir, id)
      if (located !== undefined) return { sessionId: id, cwd, workspacePath: cwd, logDir: located }
    }

    // Defensive fallback: scan every project directory for the encoded id segment.
    const projects = await readdir(sessionsRoot, { withFileTypes: true }).catch(() => [])
    for (const entry of projects) {
      if (!entry.isDirectory()) continue
      const located = await confirmSessionDir(sessionsRoot, join(sessionsRoot, entry.name, segment), id)
      if (located !== undefined) return { sessionId: id, cwd, workspacePath: cwd, logDir: located }
    }
    throw new ToolError('not-found', `no log directory on disk for session ${id}`)
  }

  /** Prove a candidate directory holds this session's log and header identity. */
  async function confirmSessionDir(sessionsRoot, dir, id) {
    const absolute = resolve(dir)
    if (!isInside(sessionsRoot, absolute)) return undefined
    const info = await stat(absolute).catch(() => undefined)
    if (info === undefined || !info.isDirectory()) return undefined
    const names = await readdir(absolute).catch(() => [])
    if (!names.some((name) => LOG_BASENAMES.includes(name))) return undefined
    // The directory name is the injective encoding of the id, so equality is the identity proof.
    if (absolute.split(sep).pop() !== encodeSegment(id)) return undefined
    return absolute
  }

  /** Open the session's working directory with the OS default handler. */
  async function openFolder(sessionId, signal) {
    const located = await locate(sessionId)
    if (located.workspacePath === undefined) {
      throw new ToolError('no-directory', 'this session has no recorded working directory')
    }
    const result = await ctx.sessionController.openWorkspacePath({ path: located.workspacePath }, signal)
    if (result?.opened !== true) throw new ToolError('open-failed', 'the desktop opener did not accept the directory')
    return { opened: true, path: located.workspacePath }
  }

  /**
   * Permanently delete one session's durable record: archive it in workspace
   * navigation (which also stops its running work and takes the row out of the
   * sidebar), flush any live log, then remove the session directory.
   */
  async function deleteSession(sessionId, { force = false } = {}) {
    const located = await locate(sessionId)
    if (!isInside(currentSessionsRoot(), located.logDir)) {
      throw new ToolError('unsafe-path', 'refusing to remove a path outside the sessions root')
    }
    const live = ctx.sessions.get(located.sessionId)
    // Never delete the record of the conversation driving this very call: its
    // Agent is live, a re-list would resurrect the row, and the turn would be
    // cut off mid-work. The UI route has no initiator, so menu deletes of the
    // open conversation still work; this only fences the agent-tool path.
    // Read through ctx.get so a profile without the agent registry still runs.
    const initiator = ctx.get?.('agents')?.currentInitiator?.()
    if (initiator?.session?.id === located.sessionId) {
      throw new ToolError('session-current', 'this is the conversation running the request; delete it from its sidebar menu instead')
    }
    if (live !== undefined && !force) {
      throw new ToolError(
        'session-live',
        'this conversation is open in a live agent; retry with force after the user confirms',
      )
    }
    // Archive first: the durable archive set gates every later wake of this session.
    await ctx.workspaceRegistry.archiveSession(located.sessionId, { stopActivity: true }).catch(() => {})
    if (live !== undefined) await ctx.sessions.flush(live).catch(() => {})
    try {
      await rm(located.logDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 })
    } catch (error) {
      throw new ToolError('remove-failed', `could not remove the session record: ${error?.message ?? String(error)}`)
    }
    const leftover = await stat(located.logDir).catch(() => undefined)
    if (leftover !== undefined) throw new ToolError('remove-failed', 'the session record still exists after removal')
    // Stay archived: the durable archive set keeps the id out of the visible list
    // and gates every later wake of the removed session.
    // The Client list only drops a row on the Host's `api-session/removed`
    // event (handleSessionRemoved → "remove" mutation); out-of-band deletion
    // emits nothing else, so announce it here or the row lingers until reload.
    ctx.emit('api-session/removed', located.sessionId)
    return {
      deleted: true,
      sessionId: located.sessionId,
      removedPath: located.logDir,
      workspacePath: located.workspacePath,
    }
  }

  // ── Storage roots: read, change, and migrate the durable locations ────────
  /** The two rows whose `root` the user may relocate. */
  const ROOT_ROWS = {
    sessions: { id: 'session-persistence-jsonl', name: '@deepseek-ai/dsh-session-persistence-jsonl' },
    storages: { id: 'storage-json', name: '@deepseek-ai/dsh-storage-json' },
  }
  const defaultRoot = (leaf) => join(resolveDshHome(), leaf)

  /**
   * The root that was live immediately before the last successful `storage-set`.
   * Kept so a later "migrate" can still copy from the tree that held the data
   * before the user moved it.
   */
  const previousRoots = new Map()

  function rootSpec(kind) {
    const spec = ROOT_ROWS[kind]
    if (spec === undefined) throw new ToolError('bad-request', `unknown storage kind: ${String(kind)}`)
    return spec
  }

  // ── Profile patch I/O ──────────────────────────────────────────────────────
  // `configEditor.edit()` is deliberately NOT used here. On this Harness build
  // every edit calls reconcileProfilePatches -> recompose, which fails with
  // "file-upload: Agent resolver is already registered" (session-controller
  // cannot re-activate). edit() then rolls the patch back and throws, so the
  // directory can never be changed through that path. Writing the profile
  // patch directly avoids the broken hot reload entirely; a restart applies it.

  /** The patch belonging to the *live* profile, not a hard-coded `desktop`. */
  function patchPath() {
    const exposed = ctx.get?.('configEditor')?.documentPath
    if (typeof exposed === 'string' && exposed.trim() !== '') return resolve(exposed.trim())
    return join(resolveDshHome(), 'profiles', 'desktop', 'cordis.patch.yml')
  }

  /** Decode the small YAML scalar subset a `root:` value can use. */
  function parseScalar(raw) {
    const text = String(raw).trim()
    if (text.startsWith('"')) {
      try { return JSON.parse(text) } catch {}
      return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
    if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replace(/''/g, "'")
    const comment = text.indexOf(' #')
    return (comment < 0 ? text : text.slice(0, comment)).trim()
  }
  const encodeScalar = (value) => JSON.stringify(value)

  /** Locate the last top-level `- id: <id>` row; bundle `insert:` children are indented. */
  function patchRowRange(lines, id) {
    let start = -1
    for (let i = 0; i < lines.length; i++) {
      const match = /^-\s+id:\s*(.+?)\s*$/.exec(lines[i])
      if (match !== null && parseScalar(match[1]) === id) start = i
    }
    if (start < 0) return undefined
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) {
      if (/^-\s/.test(lines[i])) { end = i; break }
    }
    return { start, end }
  }

  /** Synchronous: `storageInfo` has synchronous callers (locate/delete). */
  function readPatchRoot(kind) {
    let text
    try { text = readFileSync(patchPath(), 'utf8') } catch { return undefined }
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    const range = patchRowRange(lines, rootSpec(kind).id)
    if (range === undefined) return undefined
    for (let i = range.start + 1; i < range.end; i++) {
      const match = /^\s+root:\s*(.*)$/.exec(lines[i])
      if (match === null) continue
      const value = parseScalar(match[1])
      return typeof value === 'string' && value.trim() !== '' ? resolve(value.trim()) : undefined
    }
    return undefined
  }

  function patchWritable() {
    try { readFileSync(patchPath(), 'utf8'); return true }
    catch (error) { return error?.code === 'ENOENT' }
  }

  /**
   * Rewrite only the `root:` line of one profile row, preserving every other
   * byte (comments, `!!js` tags, nested plugin lists). Passing `undefined`
   * removes the override so the profile default applies again.
   */
  function applyPatchRoot(text, spec, root) {
    const eol = text.includes('\r\n') ? '\r\n' : '\n'
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    const range = patchRowRange(lines, spec.id)
    if (range === undefined) {
      if (root === undefined) return text
      const out = lines.slice()
      while (out.length > 0 && out[out.length - 1].trim() === '') out.pop()
      out.push(`- id: ${spec.id}`, `  name: '${spec.name}'`, '  config:', `    root: ${encodeScalar(root)}`, '')
      return out.join(eol)
    }
    const { start, end } = range
    const block = lines.slice(start, end)
    let configIdx = -1
    for (let i = 1; i < block.length; i++) {
      if (/^ {2}config:/.test(block[i])) { configIdx = i; break }
    }
    let rootIdx = -1
    if (configIdx >= 0) {
      for (let i = configIdx + 1; i < block.length; i++) {
        const line = block[i]
        if (line.trim() === '' || /^ {4,}/.test(line)) {
          if (/^ {4}root:/.test(line)) { rootIdx = i; break }
          continue
        }
        break
      }
    }
    if (root === undefined) {
      if (rootIdx < 0) return text
      block.splice(rootIdx, 1)
      const hasConfigLeft = block.some((line, i) => i > configIdx && line.trim() !== '' && /^ {4,}/.test(line))
      if (!hasConfigLeft && configIdx >= 0) block.splice(configIdx, 1)
      const meaningful = block.filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
      if (meaningful.length <= 2) return [...lines.slice(0, start), ...lines.slice(end)].join(eol)
      lines.splice(start, end - start, ...block)
      return lines.join(eol)
    }
    if (configIdx < 0) {
      let at = block.length
      while (at > 1 && block[at - 1].trim() === '') at--
      block.splice(at, 0, '  config:', `    root: ${encodeScalar(root)}`)
    } else {
      // An inline `config: {}` must become a block before a key can be added.
      if (/^ {2}config:\s*\{/.test(block[configIdx])) block[configIdx] = '  config:'
      if (rootIdx >= 0) {
        block[rootIdx] = `    root: ${encodeScalar(root)}`
      } else {
        let at = configIdx + 1
        while (at < block.length && (block[at].trim() === '' || /^ {4,}/.test(block[at]))) at++
        block.splice(at, 0, `    root: ${encodeScalar(root)}`)
      }
    }
    lines.splice(start, end - start, ...block)
    return lines.join(eol)
  }

  /** Serialize concurrent saves so two rapid clicks cannot clobber each other. */
  let patchQueue = Promise.resolve()
  function withPatchLock(task) {
    const run = patchQueue.then(task, task)
    patchQueue = run.catch(() => {})
    return run
  }

  async function writePatchRoot(kind, root) {
    const spec = rootSpec(kind)
    const path = patchPath()
    return withPatchLock(async () => {
      let before
      try { before = await readFile(path, 'utf8') }
      catch (error) {
        if (error?.code !== 'ENOENT') {
          throw new ToolError('patch-unavailable', `cannot read ${path}: ${error?.message ?? String(error)}`)
        }
        before = '[]\n'
      }
      const after = applyPatchRoot(before, spec, root)
      if (after === before) return { path, written: false }
      const tmp = join(dirname(path), `.${basename(path)}.session-tools.tmp`)
      try {
        await writeFile(tmp, after, 'utf8')
        await rename(tmp, path)
      } catch {
        await rm(tmp, { force: true }).catch(() => {})
        // A watcher can briefly hold the file on Windows; fall back to a direct
        // write rather than leaving the profile unchanged with no explanation.
        try { await writeFile(path, after, 'utf8') }
        catch (error) {
          throw new ToolError('patch-unavailable', `cannot write ${path}: ${error?.message ?? String(error)}`)
        }
      }
      return { path, written: true }
    })
  }

  function rowEntry(kind) {
    const spec = rootSpec(kind)
    const editor = ctx.get?.('configEditor')
    const entries = editor?.entries?.() ?? []
    // `name` is optional in profile patches, so fall back to the id alone.
    return entries.find((entry) => entry.options.id === spec.id && entry.options.name === spec.name)
      ?? entries.find((entry) => entry.options.id === spec.id)
  }

  /**
   * `root` is the value saved in the profile patch (what applies after a
   * restart); `runtimeRoot` is what the backends are actually reading right
   * now. They differ between a save and the next restart, which the settings
   * page surfaces as a pending-restart badge.
   */
  function storageInfo(kind) {
    const spec = rootSpec(kind)
    const entry = rowEntry(kind)
    const raw = entry?.options?.config?.root
    const fallback = resolve(defaultRoot(kind))
    const runtimeRoot = typeof raw === 'string' && raw.trim() !== '' ? resolve(raw.trim()) : fallback
    const saved = readPatchRoot(kind)
    const root = saved ?? runtimeRoot
    return {
      kind,
      entryId: spec.id,
      root,
      runtimeRoot,
      configured: saved !== undefined || runtimeRoot !== fallback,
      editable: patchWritable(),
      defaultRoot: fallback,
      previousRoot: previousRoots.get(kind),
      pendingRestart: root !== runtimeRoot,
      patchPath: patchPath(),
    }
  }

  /**
   * Copy one tree into another. A file already present at the target is
   * replaced only when the source is newer or clearly richer: right after a
   * root switch the backends create a fresh, nearly-empty `workspace.json` at
   * the new location, and silently skipping it (the old behaviour) is exactly
   * what made relocated history disappear.
   */
  async function copyTree(source, target) {
    const result = { copied: 0, overwritten: 0, skipped: 0, failed: 0 }
    const walk = async (from, to) => {
      await mkdir(to, { recursive: true })
      for (const item of await readdir(from, { withFileTypes: true })) {
        const src = join(from, item.name)
        const dst = join(to, item.name)
        if (item.isDirectory()) {
          await walk(src, dst)
          continue
        }
        if (!item.isFile()) continue
        const [srcInfo, dstInfo] = await Promise.all([
          stat(src).catch(() => undefined),
          stat(dst).catch(() => undefined),
        ])
        if (srcInfo === undefined) continue
        if (dstInfo === undefined) {
          try { await copyFile(src, dst); result.copied++ } catch { result.failed++ }
          continue
        }
        const newer = srcInfo.mtimeMs > dstInfo.mtimeMs + 1000
        const richer = srcInfo.size > 0 && srcInfo.size > dstInfo.size * 2
        if (!newer && !richer) { result.skipped++; continue }
        try { await copyFile(src, dst); result.overwritten++ } catch { result.failed++ }
      }
    }
    await walk(source, target)
    return result
  }

  /**
   * Persist a new root by writing the profile patch, then let a restart apply
   * it. The old tree is copied FIRST, because after the restart the backends
   * read only the new directory — without the copy, history disappears.
   *
   * `configEditor.edit()` would apply the change live, but this Harness build
   * fails its recompose ("file-upload: Agent resolver is already registered")
   * and rolls the write back, so it cannot be used. Nothing is ever removed.
   */
  async function setStorageRoot(kind, root, { migrate = true } = {}) {
    rootSpec(kind)
    if (!patchWritable()) {
      throw new ToolError('patch-unavailable', `the profile patch is not writable: ${patchPath()}`)
    }
    if (typeof root !== 'string' || root.trim() === '') {
      throw new ToolError('bad-request', 'a non-empty directory path is required')
    }
    if (!isAbsolute(root.trim())) {
      throw new ToolError('bad-request', 'the path must be absolute')
    }
    const next = resolve(root.trim())
    const info = storageInfo(kind)
    const previous = info.root
    const source = info.runtimeRoot // where the data actually lives right now
    if (next === previous && !info.pendingRestart) return { changed: false, kind, root: next }

    // Copying a directory into itself recurses; sharing one root between the
    // append-only session logs and the JSON KV store mixes two layouts.
    if (pathsOverlap(next, source)) {
      throw new ToolError('bad-request', 'the new root must not be inside, or contain, the current root')
    }
    for (const other of Object.keys(ROOT_ROWS)) {
      if (other === kind) continue
      const otherRoot = storageInfo(other).root
      if (pathsOverlap(next, otherRoot)) {
        throw new ToolError('bad-request', `the new root must differ from the ${other} root (${otherRoot})`)
      }
    }

    const existing = await stat(next).catch(() => undefined)
    if (existing !== undefined && !existing.isDirectory()) {
      throw new ToolError('bad-request', 'the target path exists and is not a directory')
    }
    await mkdir(next, { recursive: true }) // also proves the location is writable

    let migration
    if (migrate && !pathsOverlap(source, next)) {
      const from = await stat(source).catch(() => undefined)
      migration = from?.isDirectory()
        ? { source, target: next, ...(await copyTree(source, next)) }
        : { source, target: next, copied: 0, overwritten: 0, skipped: 0, failed: 0, sourceMissing: true }
    }

    const patch = await writePatchRoot(kind, next)
    previousRoots.set(kind, source)
    return {
      changed: true,
      kind,
      root: next,
      previous,
      source,
      migration,
      applied: false,
      restartRequired: true,
      patchPath: patch.path,
    }
  }

  /**
   * Copy historical data into the CURRENT root. The source defaults to the
   * root live before the last `storage-set` (falling back to the profile
   * default), or can be given explicitly. The source is only removed when it
   * was passed explicitly.
   */
  async function migrateStorage(kind, { source, removeSource = false } = {}) {
    rootSpec(kind)
    const explicit = typeof source === 'string' && source.trim() !== ''
    if (explicit && !isAbsolute(source.trim())) {
      throw new ToolError('bad-request', 'the source path must be absolute')
    }
    const target = resolve(storageInfo(kind).root)
    const from = explicit ? resolve(source.trim()) : resolve(previousRoots.get(kind) ?? defaultRoot(kind))
    if (pathsOverlap(from, target)) {
      throw new ToolError('bad-request', 'the source and target roots must be different and non-overlapping')
    }
    const fromInfo = await stat(from).catch(() => undefined)
    if (fromInfo === undefined || !fromInfo.isDirectory()) {
      throw new ToolError('not-found', `no data at ${from}`)
    }
    await mkdir(target, { recursive: true })
    const result = await copyTree(from, target)
    if (removeSource) {
      if (!explicit) throw new ToolError('bad-request', 'refusing to remove an inferred source; pass an explicit source')
      await rm(from, { recursive: true, force: true })
    }
    return { kind, source: from, target, ...result, removedSource: removeSource }
  }

  // ── Package-private bridge for the Client half ────────────────────────────
  const sendJson = (res, status, payload) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }
  const readBody = async (req) => {
    const chunks = []
    let size = 0
    for await (const chunk of req) {
      size += chunk.length
      if (size > 64 * 1024) return null
      chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
  }
  /**
   * The desktop app only persists startup crash reports, so a failed Host
   * operation otherwise leaves no trace. Keep our own append-only diagnostic
   * next to the profile data, including the original stack when available.
   */
  const diagnosticPath = () => join(resolveDshHome(), 'session-tools-error.log')
  const writeDiagnostic = async (route, error) => {
    const cause = error?.cause
    const detail = cause?.stack ?? error?.stack ?? String(error)
    try {
      await appendFile(diagnosticPath(), `[${new Date().toISOString()}] ${route}\n${detail}\n\n`, 'utf8')
    } catch {}
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: '/session-tools',
        handler: async (req, res) => {
          const rejection = ctx.connection.requestRejection(req)
          if (rejection !== undefined) {
            res.statusCode = rejection
            res.end()
            return
          }
          const route = new URL(String(req.url), 'http://localhost').pathname
            .slice('/session-tools/'.length)
            .replace(/\/+$/, '')
          if (req.method !== 'POST') {
            sendJson(res, 405, { code: 'method-not-allowed', message: 'POST only' })
            return
          }
          const text = await readBody(req).catch(() => null)
          if (text === null) {
            sendJson(res, 400, { code: 'bad-request', message: 'request body unreadable or too large' })
            return
          }
          let request
          try {
            request = text.trim() === '' ? {} : JSON.parse(text)
          } catch {
            sendJson(res, 400, { code: 'bad-request', message: 'request body must be JSON' })
            return
          }
          const sessionId = typeof request?.sessionId === 'string' ? request.sessionId : ''
          const controller = new AbortController()
          res.once('close', () => controller.abort())
          const timer = setTimeout(() => controller.abort(), 30_000)
          try {
            if (route === 'locate') {
              sendJson(res, 200, { ok: true, ...(await locate(sessionId)) })
            } else if (route === 'open-folder') {
              sendJson(res, 200, { ok: true, ...(await openFolder(sessionId, controller.signal)) })
            } else if (route === 'delete') {
              sendJson(res, 200, {
                ok: true,
                ...(await deleteSession(sessionId, { force: request?.force === true })),
              })
            } else if (route === 'storage-info') {
              const kinds = ['sessions', 'storages']
              sendJson(res, 200, { ok: true, items: kinds.map((kind) => storageInfo(kind)) })
            } else if (route === 'storage-set') {
              const result = await setStorageRoot(request?.kind, request?.root, {
                migrate: request?.migrate !== false,
              })
              sendJson(res, 200, { ok: true, ...result, items: [storageInfo(request?.kind)] })
            } else if (route === 'storage-migrate') {
              sendJson(res, 200, {
                ok: true,
                ...(await migrateStorage(request?.kind, {
                  source: request?.source,
                  removeSource: request?.removeSource === true,
                })),
              })
            } else if (route === 'quota-log') {
              // Best-effort trace from the model picker's provider-quota badges:
              // records method, timeout, HTTP status and parsed balance so a
              // broken channel can be diagnosed without another screenshot.
              const line = typeof request?.line === 'string' ? request.line.slice(0, 2000) : ''
              await appendFile(join(resolveDshHome(), 'session-tools-quota.log'),
                `[${new Date().toISOString()}] ${line}\n`, 'utf8')
              sendJson(res, 200, { ok: true })
            } else {
              sendJson(res, 404, { code: 'unknown-route', message: `no session-tools route: ${route}` })
            }
          } catch (error) {
            const code = error instanceof ToolError ? error.code : 'internal'
            const status = code === 'not-found' || code === 'session-live' ? 409
              : code === 'internal' || code === 'patch-unavailable' ? 500 : 400
            // Unexpected failures and a rejected profile write are worth a
            // durable trace; ordinary validation errors are not.
            if (code === 'internal' || code === 'patch-unavailable') await writeDiagnostic(route, error)
            sendJson(res, status, {
              ok: false,
              code,
              message: error?.message ?? String(error),
              ...(code === 'internal' || code === 'patch-unavailable' ? { log: diagnosticPath() } : {}),
            })
          } finally {
            clearTimeout(timer)
          }
        },
      }),
    'session-tools: /session-tools route',
  )

  // ── Agent tool: the same two operations, model-facing ─────────────────────
  ctx.tools.register({
    name: 'session_tools',
    description:
      'Open a conversation folder in the OS file manager, or permanently delete a conversation record (its durable session log). Deletion cannot be undone.',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['open_folder', 'delete', 'storage_info', 'storage_set', 'storage_migrate'],
        description: 'Which operation to run.',
      },
      session_id: {
        type: 'string',
        description: 'For open_folder/delete: the session id to act on. Omit it to address the calling conversation.',
      },
      kind: {
        type: 'string',
        enum: ['sessions', 'storages'],
        description:
          'For storage operations: "sessions" is the conversation log root, "storages" is the cache/KV root (workspace records, projection cache).',
      },
      root: {
        type: 'string',
        description: 'For storage_set: the new absolute directory.',
      },
      migrate: {
        type: 'boolean',
        description: 'For storage_set: copy existing data into the new root before applying the change. On by default; keep it on or history will disappear.',
      },
      source: {
        type: 'string',
        description: 'For storage_migrate: absolute path of the old root to copy from. Defaults to the root used before the last storage_set.',
      },
      remove_source: {
        type: 'boolean',
        description: 'For storage_migrate: delete the source tree after copying. Requires an explicit source. Off by default.',
      },
      force: {
        type: 'boolean',
        description: 'For delete only: proceed even when the session is open in a live agent.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean' },
          action: { type: 'string' },
          detail: { type: 'string' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: `${value.action}: ${value.detail}` }],
    },
    async execute(args, exec) {
      try {
        if (args.action === 'storage_info') {
          const items = ['sessions', 'storages'].map((kind) => storageInfo(kind))
          return {
            ok: true,
            action: args.action,
            detail: items
              .map((i) => `${i.kind}: ${i.root} [configured=${String(i.configured)} editable=${String(i.editable)}]`)
              .join('; '),
          }
        }
        if (args.action === 'storage_set') {
          const result = await setStorageRoot(args.kind, args.root, { migrate: args.migrate !== false })
          if (!result.changed) {
            return { ok: true, action: args.action, detail: `${args.kind} root already ${result.root}` }
          }
          const moved = result.migration
          const copied = moved === undefined
            ? '; existing data was NOT copied'
            : moved.sourceMissing
              ? `; no old data at ${moved.source}`
              : `; copied ${moved.copied} file(s), replaced ${moved.overwritten}, skipped ${moved.skipped}, failed ${moved.failed} from ${moved.source}`
          return {
            ok: true,
            action: args.action,
            detail: `${args.kind} root set to ${result.root} (was ${result.previous}); written to ${result.patchPath}, RESTART the Harness to apply${copied}`,
          }
        }
        if (args.action === 'storage_migrate') {
          const result = await migrateStorage(args.kind, {
            source: args.source,
            removeSource: args.remove_source === true,
          })
          return {
            ok: true,
            action: args.action,
            detail: `from ${result.source}: copied ${result.copied}, replaced ${result.overwritten}, skipped ${result.skipped}, failed ${result.failed} into ${result.target}${result.removedSource ? '; source removed' : ''}`,
          }
        }
        const sessionId =
          typeof args.session_id === 'string' && args.session_id.trim() !== ''
            ? args.session_id.trim()
            : exec.agent?.session?.id
        if (typeof sessionId !== 'string') {
          return { ok: false, action: args.action, detail: 'no session id available; pass session_id' }
        }
        if (args.action === 'open_folder') {
          const result = await openFolder(sessionId, exec.signal)
          return { ok: true, action: 'open_folder', detail: `opened ${result.path}` }
        }
        const result = await deleteSession(sessionId, { force: args.force === true })
        return { ok: true, action: 'delete', detail: `removed ${result.removedPath}` }
      } catch (error) {
        return { ok: false, action: args.action, detail: error?.message ?? String(error) }
      }
    },
  })

  // The same verb, without a model message, for a human typing a slash command.
  ctx.commands.register({
    name: 'delete-session',
    description: 'Permanently delete this conversation record (removes its durable session log).',
    handler: async ({ agent }) => {
      try {
        const result = await deleteSession(agent.session.id, { force: true })
        return { kind: 'success', text: `Conversation record deleted: ${result.removedPath}` }
      } catch (error) {
        return { kind: 'error', text: error?.message ?? String(error) }
      }
    },
  })
}

export const inject = [
  'sessionPersistence',
  'sessionController',
  'workspaceRegistry',
  'sessions',
  'webServer',
  'connection',
  'tools',
  'commands',
]

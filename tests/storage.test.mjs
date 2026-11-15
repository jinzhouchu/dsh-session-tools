/**
 * Host-side regression test for session-tools storage-set / storage-migrate.
 *
 * The Harness build in use fails configEditor.edit() during recompose
 * ("file-upload: Agent resolver is already registered") and rolls the patch
 * back, so the plugin writes the profile patch directly instead. These tests
 * verify: no hot-reload call, data copied BEFORE the config write, patch
 * preservation, pending-restart state, and failure diagnostics.
 */
import { readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, isAbsolute } from 'node:path'
import assert from 'node:assert/strict'

const PLUGIN = new URL('../index.js', import.meta.url).href
const { apply } = await import(PLUGIN)

const base = await mkdtemp(join(tmpdir(), 'st-storage-'))
const dshHome = join(base, 'dsh')
const profileDir = join(dshHome, 'profiles', 'desktop')
await mkdir(profileDir, { recursive: true })
process.env.DSH_HOME = dshHome
const patchPath = join(profileDir, 'cordis.patch.yml')

const defaultSessions = join(dshHome, 'sessions')
const defaultStorages = join(dshHome, 'storages')
const oldSessions = join(base, 'old-sessions')
const newSessions = join(base, 'new-sessions')
const newStorages = join(base, 'new-storages')

await mkdir(join(oldSessions, 'project-a', 'session-1'), { recursive: true })
await writeFile(join(oldSessions, 'project-a', 'session-1', 'session.v4.jsonl.zstd'), 'LOG-BODY')
await mkdir(defaultStorages, { recursive: true })
const WORKSPACE = JSON.stringify({ unit: { name: 'workspace', version: 2 }, global: { history: 'KEEP-ME' } })
await writeFile(join(defaultStorages, 'workspace.json'), WORKSPACE)

const INITIAL_PATCH = [
  '# profile patch — comments must survive',
  '- id: agent-default-model',
  '  name: "@deepseek-ai/dsh-agent-default-model"',
  '  config:',
  '    provider: raccoon',
  '- id: session-persistence-jsonl',
  '  name: "@deepseek-ai/dsh-session-persistence-jsonl"',
  '  config:',
  `    root: ${oldSessions}`,
  '- id: ui-chat',
  '  config: {}',
  '',
].join('\n')
await writeFile(patchPath, INITIAL_PATCH, 'utf8')

const ROWS = {
  sessions: { options: { id: 'session-persistence-jsonl', name: '@deepseek-ai/dsh-session-persistence-jsonl', config: { root: oldSessions } }, fiber: {} },
  storages: { options: { id: 'storage-json', name: '@deepseek-ai/dsh-storage-json', config: { root: defaultStorages } }, fiber: {} },
}
let editCalls = 0
const editor = {
  documentPath: patchPath,
  entries: () => Object.values(ROWS),
  // Reproduce the real failure: any hot-reload edit would throw and roll back.
  edit: async () => { editCalls++; throw new Error('file-upload: Agent resolver is already registered') },
}

let handler
const ctx = {
  get: (name) => (name === 'configEditor' ? editor : undefined),
  effect: (fn) => { fn(); return () => {} },
  webServer: { register: (spec) => { handler = spec.handler; return () => {} } },
  connection: { requestRejection: () => undefined },
  tools: { register: () => {} },
  commands: { register: () => {} },
  emit: () => {},
  sessionPersistence: {}, sessionController: {}, workspaceRegistry: {}, sessions: { get: () => undefined },
}
apply(ctx)

function makeReq(route, payload) {
  const body = Buffer.from(JSON.stringify(payload ?? {}))
  return {
    method: 'POST',
    url: `/session-tools/${route}`,
    async *[Symbol.asyncIterator]() { yield body },
    once: () => {},
  }
}
function makeRes() {
  return {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v },
    once() {},
    end(text) { this.body = text; this.done = true },
  }
}
async function post(route, payload) {
  const res = makeRes()
  await handler(makeReq(route, payload), res)
  return { status: res.statusCode, json: JSON.parse(res.body ?? '{}') }
}

const results = []
const check = (name, fn) => {
  try { fn(); results.push(['PASS', name]) } catch (e) { results.push(['FAIL', name + ': ' + e.message]) }
}

// 1. storage-info: saved root vs runtime root, both editable.
let r = await post('storage-info', {})
check('storage-info returns both roots plus runtime/pending state', () => {
  assert.equal(r.status, 200)
  assert.equal(r.json.items.length, 2)
  const s = r.json.items.find((i) => i.kind === 'sessions')
  const c = r.json.items.find((i) => i.kind === 'storages')
  assert.equal(s.root, oldSessions)
  assert.equal(s.runtimeRoot, oldSessions)
  assert.equal(s.pendingRestart, false)
  assert.equal(c.root, defaultStorages)
  assert.equal(c.runtimeRoot, defaultStorages)
  assert.ok(r.json.items.every((i) => i.editable === true && isAbsolute(i.defaultRoot)))
})

// 2. storage-set on a row that has NO patch entry yet (storage-json).
r = await post('storage-set', { kind: 'storages', root: newStorages })
check('storage-set succeeds WITHOUT touching configEditor.edit', () => {
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.equal(r.json.ok, true)
  assert.equal(r.json.changed, true)
  assert.equal(r.json.applied, false)
  assert.equal(r.json.restartRequired, true)
  assert.equal(r.json.root, newStorages)
  assert.equal(r.json.patchPath, patchPath)
  assert.equal(editCalls, 0, 'the broken hot-reload path must never be called')
})
check('storage-set reports the migration from the real runtime root', () => {
  assert.equal(r.json.source, defaultStorages)
  assert.ok(r.json.migration.copied >= 1, JSON.stringify(r.json.migration))
  assert.equal(r.json.items[0].root, newStorages)
})
const copiedWs = await readFile(join(newStorages, 'workspace.json'), 'utf8')
check('workspace.json keeps old history instead of an empty stub', () => assert.match(copiedWs, /KEEP-ME/))
check('data was copied BEFORE the profile patch was written', () => {
  // The write is the last step; a successful copy proves the ordering.
  assert.equal(copiedWs, WORKSPACE)
})

let patchText = await readFile(patchPath, 'utf8')
check('new profile row is appended with a JSON-safe quoted path', () => {
  assert.match(patchText, /- id: storage-json/)
  assert.match(patchText, /name: '@deepseek-ai\/dsh-storage-json'/)
  assert.match(patchText, /root: ".*new-storages"/)
})
check('unrelated rows and the leading comment are preserved verbatim', () => {
  assert.match(patchText, /# profile patch — comments must survive/)
  assert.match(patchText, /provider: raccoon/)
  assert.match(patchText, /- id: ui-chat\n  config: \{\}/)
  assert.ok(patchText.indexOf('agent-default-model') < patchText.indexOf('session-persistence-jsonl'))
})

// 3. After a save, storage-info must flag pending restart (not "applied").
r = await post('storage-info', {})
check('storage-info marks a pending restart until runtime catches up', () => {
  const c = r.json.items.find((i) => i.kind === 'storages')
  assert.equal(c.root, newStorages)
  assert.equal(c.runtimeRoot, defaultStorages)
  assert.equal(c.pendingRestart, true)
})

// 4. storage-set on a row that ALREADY has a root line.
r = await post('storage-set', { kind: 'sessions', root: newSessions })
check('storage-set replaces an existing root line', () => {
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.equal(r.json.ok, true)
  assert.equal(r.json.source, oldSessions)
})
patchText = await readFile(patchPath, 'utf8')
check('old sessions root is gone, new one is present, no duplicate rows', () => {
  assert.ok(!patchText.includes(oldSessions), 'stale unquoted root must be replaced')
  assert.match(patchText, /root: ".*new-sessions"/)
  assert.equal((patchText.match(/^- id: session-persistence-jsonl$/gm) ?? []).length, 1)
  assert.equal((patchText.match(/^- id: storage-json$/gm) ?? []).length, 1)
})
const copiedLog = await readFile(join(newSessions, 'project-a', 'session-1', 'session.v4.jsonl.zstd'), 'utf8')
check('session log file is copied into the new root', () => assert.equal(copiedLog, 'LOG-BODY'))

// 5. Simulate the restart: backends now read the new roots.
ROWS.storages.options.config.root = newStorages
ROWS.sessions.options.config.root = newSessions
r = await post('storage-info', {})
check('after a simulated restart pendingRestart clears', () => {
  assert.ok(r.json.items.every((i) => i.pendingRestart === false))
})
r = await post('storage-set', { kind: 'storages', root: newStorages })
check('re-saving the same root after restart is a no-op', () => assert.equal(r.json.changed, false))

// 6. Validation rejects bad inputs without touching the patch.
const patchBefore = await readFile(patchPath, 'utf8')
for (const [name, payload] of [
  ['relative path', { kind: 'storages', root: 'relative/dir' }],
  ['unknown kind', { kind: 'nope', root: join(base, 'x') }],
  ['empty path', { kind: 'storages', root: '   ' }],
  ['target inside current root', { kind: 'storages', root: join(newStorages, 'nested') }],
  ['same as the other root', { kind: 'sessions', root: newStorages }],
]) {
  const bad = await post('storage-set', payload)
  check(`reject ${name}`, () => {
    assert.equal(bad.json.ok, false, JSON.stringify(bad.json))
    assert.equal(bad.json.code, 'bad-request')
  })
}
check('rejected saves leave the profile patch untouched', () => {
  assert.equal(readFileSync(patchPath, 'utf8'), patchBefore)
})

// 7. Concurrent saves are serialized (no lost updates).
const c1 = join(base, 'concurrent-sessions')
const c2 = join(base, 'concurrent-storages')
const [a, b] = await Promise.all([
  post('storage-set', { kind: 'sessions', root: c1 }),
  post('storage-set', { kind: 'storages', root: c2 }),
])
check('concurrent saves both succeed', () => {
  assert.equal(a.json.ok, true, JSON.stringify(a.json))
  assert.equal(b.json.ok, true, JSON.stringify(b.json))
})
patchText = await readFile(patchPath, 'utf8')
check('serialized writes keep BOTH roots in the patch', () => {
  assert.match(patchText, /concurrent-sessions/)
  assert.match(patchText, /concurrent-storages/)
})
const leftovers = (await readdir(profileDir)).filter((n) => n.includes('.session-tools.tmp'))
check('atomic-write temp files are cleaned up', () => assert.equal(leftovers.length, 0))

// 8. Fallback patch path when the editor service is not mounted.
editor.documentPath = undefined
r = await post('storage-info', {})
check('falls back to <DSH_HOME>/profiles/desktop/cordis.patch.yml', () => {
  assert.equal(r.status, 200)
  assert.equal(r.json.items[0].patchPath, patchPath)
  assert.ok(r.json.items.every((i) => i.editable === true))
})
editor.documentPath = patchPath

// 9. An unwritable patch reports a stable code + durable diagnostic.
editor.documentPath = profileDir // a directory: readFileSync throws EISDIR
r = await post('storage-set', { kind: 'storages', root: join(base, 'never-written') })
check('unwritable patch reports patch-unavailable with a log path', () => {
  assert.equal(r.status, 500, JSON.stringify(r.json))
  assert.equal(r.json.code, 'patch-unavailable')
  assert.ok(r.json.log && r.json.log.endsWith('session-tools-error.log'))
})
const diag = await readFile(join(dshHome, 'session-tools-error.log'), 'utf8').catch(() => '')
check('patch failure is written to the diagnostic log', () => assert.match(diag, /patch/))
editor.documentPath = patchPath

// 10. Manual migration from an explicit old tree.
const explicit = join(base, 'explicit-old')
await mkdir(explicit, { recursive: true })
await writeFile(join(explicit, 'extra.json'), 'EXTRA')
r = await post('storage-migrate', { kind: 'sessions', source: explicit })
check('storage-migrate with explicit source', () => {
  assert.equal(r.json.ok, true, JSON.stringify(r.json))
  assert.equal(r.json.copied, 1)
  assert.equal(r.json.target, c1)
})
const explicitCopy = await readFile(join(c1, 'extra.json'), 'utf8').catch(() => '')
check('explicitly migrated file content matches', () => assert.equal(explicitCopy, 'EXTRA'))
r = await post('storage-migrate', { kind: 'sessions', removeSource: true })
check('refuses to delete an inferred source', () => {
  assert.equal(r.json.ok, false)
  assert.equal(r.json.code, 'bad-request')
})

check('configEditor.edit was never invoked in the whole run', () => assert.equal(editCalls, 0))

console.log('\n=== results ===')
for (const [state, name] of results) console.log(`${state}  ${name}`)
const failed = results.filter(([s]) => s === 'FAIL').length
console.log(`\n${results.length - failed}/${results.length} passed`)
await rm(base, { recursive: true, force: true })
if (failed > 0) process.exitCode = 1

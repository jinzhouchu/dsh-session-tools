/** Client-side checks: localized error mapping, dictionary parity, URL fallback. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const file = fileURLToPath(new URL('../client.js', import.meta.url))
const original = readFileSync(file, 'utf8')
const marker = "    return {\n      inject: ['slots', 'locale'],"
assert.ok(original.includes(marker), 'factory return marker not found')
const patched = original.replace(
  marker,
  "    window.__internals = { describeError, callHost, DICTIONARIES }\n" + marker,
)

let captured
const calls = []
const responses = []
const sandbox = {
  window: { __ModuleLoader__: { load: (spec) => { captured = spec } } },
  document: { baseURI: 'http://127.0.0.1:65101/settings/storage' },
  URL,
  console,
  fetch: async (url) => {
    calls.push(url)
    return responses.shift()
  },
}
vm.runInNewContext(patched, sandbox, { filename: 'client.js' })
assert.ok(captured, 'module was not registered')
captured.factory(() => ({ createElement: () => null }))
const { describeError, callHost, DICTIONARIES } = sandbox.window.__internals

const results = []
const check = (name, fn) => {
  try { fn(); results.push(['PASS', name]) } catch (e) { results.push(['FAIL', name + ': ' + e.message]) }
}
const translate = (key, vars) => {
  let text = DICTIONARIES.zh[key] ?? DICTIONARIES.en[key] ?? key
  for (const k of Object.keys(vars ?? {})) text = text.split(`{${k}}`).join(String(vars[k]))
  return text
}

// 1. Dictionaries stay in sync
const zhKeys = Object.keys(DICTIONARIES.zh).sort().join('|')
const enKeys = Object.keys(DICTIONARIES.en).sort().join('|')
check('zh/en dictionary keys are identical', () => assert.equal(zhKeys, enKeys))

// 2. Storage errors map to storage-specific copy, not the conversation copy
check('bad-request uses storage wording', () => {
  const text = describeError(translate, { code: 'bad-request', message: 'x' })
  assert.match(text, /目录路径无效/)
  assert.doesNotMatch(text, /对话参数无效/)
})
check('unavailable maps to a profile-patch hint (not the old editor hint)', () => {
  const text = describeError(translate, { code: 'unavailable' })
  assert.match(text, /配置文件/)
  assert.doesNotMatch(text, /配置编辑器/)
})
check('not-found maps to a migration hint', () => {
  assert.match(describeError(translate, { code: 'not-found' }), /旧目录/)
})
check('conversation errors still use general copy', () => {
  assert.match(describeError(translate, { code: 'session-live' }), /该对话正在使用中/)
})
check('unknown code falls back to the Host message', () => {
  assert.match(describeError(translate, { code: 'weird', message: 'BOOM' }), /BOOM/)
})
check('no "error.xxx" key leaks to the UI', () => {
  const text = describeError(translate, { code: 'internal', message: 'BOOM' })
  assert.doesNotMatch(text, /^error\./)
})
check('internal errors keep the real Host message', () => {
  const text = describeError(translate, { code: 'internal', message: 'EBUSY: resource busy' })
  assert.match(text, /EBUSY: resource busy/)
  assert.match(text, /session-tools-error\.log/)
})
check('patch-unavailable keeps the file-system cause visible', () => {
  const text = describeError(translate, { code: 'patch-unavailable', message: 'cannot write C:/x/cordis.patch.yml: EACCES' })
  assert.match(text, /写入失败/)
  assert.match(text, /EACCES/)
})
check('route-unreachable keeps every attempted URL and status', () => {
  const text = describeError(translate, {
    code: 'route-unreachable',
    message: 'HTTP 405 at /a [/a: HTTP 405 (non-JSON) | /b: HTTP 405 (non-JSON)]',
  })
  assert.match(text, /插件接口不可达/)
  assert.match(text, /HTTP 405/)
  assert.match(text, /\/b: HTTP 405/)
})
check('no stale "applies immediately" copy remains', () => {
  for (const dict of Object.values(DICTIONARIES)) {
    for (const [key, value] of Object.entries(dict)) {
      if (!key.startsWith('storage.')) continue
      assert.doesNotMatch(value, /立即生效|无需重启|applied immediately|no restart needed/i, `${key}: ${value}`)
    }
  }
})
check('restart-required and pending-restart copy exists in both locales', () => {
  assert.match(DICTIONARIES.zh['storage.restart'], /重启/)
  assert.match(DICTIONARIES.en['storage.restart'], /restart/i)
  assert.match(DICTIONARIES.zh['storage.pendingRestart'], /\{runtime\}.*\{root\}/)
  assert.match(DICTIONARIES.en['storage.pendingRestart'], /\{runtime\}.*\{root\}/)
})

// 3. callHost prefers the origin-root URL and falls back to the page-relative one
const json = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(payload),
})
const empty = (status) => ({ ok: false, status, text: async () => '' })
calls.length = 0
responses.push(
  json(404, {}), // first attempt: a well-formed but non-plugin reply
  json(200, { ok: true, items: [] }),
)
let out = await callHost('storage-info', {})
check('callHost falls back when the first URL is not the plugin route', () => {
  assert.equal(out.ok, true)
  assert.equal(calls.length, 2)
  assert.equal(calls[0], 'http://127.0.0.1:65101/session-tools/storage-info')
  assert.equal(calls[1], 'http://127.0.0.1:65101/settings/session-tools/storage-info')
})

calls.length = 0
responses.push(json(200, { ok: true, value: 1 }))
out = await callHost('storage-set', { kind: 'sessions' })
check('callHost stops at the first successful URL', () => {
  assert.equal(calls.length, 1)
  assert.equal(calls[0], 'http://127.0.0.1:65101/session-tools/storage-set')
})

calls.length = 0
responses.push(json(400, { ok: false, code: 'bad-request', message: 'bad' }))
let thrown
try { await callHost('storage-set', {}) } catch (e) { thrown = e }
check('a plugin-shaped error is authoritative and stops the fallback loop', () => {
  assert.equal(thrown?.code, 'bad-request')
  assert.equal(thrown?.message, 'bad')
  assert.equal(calls.length, 1, 'must not let a later 405 overwrite the real code')
})

// 4. The original symptom: every URL answers 405 with an empty body.
calls.length = 0
responses.push(empty(405), empty(405))
thrown = undefined
try { await callHost('storage-set', {}) } catch (e) { thrown = e }
check('bare 405 replies become route-unreachable, not a silent "internal"', () => {
  assert.equal(thrown?.code, 'route-unreachable')
  assert.equal(calls.length, 2)
  assert.match(thrown.message, /HTTP 405/)
  assert.match(thrown.message, /\/session-tools\/storage-set: HTTP 405 \(non-JSON\)/)
})
check('describeError renders the 405 diagnostic instead of swallowing it', () => {
  const text = describeError(translate, thrown)
  assert.match(text, /插件接口不可达/)
  assert.match(text, /HTTP 405/)
})

console.log('\n=== results ===')
for (const [state, name] of results) console.log(`${state}  ${name}`)
const failed = results.filter(([s]) => s === 'FAIL').length
console.log(`\n${results.length - failed}/${results.length} passed`)
if (failed > 0) process.exitCode = 1

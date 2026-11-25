/** Model-picker filter: pure helpers + DOM-observer integration against a mock host picker. */
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
  '    window.__internals = { mfNormalize, mfTokens, mfIdKeys, mfIsVision, mfBuildIndex, mfTokenMatch, mfLookup, mfShouldShow, mfGroupHeading, mfGroupOf, mfProviderOf, mfKilo, mfQuotaValue, mfQuotaTotal, mfBadgeBody, mfUnwrapQuota, mfShortError, QUOTA_METHOD, QUOTA_PROVIDERS, mfReadState, mfWriteState, startModelFilter, MF_CSS, DICTIONARIES }\n' + marker,
)

// ── minimal DOM ─────────────────────────────────────────────────────────────
let textWrites = 0
class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase()
    this.attributes = Object.create(null)
    this.children = []
    this.parentElement = null
    this.dataset = {}
    this.style = {}
    this.className = ''
    this._text = ''
    this._hidden = false
    this.isConnected = true
    this._listeners = Object.create(null)
  }
  setAttribute(name, value) {
    const v = String(value)
    this.attributes[name] = v
    if (name === 'hidden') this._hidden = true
    if (name === 'class') this.className = v
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      this.dataset[camel] = v
    }
  }
  getAttribute(name) { return name in this.attributes ? this.attributes[name] : null }
  set hidden(v) {
    this._hidden = Boolean(v)
    if (v) this.attributes.hidden = ''
    else delete this.attributes.hidden
  }
  get hidden() { return this._hidden }
  set textContent(v) { textWrites += 1; this._text = String(v); this.children = [] }
  get textContent() {
    return this._text || this.children.map((c) => c.textContent).join('')
  }
  set innerHTML(html) {
    // Build a real tree. A flat list of tags hides bugs where a click lands on
    // an inner <span> and `closest()` must walk up to the enclosing <button>.
    this._text = ''
    this.children = []
    const VOID = new Set(['input', 'br', 'img', 'path', 'hr', 'meta', 'link'])
    const tokens = html.match(/<[^>]*>|[^<]+/g) ?? []
    const stack = [this]
    for (const token of tokens) {
      if (token.startsWith('</')) {
        if (stack.length > 1) stack.pop()
        continue
      }
      if (token.startsWith('<')) {
        const m = token.match(/^<([a-zA-Z][\w-]*)([^>]*?)(\/?)>$/)
        if (!m) continue
        const el = new El(m[1])
        const attrs = /([:\w-]+)(?:="([^"]*)")?/g
        let a
        attrs.lastIndex = 0
        while ((a = attrs.exec(m[2]))) el.setAttribute(a[1], a[2] ?? '')
        stack[stack.length - 1].appendChild(el)
        if (m[3] !== '/' && !VOID.has(m[1].toLowerCase())) stack.push(el)
      } else if (token.trim()) {
        stack[stack.length - 1]._text += token
      }
    }
  }
  get innerHTML() { return '' }
  appendChild(child) {
    child.parentElement = this
    this.children.push(child)
    return child
  }
  get firstChild() { return this.children[0] ?? null }
  insertBefore(node, ref) {
    if (node.parentElement) {
      const prev = node.parentElement
      const old = prev.children.indexOf(node)
      if (old >= 0) prev.children.splice(old, 1)
    }
    const i = ref ? this.children.indexOf(ref) : -1
    if (i >= 0) this.children.splice(i, 0, node)
    else this.children.push(node)
    node.parentElement = this
    return node
  }
  get nextElementSibling() {
    const p = this.parentElement
    if (!p) return null
    const i = p.children.indexOf(this)
    return i >= 0 ? (p.children[i + 1] ?? null) : null
  }
  after(node) {
    const p = this.parentElement
    if (!p) return
    // Real DOM moves an existing node instead of duplicating it.
    if (node.parentElement) {
      const prev = node.parentElement
      const old = prev.children.indexOf(node)
      if (old >= 0) prev.children.splice(old, 1)
    }
    const i = p.children.indexOf(this)
    p.children.splice(i + 1, 0, node)
    node.parentElement = p
  }
  remove() {
    const p = this.parentElement
    if (p) {
      const i = p.children.indexOf(this)
      if (i >= 0) p.children.splice(i, 1)
    }
    this.parentElement = null
    this.isConnected = false
  }
  contains(node) {
    return node === this || this.children.some((c) => c.contains(node))
  }
  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn) }
  dispatch(type, target) {
    for (const fn of this._listeners[type] || []) fn({ target })
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null }
  querySelectorAll(sel) {
    const out = []
    const walk = (node) => {
      for (const c of node.children) {
        if (matches(c, sel)) out.push(c)
        walk(c)
      }
    }
    walk(this)
    return out
  }
  closest(sel) {
    let el = this
    while (el) {
      if (matches(el, sel)) return el
      el = el.parentElement
    }
    return null
  }
}

function matches(el, sel) {
  if (sel === 'input[role="searchbox"][aria-controls$="-models"]') {
    return el.tagName === 'INPUT' && el.getAttribute('role') === 'searchbox' &&
      String(el.getAttribute('aria-controls') || '').endsWith('-models')
  }
  if (sel === 'button[role="menuitemradio"]') {
    return el.tagName === 'BUTTON' && el.getAttribute('role') === 'menuitemradio'
  }
  if (sel === '[data-model-id]') return el.getAttribute('data-model-id') !== null
  if (sel === '[id]') return el.getAttribute('id') !== null
  if (sel === '[data-mf]') return el.getAttribute('data-mf') !== null
  if (sel === 'button[data-mf]') {
    return el.tagName === 'BUTTON' && el.getAttribute('data-mf') !== null
  }
  if (sel === '[data-menu-group]') return el.getAttribute('data-menu-group') !== null
  if (sel === '[data-menu-group-heading]') return el.getAttribute('data-menu-group-heading') !== null
  if (sel === '[data-st-mf-fold]') return el.getAttribute('data-st-mf-fold') !== null
  if (sel === '[id$="-menu"]') return String(el.getAttribute('id') || '').endsWith('-menu')
  const m = sel.match(/^\[data-mf="([^"]+)"\]$/)
  if (m) return el.getAttribute('data-mf') === m[1]
  return false
}

function makeDoc() {
  const body = new El('body')
  const menu = new El('div')
  menu.setAttribute('id', 'ms-1-menu')
  const searchRow = new El('div')
  const box = new El('input')
  box.setAttribute('role', 'searchbox')
  box.setAttribute('aria-controls', 'ms-1-models')
  searchRow.appendChild(box)
  menu.appendChild(searchRow)
  const list = new El('div')
  list.setAttribute('id', 'ms-1-models')
  list.setAttribute('role', 'menu')
  menu.appendChild(list)
  body.appendChild(menu)
  return { body, menu, searchRow, box, list }
}

function addGroup(list, name, models) {
  const group = new El('div')
  group.setAttribute('role', 'group')
  group.setAttribute('data-menu-group', '')
  const label = new El('div')
  label.setAttribute('data-menu-group-heading', '')
  label.textContent = name
  group.appendChild(label)
  for (const m of models) {
    const button = new El('button')
    button.setAttribute('role', 'menuitemradio')
    button.setAttribute('title', m.name)
    const idSpan = new El('span')
    idSpan.setAttribute('data-model-id', m.id)
    button.appendChild(idSpan)
    group.appendChild(button)
  }
  list.appendChild(group)
  return group
}

const CATALOG = [
  { id: 'kilo-auto/free', name: 'Kilo Auto Free', availability: 'available', probedAt: 1, vision: false },
  { id: 'nvidia/nemotron-3.5-super-vl:free', name: 'Kilo Nemotron 3.5 Super VL', availability: 'available', probedAt: 1, vision: true },
  { id: 'mimo-v2.6-flash-free', name: 'MiMo V2.6 Flash', availability: 'throttled', vision: true },
  { id: 'glm-5.3-flash-free', name: 'GLM 5.3 Flash', availability: 'region-blocked', vision: false },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', availability: 'unknown', vision: false },
]

const rafQueue = []
class MO {
  constructor(cb) { this.cb = cb; this.observing = []; MO.all.push(this) }
  observe(target, options) { this.observing.push({ target, options }) }
  disconnect() { this.observing = [] }
  trigger() { this.cb([]) }
}
MO.all = []

const store = new Map()
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
}

let fetchError = null
let fetchPayload = { catalog: CATALOG }
const fetchCalls = []
const quotaCalls = []
const quotaPayloads = {
  lobsterai: { accounts: [{ accountId: 'a1', balance: { total: 12345 } }] },
  cline: { accounts: [{ accountId: 'b1', balance: { total: 3.456 } }] },
}
const fetch = async (url, options) => {
  fetchCalls.push(url)
  // Best-effort diagnostics must not look like a quota lookup or a summary call.
  if (String(url).includes('/session-tools/quota-log')) {
    return { ok: true, status: 200, json: async () => ({ ok: true }) }
  }
  // The channel-pack gateway is a different host route and must keep working
  // even while the summary endpoint is being forced to fail by a later test.
  if (String(url).includes('/api/channel-pack')) {
    const body = JSON.parse(options?.body || '{}')
    const inner = body?.payload?.payload ?? {}
    quotaCalls.push({ provider: inner.provider, force: inner.force === true })
    const snapshot = quotaPayloads[inner.provider]
    const result = snapshot
      ? { ok: true, value: snapshot }
      : { ok: false, error: { code: 'no-account', message: '未接入该厂商账号' } }
    return { ok: true, status: 200, json: async () => ({ type: 'server-response', result }) }
  }
  if (fetchError) throw new Error(fetchError)
  return { ok: true, status: 200, json: async () => fetchPayload }
}

const { body, menu, searchRow, list } = makeDoc()
addGroup(list, 'Our Free Model', CATALOG.slice(0, 3))
addGroup(list, 'Region', CATALOG.slice(3))

const docListeners = Object.create(null)
const document = {
  body,
  documentElement: body,
  baseURI: 'http://127.0.0.1:65101/chat/abc',
  createElement: (tag) => new El(tag),
  querySelector: (sel) => body.querySelector(sel),
  querySelectorAll: (sel) => body.querySelectorAll(sel),
  getElementById: (id) => body.querySelectorAll('[id]').find((el) => el.getAttribute('id') === id) ?? null,
  addEventListener: (type, fn) => { (docListeners[type] ||= []).push(fn) },
  removeEventListener: (type, fn) => {
    const list = docListeners[type] || []
    const i = list.indexOf(fn)
    if (i >= 0) list.splice(i, 1)
  },
  dispatch: (type, target) => {
    for (const fn of docListeners[type] || []) fn({ target })
  },
}
let captured
const sandbox = {
  window: { __ModuleLoader__: { load: (spec) => { captured = spec } } },
  document,
  Element: El,
  MutationObserver: MO,
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length },
  cancelAnimationFrame: () => {},
  localStorage,
  URL,
  console,
  fetch,
}
vm.runInNewContext(patched, sandbox, { filename: 'client.js' })
assert.ok(captured, 'module was not registered')
captured.factory(() => ({ createElement: () => null }))
const I = sandbox.window.__internals

const results = []
const check = (name, fn) => {
  try {
    const value = fn()
    if (value && typeof value.then === 'function') throw new Error('use checkAsync for async cases')
    results.push(['PASS', name])
  } catch (e) { results.push(['FAIL', name + ': ' + e.message]) }
}
const checkAsync = async (name, fn) => {
  try { await fn(); results.push(['PASS', name]) } catch (e) { results.push(['FAIL', name + ': ' + e.message]) }
}
const tick = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
  while (rafQueue.length) rafQueue.shift()(1)
  // Quota lookups resolve through an async fetch + a .finally() pump chain.
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}
const translate = (key, vars) => {
  let text = I.DICTIONARIES.zh[key] ?? I.DICTIONARIES.en[key] ?? key
  for (const k of Object.keys(vars ?? {})) text = text.split(`{${k}}`).join(String(vars[k]))
  return text
}

// ── pure helpers ────────────────────────────────────────────────────────────
check('normalize strips case, punctuation and spaces', () => {
  assert.equal(I.mfNormalize('Cline Astra Opus10 20261114 Azure R1'), 'clineastraopus1020261114azurer1')
  assert.equal(I.mfNormalize('Kilo Auto / Free (限时免费)'), 'kiloautofree限时免费')
})
check('vision accepts boolean vision and inputModalities', () => {
  assert.equal(I.mfIsVision({ vision: true }), true)
  assert.equal(I.mfIsVision({ inputModalities: ['text', 'image'] }), true)
  assert.equal(I.mfIsVision({ vision: false, inputModalities: ['text'] }), false)
  assert.equal(I.mfIsVision(null), false)
})
check('buildIndex tolerates junk and de-duplicates ids', () => {
  const idx = I.mfBuildIndex([null, 3, CATALOG[0], { ...CATALOG[0] }, { id: '', name: '' }])
  assert.equal(idx.byId.size, 1)
  assert.equal(idx.size, 2) // blank rows are dropped, duplicate ids are de-duplicated
  assert.equal(idx.byName.get(I.mfNormalize('Kilo Auto Free')).availability, 'available')
  assert.ok(idx.names[0][0].length >= idx.names[idx.names.length - 1][0].length)
})
check('buildIndex with non-array input yields an empty index', () => {
  assert.equal(I.mfBuildIndex(null).size, 0)
  assert.equal(I.mfBuildIndex({ catalog: [] }).size, 0)
})
check('idKeys indexes namespaced ids but skips short generic tails', () => {
  // vm realms have distinct Array prototypes, so compare joined strings.
  assert.equal(I.mfIdKeys('our-free-model:mimo-v2.6-flash-free').join('|'), 'ourfreemodelmimov26flashfree|mimov26flashfree')
  assert.equal(I.mfIdKeys('kilo-auto/free').join('|'), 'kiloautofree')
})
check('token weights favour rare words in a renamed label', () => {
  const idx = I.mfBuildIndex(CATALOG)
  const hit = I.mfTokenMatch(idx, 'Free Auto Kilo 20261114')
  assert.equal(hit.id, 'kilo-auto/free')
  assert.equal(I.mfTokenMatch(idx, 'totally unrelated wording'), null)
})
check('lookup resolves a provider-prefixed host id', () => {
  const idx = I.mfBuildIndex(CATALOG)
  const option = new El('button')
  option.setAttribute('title', 'Cline Astra Opus10 20261114 Azure R1')
  const span = new El('span')
  span.setAttribute('data-model-id', 'our-free-model:mimo-v2.6-flash-free')
  option.appendChild(span)
  assert.equal(I.mfLookup(idx, option).id, 'mimo-v2.6-flash-free')
})
check('lookup prefers data-model-id over the visible label', () => {
  const idx = I.mfBuildIndex(CATALOG)
  const option = new El('button')
  option.setAttribute('title', 'totally different label')
  const span = new El('span')
  span.setAttribute('data-model-id', 'mimo-v2.6-flash-free')
  option.appendChild(span)
  assert.equal(I.mfLookup(idx, option).availability, 'throttled')
})
check('lookup falls back to an exact normalized title', () => {
  const idx = I.mfBuildIndex(CATALOG)
  const option = new El('button')
  option.setAttribute('title', 'GLM 5.3 Flash')
  assert.equal(I.mfLookup(idx, option).availability, 'region-blocked')
})
check('lookup falls back to a containment match for dated labels', () => {
  const idx = I.mfBuildIndex(CATALOG)
  const option = new El('button')
  option.setAttribute('title', 'Kilo Auto Free 20261114 Azure R1')
  assert.equal(I.mfLookup(idx, option).id, 'kilo-auto/free')
})
check('lookup returns null when nothing matches', () => {
  const idx = I.mfBuildIndex(CATALOG)
  const option = new El('button')
  option.setAttribute('title', 'Some Native Official Model')
  assert.equal(I.mfLookup(idx, option), null)
})
check('no filters shows every row', () => {
  for (const meta of [null, ...CATALOG]) assert.equal(I.mfShouldShow(meta, {}), true)
})
check('available-only drops throttled / region-blocked / unavailable / unknown rows', () => {
  const f = { available: true }
  assert.equal(I.mfShouldShow(CATALOG[0], f), true)
  assert.equal(I.mfShouldShow(CATALOG[2], f), false)
  assert.equal(I.mfShouldShow(CATALOG[3], f), false)
  assert.equal(I.mfShouldShow(CATALOG[4], f), false)
  assert.equal(I.mfShouldShow({ availability: 'unavailable' }, f), false)
})
check('unknown rows are shown when no filter is active', () => {
  assert.equal(I.mfShouldShow(null, {}), true)
  assert.equal(I.mfShouldShow(null, { showUnknown: true }), true)
})
check('unknown rows are hidden once a filter is active (the 520-row problem)', () => {
  assert.equal(I.mfShouldShow(null, { available: true }), false)
  assert.equal(I.mfShouldShow(null, { multimodal: true }), false)
})
check('showUnknown restores unknown rows without weakening other filters', () => {
  const f = { available: true, showUnknown: true }
  assert.equal(I.mfShouldShow(null, f), true)
  assert.equal(I.mfShouldShow(CATALOG[0], f), true)
  assert.equal(I.mfShouldShow(CATALOG[2], f), false)
})
check('multimodal-only keeps vision rows and hides unknown rows', () => {
  const f = { multimodal: true }
  assert.equal(I.mfShouldShow(CATALOG[1], f), true)
  assert.equal(I.mfShouldShow(CATALOG[2], f), true)
  assert.equal(I.mfShouldShow(CATALOG[0], f), false)
  assert.equal(I.mfShouldShow(null, f), false)
})
check('filters combine with AND', () => {
  const f = { available: true, multimodal: true }
  assert.equal(I.mfShouldShow(CATALOG[1], f), true)
  assert.equal(I.mfShouldShow(CATALOG[2], f), false)
  assert.equal(I.mfShouldShow(CATALOG[0], f), false)
})
// ── provider quota helpers ─────────────────────────────────────────────────
check('provider aliases resolve source headings, most specific first', () => {
  assert.equal(I.mfProviderOf('LobsterAI (有道)').id, 'lobsterai')
  assert.equal(I.mfProviderOf('Cline').id, 'cline')
  assert.equal(I.mfProviderOf('Qoder 中国版').id, 'qodercn')
  assert.equal(I.mfProviderOf('WorkBuddy 国内版').id, 'buddy')
  assert.equal(I.mfProviderOf('WorkBuddy 国际版').id, 'workbuddy')
  assert.equal(I.mfProviderOf('ZCode (智谱)').unit, 'tokens')
  assert.equal(I.mfProviderOf('Gemini').unit, 'count')
  assert.equal(I.mfProviderOf('Our Free Model'), null)
  assert.equal(I.mfProviderOf('AI'), null)
})
check('quota formatting compacts large numbers and keeps dollars precise', () => {
  assert.equal(I.mfKilo(12345), '12K')
  assert.equal(I.mfKilo(2_400_000), '2.4M')
  assert.equal(I.mfKilo(42), '42')
  assert.equal(I.mfKilo('nope'), '')
})
check('quota totals sum enabled accounts and expose missing balances', () => {
  const sum = I.mfQuotaTotal({ accounts: [
    { balance: { total: 1000 } }, { balance: { total: 250 } }, { balance: null },
  ] })
  assert.equal(sum.total, 1250)
  assert.equal(sum.known, 2)
  assert.equal(sum.accounts, 3)
  assert.equal(I.mfQuotaTotal({ accounts: [] }).known, 0)
})
check('channel-pack RPC body uses the documented envelope', () => {
  const body = I.mfBadgeBody('cline', true)
  assert.equal(body.type, 'client-request')
  assert.equal(body.method, 'channel-pack')
  assert.equal(body.payload.method, 'credits.balances')
  assert.equal(I.QUOTA_METHOD, 'credits.balances')
  // The vm realm has its own Object prototype, so compare serialised values.
  assert.equal(JSON.stringify(body.payload.payload), '{"provider":"cline","force":true}')
  assert.ok(body.rpcId)
})
check('quota response unwraps HTTP envelope, raw value and RPC errors', () => {
  const snapshot = { accounts: [{ balance: { total: 7 } }] }
  assert.equal(I.mfUnwrapQuota({ ok: true, value: snapshot }), snapshot)
  assert.equal(I.mfUnwrapQuota(snapshot), snapshot)
  assert.throws(() => I.mfUnwrapQuota({ ok: false, error: { message: 'boom' } }), /boom/)
  assert.throws(() => I.mfUnwrapQuota({ ok: true, value: {} }), /unexpected payload/)
})
check('quota badge CSS renders via attr() without touching heading text', () => {
  assert.match(I.MF_CSS, /\[data-st-mf-quota\]::after/)
  assert.match(I.MF_CSS, /content:attr\(data-st-mf-quota\)/)
})
check('balances expressed as a bare number or packages still sum correctly', () => {
  const sum = I.mfQuotaTotal({ accounts: [
    { balance: 800 },                                    // CodeArts-style
    { balance: { packages: [                            // package-only adapters
      { remaining: 200, active: true }, { remaining: 50, active: false },
    ] } },
    { balance: { remaining: '12.5' } },
    { balance: null },
  ] })
  assert.equal(sum.total, 1012.5)
  assert.equal(sum.known, 3)
  assert.equal(sum.accounts, 4)
  assert.equal(I.mfQuotaValue({}), null)
})
check('quota formatting matches the channel cards (10K / 6.0K / 0)', () => {
  assert.equal(I.mfKilo(10000), '10K')
  assert.equal(I.mfKilo(6000), '6.0K')
  assert.equal(I.mfKilo(0), '0')
  assert.equal(I.mfKilo(12345), '12K')
})
check('quota unwrapping tolerates nested HTTP / data envelopes', () => {
  const accounts = [{ balance: { total: 7 } }]
  assert.equal(I.mfUnwrapQuota({ type: 'server-response', result: { ok: true, value: { accounts } } }).accounts, accounts)
  assert.equal(I.mfUnwrapQuota({ data: { accounts } }).accounts, accounts)
  assert.throws(() => I.mfUnwrapQuota({ result: { ok: false, error: { code: 'x', message: 'denied' } } }), /denied/)
})
check('short error codes distinguish timeout, HTTP status and connection', () => {
  assert.equal(I.mfShortError('The operation was aborted'), 'timeout')
  assert.equal(I.mfShortError('HTTP 401'), 'HTTP401')
  assert.equal(I.mfShortError('no-connection'), 'no-conn')
  assert.equal(I.mfShortError('unexpected payload'), 'payload')
  assert.equal(I.mfShortError(''), 'error')
})

check('zh/en dictionary keys stay in sync', () => {
  assert.equal(Object.keys(I.DICTIONARIES.zh).sort().join('|'), Object.keys(I.DICTIONARIES.en).sort().join('|'))
})
check('filter copy exists in both languages', () => {
  assert.match(translate('filter.available'), /仅可用/)
  assert.match(I.DICTIONARIES.en['filter.multimodal'], /Multimodal/)
  assert.match(I.DICTIONARIES.en['filter.noData'], /Could not read model status/)
  assert.match(translate('filter.stat', { shown: 2, total: 5 }), /2 \/ 5/)
})
check('CSS supports hidden + theme aliases', () => {
  assert.match(I.MF_CSS, /\.st-mf \[hidden\]\{display:none!important\}/)
  assert.match(I.MF_CSS, /--dsw-alias-accent-bg/)
})

// ── integration: mock host picker ──────────────────────────────────────────
// Mirror real Cordis behaviour: reading `ctx.connection` without an inject
// entry THROWS, and only `ctx.get('connection')` yields the service. The RPC
// itself speaks an incompatible dialect, so quota must fall back to the HTTP
// gateway instead of silently showing "—".
let rpcCalls = 0
let getConnectionCalls = 0
const shellRpc = {
  rpc: { call: async () => { rpcCalls += 1; throw new Error('no-connection') } },
}
const shellCtx = {
  get connection() { throw new Error('cannot get property "connection" without inject') },
  get(name) {
    if (name === 'connection') { getConnectionCalls += 1; return shellRpc }
    return undefined
  },
}
const cleanup = I.startModelFilter(translate, shellCtx)
const bar = menu.querySelector('.st-mf') || menu.children.find((c) => c.className === 'st-mf')
check('filter bar is mounted directly after the search row', () => {
  assert.ok(bar, 'bar not mounted')
  assert.equal(bar.parentElement, menu)
  assert.equal(menu.children.indexOf(bar), menu.children.indexOf(searchRow) + 1)
})
check('bar renders chips expanded by default (no extra click needed)', () => {
  assert.equal(bar.querySelector('[data-mf="label"]').textContent, '筛选')
  assert.equal(bar.querySelector('[data-mf="toggle"]').getAttribute('aria-expanded'), 'true')
  assert.equal(bar.querySelector('[data-mf="chips"]').hidden, false)
  assert.equal(bar.querySelector('[data-mf="badge"]').hidden, true)
})

await checkAsync('summary endpoint is the ofm plugin route', async () => {
  await tick()
  assert.ok(fetchCalls.length >= 1, 'no fetch')
  assert.ok(fetchCalls[0].endsWith('/api/our-free-model/summary'), fetchCalls[0])
})
await checkAsync('unfiltered stat reports all models and metadata coverage', async () => {
  await tick()
  const stat = bar.querySelector('[data-mf="stat"]').textContent
  assert.match(stat, /5 \/ 5|显示 5 \/ 5/)
  assert.match(bar.querySelector('[data-mf="unknown"]').textContent, /未知 0 · 元数据 5 条/)
})

// A real click lands on the inner <span data-mf="label"> (the visible text),
// not on the button. Resolving to the closest button is what makes it respond.
const label = bar.querySelector('[data-mf="label"]')
const chips = () => bar.querySelector('[data-mf="chips"]')
const toggle = () => bar.querySelector('[data-mf="toggle"]')
bar.dispatch('click', label)
check('clicking the button label collapses the chips', () => {
  assert.equal(chips().hidden, true)
  assert.equal(toggle().getAttribute('aria-expanded'), 'false')
})
bar.dispatch('click', label)
check('clicking the label again re-expands all three chips', () => {
  assert.equal(chips().hidden, false)
  assert.equal(bar.querySelector('[data-mf="available"]').textContent, '仅可用')
  assert.equal(bar.querySelector('[data-mf="multimodal"]').textContent, '仅多模态')
  assert.equal(bar.querySelector('[data-mf="showUnknown"]').textContent, '显示未知')
})

// Press-time activation survives the host replacing the node before mouseup;
// the trailing click must not toggle the same chip a second time.
const availableChip = bar.querySelector('[data-mf="available"]')
bar.dispatch('pointerdown', availableChip)
check('pointerdown activates the chip immediately', () => {
  assert.equal(availableChip.getAttribute('aria-pressed'), 'true')
})
bar.dispatch('click', availableChip)
check('the trailing click does not undo the pointerdown activation', () => {
  assert.equal(availableChip.getAttribute('aria-pressed'), 'true')
})
bar.dispatch('click', availableChip)
check('a genuine second click toggles the chip back off', () => {
  assert.equal(availableChip.getAttribute('aria-pressed'), 'false')
})

await checkAsync('host mutations never rebuild the mounted bar', async () => {
  const mounted = menu.children.find((c) => c.className === 'st-mf')
  const bodyObsMount = MO.all.find((o) => o.observing.some((x) => x.target === body))
  bodyObsMount.trigger()
  await tick()
  assert.equal(menu.children.filter((c) => c.className === 'st-mf').length, 1)
  assert.equal(menu.children.find((c) => c.className === 'st-mf'), mounted)
  assert.ok((mounted._listeners.click || []).length > 0, 'click listener was lost')
})

bar.dispatch('click', bar.querySelector('[data-mf="available"]'))
const options = () => list.querySelectorAll('button[role="menuitemradio"]')
check('available-only hides throttled / region-blocked / unknown options', () => {
  const flags = options().map((o) => o.style.display)
  assert.deepEqual(flags, ['', '', 'none', 'none', 'none'])
})
check('available-only hides the empty region group and shows the active one', () => {
  const groups = list.children.filter((c) => c.getAttribute('role') === 'group')
  assert.equal(groups[0].style.display, '')
  assert.equal(groups[1].style.display, 'none')
})
check('badge, stat and pressed state update', () => {
  assert.equal(bar.querySelector('[data-mf="badge"]').hidden, false)
  assert.equal(bar.querySelector('[data-mf="badge"]').textContent, '1')
  assert.equal(bar.querySelector('[data-mf="available"]').getAttribute('aria-pressed'), 'true')
  assert.match(bar.querySelector('[data-mf="stat"]').textContent, /2 \/ 5/)
})

bar.dispatch('click', bar.querySelector('[data-mf="multimodal"]'))
check('adding multimodal narrows to available + vision', () => {
  assert.deepEqual(options().map((o) => o.style.display), ['none', '', 'none', 'none', 'none'])
  assert.equal(bar.querySelector('[data-mf="badge"]').textContent, '2')
})

bar.dispatch('click', bar.querySelector('[data-mf="clear"]'))
check('clear restores every option and every group', () => {
  assert.deepEqual(options().map((o) => o.style.display), ['', '', '', '', ''])
  assert.equal(bar.querySelector('[data-mf="badge"]').hidden, true)
  assert.equal(bar.querySelector('[data-mf="clear"]').hidden, true)
  for (const g of list.children.filter((c) => c.getAttribute('role') === 'group')) {
    assert.equal(g.style.display, '')
  }
})
check('filter choices persist to localStorage', () => {
  const raw = JSON.parse(localStorage.getItem('session-tools.modelFilter.v1'))
  assert.equal(raw.available, false)
  assert.equal(raw.multimodal, false)
  assert.equal(raw.expanded, true)
})

// Simulate a React re-render adding an option while a filter is active.
bar.dispatch('click', bar.querySelector('[data-mf="available"]'))
const dynamic = new El('button')
dynamic.setAttribute('role', 'menuitemradio')
dynamic.setAttribute('title', 'New Dynamic Model')
list.children[0].appendChild(dynamic)
const listObs = MO.all.find((o) => o.observing.some((x) => x.target === list))
await checkAsync('list observer re-applies filtering after host re-render', async () => {
  assert.ok(listObs, 'no list observer')
  listObs.trigger()
  await tick()
  assert.equal(dynamic.style.display, 'none') // no metadata, hidden while filtering
  assert.equal(options()[2].style.display, 'none')
})
check('showUnknown restores the unmatched model without unhiding throttled ones', () => {
  bar.dispatch('click', bar.querySelector('[data-mf="showUnknown"]'))
  assert.equal(dynamic.style.display, '')
  assert.equal(options()[2].style.display, 'none')
  assert.equal(bar.querySelector('[data-mf="showUnknown"]').getAttribute('aria-pressed'), 'true')
})

await checkAsync('repeated host mutations never rewrite identical DOM text', async () => {
  const bodyObsEarly = MO.all.find((o) => o.observing.some((x) => x.target === body))
  textWrites = 0
  bodyObsEarly.trigger()
  bodyObsEarly.trigger()
  await tick()
  assert.equal(textWrites, 0, 'render is feeding the observer loop')
})

// Simulate a failing summary endpoint.
fetchError = 'ECONNREFUSED'
const retry = bar.querySelector('[data-mf="retry"]')
bar.dispatch('click', retry)
await checkAsync('failed metadata read surfaces an inline warning + retry', async () => {
  await tick()
  assert.equal(bar.querySelector('[data-mf="noData"]').hidden, false)
  assert.match(bar.querySelector('[data-mf="noData"]').textContent, /ECONNREFUSED/)
  assert.equal(bar.querySelector('[data-mf="retry"]').hidden, false)
})

// ── per-source collapse / expand ──────────────────────────────────────────
bar.dispatch('click', bar.querySelector('[data-mf="clear"]'))
const groupNodes = list.children.filter((c) => c.getAttribute('role') === 'group')
const headings = () => list.querySelectorAll('[data-menu-group-heading]')
const foldButtons = () => list.querySelectorAll('[data-st-mf-fold]')

check('each source heading gets a fold button and a stable key', () => {
  assert.equal(headings().length, 2)
  assert.equal(foldButtons().length, 2)
  assert.equal(headings()[0].getAttribute('data-st-mf-key'), 'Our Free Model')
  assert.equal(headings()[1].getAttribute('data-st-mf-key'), 'Region')
  assert.equal(foldButtons()[0].textContent, '▾')
  assert.equal(foldButtons()[0].getAttribute('aria-expanded'), 'true')
})
check('group headings are black and bold', () => {
  assert.match(I.MF_CSS, /\[data-menu-group-heading\]\{color:#000!important;font-weight:700!important/)
})
check('collapse-all control is present', () => {
  assert.match(bar.querySelector('[data-mf="foldAll"]').textContent, /全部收起|全部展开/)
})

document.dispatch('click', foldButtons()[0])
check('folding hides only that source and keeps its heading visible', () => {
  assert.equal(groupNodes[0].style.display, '')
  assert.deepEqual(
    groupNodes[0].querySelectorAll('button[role="menuitemradio"]').map((o) => o.style.display),
    ['none', 'none', 'none', 'none'],
  )
  assert.ok(groupNodes[1].querySelectorAll('button[role="menuitemradio"]')
    .every((o) => o.style.display !== 'none'))
  assert.equal(foldButtons()[0].textContent, '▸')
  assert.equal(foldButtons()[0].getAttribute('aria-expanded'), 'false')
  assert.equal(bar.querySelector('[data-mf="folded"]').hidden, false)
  assert.match(bar.querySelector('[data-mf="folded"]').textContent, /1 个来源/)
})
check('fold state persists to localStorage', () => {
  const raw = JSON.parse(localStorage.getItem('session-tools.modelFilter.folds.v1'))
  assert.deepEqual(raw.join(','), 'Our Free Model')
})
document.dispatch('click', headings()[0])
check('clicking the heading text itself expands the source again', () => {
  assert.equal(foldButtons()[0].textContent, '▾')
  assert.deepEqual(
    groupNodes[0].querySelectorAll('button[role="menuitemradio"]').map((o) => o.style.display),
    ['', '', '', ''],
  )
  assert.equal(bar.querySelector('[data-mf="folded"]').hidden, true)
})

bar.dispatch('click', bar.querySelector('[data-mf="foldAll"]'))
check('collapse-all folds every source at once', () => {
  assert.deepEqual(foldButtons().map((b) => b.getAttribute('aria-expanded')), ['false', 'false'])
  assert.match(bar.querySelector('[data-mf="folded"]').textContent, /2 个来源/)
  assert.match(bar.querySelector('[data-mf="foldAll"]').textContent, /全部展开/)
})
bar.dispatch('click', bar.querySelector('[data-mf="foldAll"]'))
check('collapse-all toggles back to expand-all', () => {
  assert.deepEqual(foldButtons().map((b) => b.getAttribute('aria-expanded')), ['true', 'true'])
  assert.equal(bar.querySelector('[data-mf="folded"]').hidden, true)
  assert.match(bar.querySelector('[data-mf="foldAll"]').textContent, /全部收起/)
})

// ── empty sources disappear immediately while filtering ───────────────────
// Reproduces the reported bug: a persisted fold kept an empty source's heading
// on screen until the user expanded that source once.
check('empty-source CSS beats the host layout rules', () => {
  assert.match(I.MF_CSS, /\[data-st-mf-empty="true"\]\{display:none!important\}/)
})
check('mfGroupOf resolves the marked source section', () => {
  const opt = groupNodes[0].querySelectorAll('button[role="menuitemradio"]')[0]
  assert.equal(I.mfGroupOf(opt, list), groupNodes[0])
})

document.dispatch('click', foldButtons()[1])
check('the source with no matches is collapsed before filtering', () => {
  assert.equal(foldButtons()[1].getAttribute('aria-expanded'), 'false')
  assert.equal(groupNodes[1].style.display, '')
})
bar.dispatch('click', bar.querySelector('[data-mf="available"]'))
check('filtering hides the empty collapsed source at once (no expand needed)', () => {
  assert.equal(groupNodes[1].style.display, 'none')
  assert.equal(groupNodes[1].getAttribute('data-st-mf-empty'), 'true')
  assert.equal(headings()[1].getAttribute('data-st-mf-empty'), 'true')
  assert.equal(groupNodes[0].style.display, '')
  assert.equal(groupNodes[0].getAttribute('data-st-mf-empty'), 'false')
  assert.equal(foldButtons()[1].getAttribute('aria-expanded'), 'false')
})
document.dispatch('click', headings()[1])
check('expanding a hidden empty source does not bring its heading back', () => {
  assert.equal(groupNodes[1].style.display, 'none')
  assert.equal(groupNodes[1].getAttribute('data-st-mf-empty'), 'true')
})

// A source whose options are not rendered yet (virtualised list / host-side
// search) must not keep its heading either.
const ghost = addGroup(list, 'Ghost Source', [])
await checkAsync('a source with no rendered options is hidden while filtering', async () => {
  listObs.trigger()
  await tick()
  assert.equal(ghost.style.display, 'none')
  assert.equal(ghost.querySelector('[data-menu-group-heading]').getAttribute('data-st-mf-empty'), 'true')
})
bar.dispatch('click', bar.querySelector('[data-mf="clear"]'))
check('clearing the filter restores every source', () => {
  for (const g of list.querySelectorAll('[data-menu-group]')) {
    assert.equal(g.style.display, '')
    assert.equal(g.getAttribute('data-st-mf-empty'), 'false')
  }
})

// ── live provider quota badges ────────────────────────────────────────────
const lobster = addGroup(list, 'LobsterAI (有道)', [{ id: 'lobster-x', name: 'Lobster X' }])
const clineGroup = addGroup(list, 'Cline', [{ id: 'cline-y', name: 'Cline Y' }])
const lobsterHeading = () => lobster.querySelector('[data-menu-group-heading]')
const clineHeading = () => clineGroup.querySelector('[data-menu-group-heading]')
check('refresh quota control is present', () => {
  assert.match(bar.querySelector('[data-mf="refreshQuota"]').textContent, /刷新额度/)
})
await checkAsync('visible providers are looked up through the channel-pack gateway', async () => {
  listObs.trigger()
  await tick()
  assert.deepEqual(quotaCalls.map((c) => c.provider).sort(), ['cline', 'lobsterai'])
  assert.ok(quotaCalls.every((c) => c.force !== true))
})
check('a broken shell RPC falls back to the HTTP gateway', () => {
  assert.ok(rpcCalls >= 2, 'connection rpc was never attempted')
  // ctx.connection getter throws "without inject"; the lookup must survive by
  // reading ctx.get('connection') instead — this is what v7 missed entirely.
  assert.ok(getConnectionCalls >= 2, 'ctx.get("connection") fallback was never used')
})
check('badges show formatted remaining balances', () => {
  assert.match(lobsterHeading().getAttribute('data-st-mf-quota'), /剩余 12K 积分/)
  assert.match(clineHeading().getAttribute('data-st-mf-quota'), /\$3\.46/)
})
check('the badge never pollutes the heading text used as the fold key', () => {
  assert.equal(lobsterHeading().getAttribute('data-st-mf-key'), 'LobsterAI (有道)')
  assert.equal(clineHeading().getAttribute('data-st-mf-key'), 'Cline')
  assert.match(lobsterHeading().textContent, /LobsterAI/)
  assert.doesNotMatch(lobsterHeading().textContent, /积分|剩余/)
})
check('sources without a channel-pack product get no badge', () => {
  const other = groupNodes[0].querySelector('[data-menu-group-heading]')
  assert.equal(other.getAttribute('data-st-mf-quota'), '')
})
await checkAsync('host re-renders reuse the cached quota', async () => {
  const before = quotaCalls.length
  listObs.trigger(); await tick()
  listObs.trigger(); await tick()
  assert.equal(quotaCalls.length, before)
})
await checkAsync('refresh quota forces a fresh lookup', async () => {
  await tick()
  const before = quotaCalls.length
  bar.dispatch('click', bar.querySelector('[data-mf="refreshQuota"]'))
  await tick()
  assert.equal(quotaCalls.length, before + 2)
  assert.ok(quotaCalls.slice(before).every((c) => c.force === true))
})
delete quotaPayloads.cline
await checkAsync('a failed lookup shows a reason code plus the detail in the tooltip', async () => {
  await tick()
  bar.dispatch('click', bar.querySelector('[data-mf="refreshQuota"]'))
  await tick()
  assert.equal(clineHeading().getAttribute('data-st-mf-quota'), '×no-acct')
  assert.match(clineHeading().getAttribute('title'), /额度查询失败/)
})
quotaPayloads.cline = { accounts: [] }
await checkAsync('a provider with no account shows the "not connected" hint', async () => {
  await tick()
  bar.dispatch('click', bar.querySelector('[data-mf="refreshQuota"]'))
  await tick()
  assert.equal(clineHeading().getAttribute('data-st-mf-quota'), '—')
  assert.match(clineHeading().getAttribute('title'), /未接入/)
})

// Simulate closing the picker.
const bodyObs = MO.all.find((o) => o.observing.some((x) => x.target === body))
check('body observer watches the whole document', () => assert.ok(bodyObs))
menu.remove()
await checkAsync('closing the picker detaches the bar', async () => {
  assert.ok(bodyObs)
  bodyObs.trigger()
  await tick()
  assert.equal(bar.isConnected, false)
})

check('unprobed channel rows labelled available are demoted to unverified', () => {
  const idx = I.mfBuildIndex([
    { id: 'moonshotai/kimi-k3.1-pro', name: 'Kimi-K3', availability: 'available', probedAt: 0 },
    { id: 'openpangu-2.0-pro', name: 'OpenPangu-2.0-Pro', availability: 'available', probedAt: 0 },
    { id: 'codearts-agent/x', name: 'Probed Model', availability: 'available', probedAt: 1 },
    { id: 'baidu/ernie-5.5-flash-preview:free', name: 'Ernie', availability: 'available', probedAt: 0 },
  ])
  const kimi = idx.byId.get(I.mfNormalize('moonshotai/kimi-k3.1-pro'))
  const pangu = idx.byId.get(I.mfNormalize('openpangu-2.0-pro'))
  const probed = idx.byId.get(I.mfNormalize('codearts-agent/x'))
  const ernie = idx.byId.get(I.mfNormalize('baidu/ernie-5.5-flash-preview:free'))
  assert.equal(kimi.availability, 'unverified')
  assert.equal(pangu.availability, 'unverified')
  assert.equal(probed.availability, 'available')
  // live-verified allowlist keeps the truly working unprobed row available
  assert.equal(ernie.availability, 'available')
  assert.equal(I.mfShouldShow(kimi, { available: true }), false)
  assert.equal(I.mfShouldShow(kimi, { available: true, showUnknown: true }), true)
  assert.equal(I.mfShouldShow(ernie, { available: true }), true)
})

check('channel models with a real success history survive the available filter', () => {
  // Loomy/讯飞 spark-x2.6, qodercn qfmodel etc. are unprobed channel rows that
  // the host labels `available` with probedAt=0. They are proven working via
  // channel-pack token-ledger, so the allowlist must keep them visible even
  // when the catalog id carries a channel prefix.
  const idx = I.mfBuildIndex([
    { id: 'loomy/spark-x2.6', name: 'Spark X2.6', availability: 'available', probedAt: 0 },
    { id: 'spark-x2.6', name: 'Spark X2.6 (bare)', availability: 'available', probedAt: 0 },
    { id: 'loomy:spark-x2.6', name: 'Spark X2.6 (colon)', availability: 'available', probedAt: 0 },
    { id: 'qodercn/qfmodel', name: 'QFModel', availability: 'available', probedAt: 0 },
    { id: 'codearts/kimi-k3.1-pro', name: 'Kimi-K3', availability: 'available', probedAt: 0 },
    { id: 'codearts/openpangu-2.0-pro', name: 'OpenPangu', availability: 'available', probedAt: 0 },
  ])
  const sparkSlash = idx.byId.get(I.mfNormalize('loomy/spark-x2.6'))
  const sparkBare = idx.byId.get(I.mfNormalize('spark-x2.6'))
  const sparkColon = idx.byId.get(I.mfNormalize('loomy:spark-x2.6'))
  const qf = idx.byId.get(I.mfNormalize('qodercn/qfmodel'))
  const kimi = idx.byId.get(I.mfNormalize('codearts/kimi-k3.1-pro'))
  const pangu = idx.byId.get(I.mfNormalize('codearts/openpangu-2.0-pro'))
  // all three id forms of the讯飞 model, plus qfmodel, must stay available
  assert.equal(sparkSlash.availability, 'available')
  assert.equal(sparkBare.availability, 'available')
  assert.equal(sparkColon.availability, 'available')
  assert.equal(qf.availability, 'available')
  assert.equal(I.mfShouldShow(sparkSlash, { available: true }), true)
  assert.equal(I.mfShouldShow(qf, { available: true }), true)
  // failed-history channel models stay demoted
  assert.equal(kimi.availability, 'unverified')
  assert.equal(pangu.availability, 'unverified')
  assert.equal(I.mfShouldShow(kimi, { available: true }), false)
})

check('failed models stay unavailable even when a name looks allowlisted', () => {
  // Qoder's MiniMax-M3 is id `mmodel` with a 7-req/7-err (all failed) history.
  // It must never be admitted — neither by exact id nor by any tail/normalized
  // match against the allowed MiniMax-family-free entries.
  const idx = I.mfBuildIndex([
    { id: 'qoder/mmodel', name: 'MiniMax-M3 · x0.2', availability: 'available', probedAt: 0 },
    { id: 'mmodel', name: 'MiniMax-M3', availability: 'available', probedAt: 0 },
    { id: 'minimax/MiniMax-M3.1-Flash', name: 'MiniMax M3.1 Flash', availability: 'available', probedAt: 0 },
    { id: 'loomy/spark-x2.6', name: 'Spark X2.6', availability: 'available', probedAt: 0 },
  ])
  const qoder = idx.byId.get(I.mfNormalize('qoder/mmodel'))
  const bare = idx.byId.get(I.mfNormalize('mmodel'))
  const flash = idx.byId.get(I.mfNormalize('minimax/MiniMax-M3.1-Flash'))
  const spark = idx.byId.get(I.mfNormalize('loomy/spark-x2.6'))
  assert.equal(qoder.availability, 'unverified')
  assert.equal(bare.availability, 'unverified')
  assert.equal(flash.availability, 'unverified') // only 1 request — insufficient
  assert.equal(spark.availability, 'available')  // 281 req / 30 err — proven
  assert.equal(I.mfShouldShow(qoder, { available: true }), false)
  assert.equal(I.mfShouldShow(qoder, { available: true, showUnknown: true }), true)
})

// ---- regression: a failed model must not borrow availability from a
// similarly-named allowlisted model via fuzzy name matching ----
check('lookup does not upgrade an exact-id unverified model via a similar name', () => {
  const idx = I.mfBuildIndex([
    { id: 'qoder/mmodel', name: 'MiniMax-M3', availability: 'available', probedAt: 0 }, // failed (7/7), unverified
    { id: 'baidu/ernie-5.5-flash-preview:free', name: 'Ernie', availability: 'available', probedAt: 0 },
  ])
  const option = new El('button')
  option.setAttribute('title', 'MiniMax-M3 · x0.2')
  const span = new El('span')
  // data-model-id is the authoritative identity; if it resolves to a row,
  // that row's verdict must win over any fuzzy name collision.
  span.setAttribute('data-model-id', 'qoder/mmodel')
  option.appendChild(span)
  const meta = I.mfLookup(idx, option)
  assert.ok(meta, 'expected a match')
  assert.equal(meta.availability, 'unverified')
  assert.equal(I.mfShouldShow(meta, { available: true }), false)
})

check('Qoder MiniMax-M3 stays hidden when a similar MiniMax id is throttled', () => {
  // Exact reproduction of the 2026-11-25 bug: the Qoder dropdown option
  // "MiniMax-M3 · x0.2" (channel id `mmodel`, 7 req / 7 err) was fuzzy-matched
  // to `minimaxai/minimax-m3.1-flash`. If that row is ever treated as available
  // (e.g. mistakenly allowlisted), the failed model gets admitted too. With
  // the correct verdict it must stay hidden under "available only".
  const idx = I.mfBuildIndex([
    { id: 'minimaxai/minimax-m3.1-flash', name: 'minimaxai/minimax-m3.1-flash', availability: 'throttled', probedAt: 1 },
  ])
  const option = new El('button')
  option.setAttribute('title', 'MiniMax-M3 · x0.2')
  const meta = I.mfLookup(idx, option)
  assert.ok(meta, 'the similar name should still match')
  assert.equal(meta.availability, 'throttled')
  assert.equal(I.mfShouldShow(meta, { available: true }), false)
})

check('teardown disconnects every observer and document listener', () => {
  cleanup()
  for (const o of MO.all) assert.equal(o.observing.length, 0)
  for (const type of ['mousedown', 'pointerdown', 'click']) {
    assert.equal((docListeners[type] || []).length, 0)
  }
})

const failed = results.filter(([status]) => status === 'FAIL')
for (const [status, name] of results) console.log(`${status}  ${name}`)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exitCode = 1

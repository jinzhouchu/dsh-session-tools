window.__ModuleLoader__.load({
  id: '@local/session-tools',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const CSS = [
      '.st-row{display:flex;align-items:center;gap:8px;width:100%;height:32px;padding:0 10px;',
      'border:0;border-radius:var(--dsw-radius-sm,6px);background:transparent;',
      'color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;',
      'cursor:pointer;box-sizing:border-box}',
      '.st-row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.st-row:focus-visible{outline:2px solid var(--dsw-alias-border-focus,#247bbf);outline-offset:-2px}',
      '.st-row:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}',
      '.st-rowIcon{flex:none;display:inline-flex;width:16px;height:16px;color:var(--dsw-alias-label-secondary)}',
      '.st-danger{color:var(--dsw-alias-color-danger,#c8563c)}',
      '.st-danger .st-rowIcon{color:var(--dsw-alias-color-danger,#c8563c)}',
      '.st-note{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);padding:2px 10px 6px 34px}',
      '.st-page{flex-direction:column;width:100%;display:flex}',
      '.st-block{border-bottom:.5px solid var(--dsw-alias-border-l2);padding:16px 0;display:flex;flex-direction:column;gap:8px}',
      '.st-blockTitle{font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}',
      '.st-blockHint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.st-field{flex-direction:column;gap:6px;display:flex}',
      '.st-fieldLabel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.st-fieldRow{flex-direction:row;align-items:center;gap:8px;display:flex}',
      '.st-input{flex:1;min-width:0;box-sizing:border-box;border-radius:var(--dsw-radius-sm,6px);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:8px 10px;outline:none}',
      '.st-input:focus{border-color:var(--dsw-alias-border-focus,#247bbf)}',
      '.st-btn{box-sizing:border-box;border-radius:var(--dsw-radius-sm,6px);cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:8px 14px;flex:none;display:inline-flex}',
      '.st-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.st-btn:disabled{cursor:default;color:var(--dsw-alias-label-tertiary)}',
      '.st-btnPrimary{border-color:transparent;background:var(--dsw-alias-accent-bg,#247bbf);color:var(--dsw-alias-accent-text,#fff)}',
      '.st-btnPrimary:hover{background:var(--dsw-alias-accent-bg-hover,#1c6299)}',
      '.st-status{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.st-error{color:var(--dsw-alias-color-danger,#c8563c)}',
      '.st-warn{color:var(--dsw-alias-color-warning,#b8791b)}',
    ].join('')

    /**
     * Styles for the model-picker filter bar. The bar is inserted into the host's
     * MenuSurface with a DOM observer (the host exposes no slot for it), so it
     * uses the same theme aliases as the rest of the plugin and works in both
     * light and dark themes.
     */
    const MF_CSS = [
      '.st-mf{display:flex;flex-direction:column;gap:5px;padding:2px 10px 8px;box-sizing:border-box;',
        'font-family:inherit;color:var(--dsw-alias-label-primary,#222);',
        'pointer-events:auto;user-select:none}',
      '.st-mf [hidden]{display:none!important}',
      '.st-mf-btn:active,.st-mf-chip:active,.st-mf-clear:active,.st-mf-retry:active{transform:translateY(1px)}',
      '.st-mf-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '.st-mf-btn,.st-mf-chip,.st-mf-clear,.st-mf-retry{display:inline-flex;align-items:center;gap:5px;',
        'box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#e3e5e8);border-radius:999px;',
        'background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-secondary,#555);',
        'font:inherit;font-size:11.5px;line-height:20px;padding:2px 9px;cursor:pointer;white-space:nowrap}',
      '.st-mf-btn:hover,.st-mf-chip:hover,.st-mf-clear:hover,.st-mf-retry:hover{background:var(--dsw-alias-interactive-bg-hover,#f2f4f7)}',
      '.st-mf-btn[data-active="true"],.st-mf-chip[aria-pressed="true"]{',
        'border-color:var(--dsw-alias-accent-bg,#247bbf);color:var(--dsw-alias-accent-bg,#247bbf);',
        'background:var(--dsw-alias-accent-bg-soft,#eaf3fb)}',
      '.st-mf-btn svg{width:13px;height:13px;flex:none}',
      '.st-mf-badge{min-width:15px;height:15px;padding:0 3px;border-radius:8px;',
        'display:inline-flex;align-items:center;justify-content:center;',
        'background:var(--dsw-alias-accent-bg,#247bbf);color:#fff;font-size:10px;line-height:1}',
      '.st-mf-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '.st-mf-clear,.st-mf-retry{border-color:transparent;background:transparent;',
        'text-decoration:underline;padding:2px 4px}',
      '.st-mf-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;',
        'font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888)}',
      '.st-mf-warn{color:var(--dsw-alias-color-warning,#b8791b)}',
      '.st-mf-error{color:var(--dsw-alias-color-danger,#c8563c)}',
      // Model sources (LobsterAI / Cline / ...) are MenuGroup headings.
      '[id$="-models"] [data-menu-group-heading]{color:#000!important;font-weight:700!important;',
        'cursor:pointer;user-select:none}',
      '.st-mf-fold{display:inline-flex;align-items:center;justify-content:center;',
        'width:16px;height:16px;margin-right:5px;vertical-align:-2px;box-sizing:border-box;',
        'border:1px solid var(--dsw-alias-border-l2,#d9dde2);border-radius:4px;',
        'background:var(--dsw-alias-bg-layer-1,#fff);color:#000;',
        'font-family:inherit;font-size:11px;font-weight:700;line-height:1;',
        'padding:0;cursor:pointer;flex:none}',
      '.st-mf-fold:hover{background:var(--dsw-alias-interactive-bg-hover,#eef1f4)}',
      '.st-mf-fold[data-collapsed="true"]{background:var(--dsw-alias-interactive-bg-hover,#e7ebef)}',
      '.st-mf-folded{color:var(--dsw-alias-label-tertiary,#888)}',
      // A source with zero matches disappears as a whole, heading included.
      // !important beats the host's layout rules (sticky/flex group styles).
      '[data-st-mf-empty="true"]{display:none!important}',
      // Per-provider quota is rendered through attr() on a pseudo-element:
      // it never becomes a text node, so the heading text (used as the fold
      // key) stays clean and React re-renders cannot drop the badge.
      '[id$="-models"] [data-menu-group-heading][data-st-mf-quota]::after{',
        'content:attr(data-st-mf-quota);display:inline-block;margin-left:8px;padding:0 6px;',
        'border-radius:9px;font-size:10px;font-weight:600;line-height:16px;',
        'white-space:nowrap;vertical-align:1px;letter-spacing:0;',
        'color:#0a6c4a;background:#e6f4ed}',
      '[id$="-models"] [data-menu-group-heading][data-st-mf-quota=""]::after{display:none}',
      '[id$="-models"] [data-menu-group-heading][data-st-mf-quota="—"]::after,',
        '[id$="-models"] [data-menu-group-heading][data-st-mf-quota="…"]::after{',
        'color:#777;background:#f0f1f3}',
    ].join('')

    function IconOpen() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none',
          stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linejoin': 'round', 'aria-hidden': true,
        },
        h('path', { d: 'M1.8 4.2A1.2 1.2 0 0 1 3 3h3l1.4 1.6H13A1.2 1.2 0 0 1 14.2 5.8v6A1.2 1.2 0 0 1 13 13H3a1.2 1.2 0 0 1-1.2-1.2z' }),
      )
    }

    function IconTrash() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none',
          stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'aria-hidden': true,
        },
        h('path', { d: 'M2.6 4.2h10.8M6.4 4.2V2.8h3.2v1.4M4.2 4.2l.6 8.1a1.1 1.1 0 0 0 1.1 1h4.2a1.1 1.1 0 0 0 1.1-1l.6-8.1' }),
      )
    }

    /**
     * Copy is registered under this plugin's own locale namespace, so the menu
     * follows the language chosen in Settings → General and switches live.
     */
    const NS = 'session-tools'
    const DICTIONARIES = {
      zh: {
        'menu.openFolder': '打开对话所在文件夹',
        'menu.deleteSession': '删除此对话',
        'menu.confirmDelete': '确认删除「{title}」？',
        'menu.deleteWarning': '对话记录将被永久删除，无法恢复。',
        'menu.opening': '正在打开…',
        'menu.opened': '已在文件管理器中打开',
        'menu.deleting': '正在删除…',
        'menu.deleted': '对话记录已删除',
        'menu.failed': '操作失败：{message}',
        'error.bad-request': '对话参数无效。',
        'error.not-found': '找不到该对话的记录，它可能已被删除。',
        'error.session-live': '该对话正在使用中，请先关闭它再删除。',
        'error.session-current': '不能删除正在运行本次请求的对话；请在侧栏菜单中删除它。',
        'error.no-directory': '该对话没有记录工作目录。',
        'error.open-failed': '系统未能打开该目录。',
        'error.remove-failed': '删除对话记录失败。',
        'error.unsafe-path': '已拒绝：目标路径不在会话存储目录内。',
        'error.unknown-route': '未知的操作。',
        'error.internal': '操作失败（内部错误）。',
        'storage.title': '会话存储',
        'storage.hint': '保存时会先把旧位置的对话与缓存复制到新目录，再写入 profile 配置；重启 Harness 后生效。旧数据保留，确认无误后可手动删除。若之前已改过目录，可用“迁移现有数据”从旧位置补迁。',
        'storage.sessions': '对话文件目录',
        'storage.sessionsHint': '每个对话一个 event 日志文件所在目录。',
        'storage.storages': '缓存目录',
        'storage.storagesHint': '工作区记录与投影缓存所在的 KV 存储根目录。',
        'storage.browse': '选择目录',
        'storage.save': '保存',
        'storage.saving': '保存中…',
        'storage.saved': '已写入配置，重启 Harness 后生效',
        'storage.savedWithMigration': '已写入配置，重启后生效；复制 {copied} 个文件、覆盖 {overwritten} 个、跳过 {skipped} 个、失败 {failed} 个',
        'storage.savedNoSource': '已写入配置，重启后生效；旧位置 {source} 没有数据',
        'storage.savedNoMigration': '已写入配置，重启后生效（未复制旧数据，请手动点“迁移现有数据”）',
        'storage.same': '该目录未变更',
        'storage.migrate': '迁移现有数据',
        'storage.migrateFrom': '补迁来源：{source}',
        'storage.migrating': '迁移中…',
        'storage.migrated': '已复制 {copied} 个文件到 {target}',
        'storage.migratedDetail': '从 {source} 迁移：复制 {copied}、覆盖 {overwritten}、跳过 {skipped}、失败 {failed} → {target}',
        'storage.migratedWithSource': '已复制 {copied} 个文件到 {target}，并删除旧位置',
        'storage.restart': '目录配置写入 profile 的 cordis.patch.yml，需重启 Harness 才生效；旧目录中的数据不会被自动删除。',
        'storage.pendingRestart': '● 待重启：当前仍在使用 {runtime}，重启后切换到 {root}',
        'storage.loadFailed': '读取当前目录失败：{message}',
        'storage.retry': '重试',
        'storage.browseFailed': '无法打开目录选择器，请手动输入绝对路径。',
        'storage.invalidPath': '请填写绝对路径（如 F:/Data/Sessions），且不能与另一存储目录相同或相互嵌套。',
        'storage.notEditable': '当前 profile 的配置文件不可写，无法修改目录。请检查 cordis.patch.yml 的权限。',
        'storage.error.bad-request': '目录路径无效：请填写绝对路径，且不能与另一存储目录相同、位于其内部或包含它。',
        'storage.error.unavailable': '当前 profile 配置文件不可访问，无法修改存储目录。',
        'storage.error.not-found': '旧目录中找不到可迁移的数据，请确认旧位置后重试。',
        'storage.error.internal': '设置失败（内部错误），详情见 ~/.dsh/session-tools-error.log。',
        'storage.error.patch-unavailable': '配置文件写入失败（数据未丢失，配置未改动）。',
        'storage.error.route-unreachable': '插件接口不可达，请重启 Harness 后重试。',
        'storage.error.unknown-route': '插件接口版本不匹配，请重启 Harness 后重试。',
        'storage.error.method-not-allowed': '插件接口调用方式错误，请重启 Harness 后重试。',
        'filter.button': '筛选',
        'filter.title': '按可用性与多模态筛选模型',
        'filter.available': '仅可用',
        'filter.availableHint': '只显示经探测确认可用、或列入实测白名单的模型；渠道里那些未探测就被标「可用」的会被当成未知隐藏，勾选「显示未知」可放回',
        'filter.multimodal': '仅多模态',
        'filter.multimodalHint': '只显示支持图像输入的模型；无状态信息的模型会一并隐藏',
        'filter.showUnknown': '显示未知',
        'filter.showUnknownHint': '筛选开启时，把没有状态信息的模型重新显示出来（它们不参与可用 / 多模态判定）',
        'filter.clear': '清除',
        'filter.retry': '重试',
        'filter.stat': '显示 {shown} / {total} 个模型',
        'filter.unknown': '未知 {count} · 元数据 {meta} 条',
        'filter.empty': '当前筛选下没有模型',
        'filter.noData': '模型状态读取失败（{message}），「仅可用」可能不准确',
        'filter.foldAll': '全部收起',
        'filter.unfoldAll': '全部展开',
        'filter.foldHint': '收起 / 展开这个来源下的模型',
        'filter.fold': '收起此来源',
        'filter.unfold': '展开此来源',
        'filter.folded': '已收起 {count} 个来源',
        'quota.refresh': '刷新额度',
        'quota.refreshHint': '强制重新查询各厂商的剩余额度（默认两分钟内复用缓存）',
        'quota.hint': '来自 channel-pack 的厂商剩余额度，点击「刷新额度」可强制更新',
        'quota.loading': '…',
        'quota.none': '—',
        'quota.noAccount': '未接入该厂商账号',
        'quota.noData': '未返回余额数据',
        'quota.error': '额度查询失败：{message}',
        'quota.credits': '剩余 {value} 积分',
        'quota.dollars': '${value}',
        'quota.tokens': '剩余 {value} token',
        'quota.count': '剩余 {value} 配额',
      },
      en: {
        'menu.openFolder': 'Open conversation folder',
        'menu.deleteSession': 'Delete this conversation',
        'menu.confirmDelete': 'Delete “{title}”?',
        'menu.deleteWarning': 'The session record is removed permanently and cannot be recovered.',
        'menu.opening': 'Opening…',
        'menu.opened': 'Opened in the file manager',
        'menu.deleting': 'Deleting…',
        'menu.deleted': 'Conversation record deleted',
        'menu.failed': 'Failed: {message}',
        'error.bad-request': 'Invalid conversation reference.',
        'error.not-found': 'No record found for this conversation; it may already be deleted.',
        'error.session-live': 'This conversation is in use; close it before deleting.',
        'error.session-current': 'This conversation is running the request; delete it from its sidebar menu instead.',
        'error.no-directory': 'This conversation has no recorded working directory.',
        'error.open-failed': 'The system could not open that directory.',
        'error.remove-failed': 'The conversation record could not be removed.',
        'error.unsafe-path': 'Refused: the target lies outside the session storage root.',
        'error.unknown-route': 'Unknown operation.',
        'error.internal': 'The operation failed (internal error).',
        'storage.title': 'Session storage',
        'storage.hint': 'Saving copies the conversations and cache from the old location first, then writes the profile patch. Restart the Harness for the change to apply. The old copy is kept. Use “Migrate existing data” to copy from a previously used location.',
        'storage.sessions': 'Conversation file directory',
        'storage.sessionsHint': 'The root that holds one event-log file per conversation.',
        'storage.storages': 'Cache directory',
        'storage.storagesHint': 'The KV storage root holding workspace records and the projection cache.',
        'storage.browse': 'Choose…',
        'storage.save': 'Save',
        'storage.saving': 'Saving…',
        'storage.saved': 'Saved to the profile; restart the Harness to apply',
        'storage.savedWithMigration': 'Saved; restart to apply. Copied {copied}, replaced {overwritten}, skipped {skipped}, failed {failed}',
        'storage.savedNoSource': 'Saved; restart to apply. No old data at {source}',
        'storage.savedNoMigration': 'Saved; restart to apply (old data was not copied; use “Migrate existing data”)',
        'storage.same': 'This directory is unchanged',
        'storage.migrate': 'Migrate existing data',
        'storage.migrateFrom': 'Migration source: {source}',
        'storage.migrating': 'Migrating…',
        'storage.migrated': 'Copied {copied} file(s) to {target}',
        'storage.migratedDetail': 'From {source}: copied {copied}, replaced {overwritten}, skipped {skipped}, failed {failed} → {target}',
        'storage.migratedWithSource': 'Copied {copied} file(s) to {target} and removed the old location',
        'storage.restart': 'Directory settings are written to the profile cordis.patch.yml and apply after restarting the Harness. Data in the old directory is never removed automatically.',
        'storage.pendingRestart': '● Pending restart: still using {runtime}; will switch to {root} after restart',
        'storage.loadFailed': 'Could not read the current directories: {message}',
        'storage.retry': 'Retry',
        'storage.browseFailed': 'The directory picker is unavailable; enter an absolute path manually.',
        'storage.invalidPath': 'Enter an absolute path (e.g. F:/Data/Sessions) that is not the same as, inside, or containing the other storage root.',
        'storage.notEditable': 'The profile patch is not writable, so this directory cannot be changed. Check cordis.patch.yml permissions.',
        'storage.error.bad-request': 'Invalid directory: use an absolute path that is not the same as, inside, or containing the other storage root.',
        'storage.error.unavailable': 'The profile patch is not accessible, so the storage root cannot be changed.',
        'storage.error.not-found': 'No data found at the old directory; check the source path.',
        'storage.error.internal': 'The operation failed (internal error). See ~/.dsh/session-tools-error.log.',
        'storage.error.patch-unavailable': 'Could not write the profile patch (no data lost, no config changed).',
        'storage.error.route-unreachable': 'The plugin route is unreachable; restart the Harness and try again.',
        'storage.error.unknown-route': 'Plugin route mismatch; restart the Harness and try again.',
        'storage.error.method-not-allowed': 'Plugin route was called incorrectly; restart the Harness and try again.',
        'filter.button': 'Filter',
        'filter.title': 'Filter models by availability and multimodality',
        'filter.available': 'Available only',
        'filter.availableHint': 'Show only probe-verified or live-verified models; channel rows marked available without a probe are treated as unknown, use "Show unknown" to bring them back',
        'filter.multimodal': 'Multimodal only',
        'filter.multimodalHint': 'Show only models accepting image input; models with no status are hidden',
        'filter.showUnknown': 'Show unknown',
        'filter.showUnknownHint': 'While filtering, bring back models with no status data (they are not judged by the other filters)',
        'filter.clear': 'Clear',
        'filter.retry': 'Retry',
        'filter.stat': 'Showing {shown} of {total} models',
        'filter.unknown': '{count} unknown · {meta} metadata rows',
        'filter.empty': 'No models match the current filters',
        'filter.noData': 'Could not read model status ({message}); "Available only" may be inaccurate',
        'filter.foldAll': 'Collapse all',
        'filter.unfoldAll': 'Expand all',
        'filter.foldHint': 'Collapse / expand the models from this source',
        'filter.fold': 'Collapse this source',
        'filter.unfold': 'Expand this source',
        'filter.folded': '{count} sources collapsed',
        'quota.refresh': 'Refresh quota',
        'quota.refreshHint': 'Force a fresh balance lookup for every provider (cached for two minutes by default)',
        'quota.hint': 'Remaining provider credit from channel-pack; click "Refresh quota" to force an update',
        'quota.loading': '…',
        'quota.none': '—',
        'quota.noAccount': 'No account connected for this provider',
        'quota.noData': 'No balance data returned',
        'quota.error': 'Quota lookup failed: {message}',
        'quota.credits': '{value} credits left',
        'quota.dollars': '${value}',
        'quota.tokens': '{value} tokens left',
        'quota.count': '{value} quota left',
      },
    }

    /**
     * Prefer the app's locale service (`ctx.locale.bind`), which reacts to the
     * language preference; fall back to this plugin's dictionary read straight
     * off the snapshot so a missing seat degrades to copy, never to a crash.
     */
    function makeTranslate(ctx) {
      const bound = typeof ctx.locale?.bind === 'function' ? ctx.locale.bind(NS) : undefined
      if (typeof bound === 'function') return bound
      return (key, vars) => {
        const active = ctx.locale?.getLocale?.()?.active ?? 'en'
        const primary = String(active).split(/[-_]/)[0].toLowerCase()
        const dict = DICTIONARIES[primary] ?? DICTIONARIES.en
        let text = dict[key] ?? DICTIONARIES.en[key] ?? key
        for (const name of Object.keys(vars ?? {})) {
          text = text.split(`{${name}}`).join(String(vars[name]))
        }
        return text
      }
    }

    /** Turn a Host error code into localized copy, preferring storage wording. */
    function describeError(translate, error) {
      const code = error?.code ?? 'internal'
      for (const key of [`storage.error.${code}`, `error.${code}`]) {
        const text = translate(key)
        if (typeof text !== 'string' || text === '' || text === key) continue
        // For unexpected failures the Host message is the only useful clue
        // (path, HTTP status, original exception), so never swallow it.
        const verbose = code === 'internal' || code === 'patch-unavailable' || code === 'route-unreachable'
        if (verbose && error?.message) return `${text} (${error.message})`
        return text
      }
      return translate('menu.failed', { message: error?.message ?? String(error) })
    }

    /**
     * POST one operation to this package's private Host route. The Host mounts
     * the `/session-tools` prefix at the origin root, so try that absolute URL
     * first: a Settings page served from a nested pathname would otherwise
     * resolve the old relative URL to `/settings/session-tools/...` and 404.
     * The page-relative form is kept as a fallback for sub-path deployments.
     */
    async function callHost(route, payload) {
      const body = JSON.stringify(payload)
      const urls = []
      try {
        urls.push(new URL(`session-tools/${route}`, new URL('/', document.baseURI)).href)
      } catch {}
      try {
        const relative = new URL(`session-tools/${route}`, document.baseURI).href
        if (!urls.includes(relative)) urls.push(relative)
      } catch {}
      if (urls.length === 0) urls.push(`session-tools/${route}`)

      const attempts = []
      let lastError
      for (const url of urls) {
        let response
        let text
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body,
          })
          text = await response.text()
        } catch (error) {
          attempts.push(`${url}: ${error?.message ?? String(error)}`)
          lastError = error instanceof Error ? error : new Error(String(error))
          continue
        }
        let result
        try {
          result = JSON.parse(text)
        } catch {
          // A bare 404/405 from another handler must not replace the real
          // failure with a generic "HTTP 405"; record every attempt instead.
          attempts.push(`${url}: HTTP ${response.status} (non-JSON)`)
          lastError = new Error(`HTTP ${response.status} at ${url}`)
          lastError.code = 'internal'
          continue
        }
        if (result === null || typeof result !== 'object' || !('ok' in result || 'code' in result)) {
          attempts.push(`${url}: unexpected response (HTTP ${response.status})`)
          lastError = new Error(`unexpected response from ${url}`)
          lastError.code = 'unknown-route'
          continue
        }
        // A plugin-shaped reply is authoritative. Handle it right here: falling
        // through to a second URL used to hide the Host's real error code.
        if (!response.ok || result.ok !== true) {
          const error = new Error(result?.message || `HTTP ${String(response.status)}`)
          error.code = typeof result?.code === 'string' ? result.code : 'internal'
          throw error
        }
        return result
      }
      const error = lastError instanceof Error ? lastError : new Error(String(lastError ?? 'no route responded'))
      if (error.code === undefined || error.code === 'internal') error.code = 'route-unreachable'
      error.message = `${error.message} [${attempts.join(' | ')}]`
      throw error
    }

    /**
     * Archive through the official navigation service first, then remove the
     * files. Archiving is what clears the open main-view reference (so the Host
     * stops retaining the session and a later re-list cannot resurrect the row),
     * stops running work, and broadcasts the archived increment. Failures here
     * are not fatal: the Host route archives defensively too.
     */
    async function archiveBeforeDelete(ctx, sessionId) {
      const uiWorkspace = ctx.get?.('uiWorkspace')
      if (typeof uiWorkspace?.archiveSession !== 'function') return
      try {
        await uiWorkspace.archiveSession(sessionId, { stopActivity: true })
      } catch {}
    }

    /** One in-row action: busy state plus one result line, no external toast channel. */
    function useAction(t, beforeDelete) {
      const [pending, setPending] = React.useState(null)
      const [note, setNote] = React.useState(null)
      const run = React.useCallback(
        async (route, payload, busyKey, doneKey) => {
          setPending(t(busyKey))
          setNote(null)
          try {
            if (route === 'delete' && beforeDelete) await beforeDelete(payload.sessionId)
            await callHost(route, payload)
            setNote(t(doneKey))
          } catch (error) {
            setNote(describeError(t, error))
          } finally {
            setPending(null)
          }
        },
        [t, beforeDelete],
      )
      return { pending, note, run }
    }

    function Row({ label, icon, danger, disabled, onClick }) {
      return h(
        'button',
        { type: 'button', className: danger ? 'st-row st-danger' : 'st-row', disabled, onClick },
        h('span', { className: 'st-rowIcon' }, icon),
        label,
      )
    }

    function OpenFolderMenuItem({ sessionId, useMenuOpenState, t }) {
      const [, setMenuOpen] = useMenuOpenState()
      const { pending, note, run } = useAction(t)
      return h(
        React.Fragment,
        null,
        h(Row, {
          label: t('menu.openFolder'),
          icon: h(IconOpen),
          disabled: pending !== null,
          onClick: () => {
            setMenuOpen(false)
            run('open-folder', { sessionId }, 'menu.opening', 'menu.opened')
          },
        }),
        pending ? h('div', { className: 'st-note' }, pending) : null,
        note ? h('div', { className: 'st-note' }, note) : null,
      )
    }

    function DeleteSessionMenuItem({ sessionId, displayTitle, useMenuOpenState, t, beforeDelete }) {
      const [menuOpen] = useMenuOpenState()
      const [confirming, setConfirming] = React.useState(false)
      const { pending, note, run } = useAction(t, beforeDelete)
      React.useEffect(() => {
        if (!menuOpen) setConfirming(false)
      }, [menuOpen])
      return h(
        React.Fragment,
        null,
        h(Row, {
          label: confirming
            ? t('menu.confirmDelete', { title: displayTitle || sessionId })
            : t('menu.deleteSession'),
          icon: h(IconTrash),
          danger: true,
          disabled: pending !== null,
          onClick: () => {
            if (!confirming) {
              setConfirming(true)
              return
            }
            setConfirming(false)
            run('delete', { sessionId, force: true }, 'menu.deleting', 'menu.deleted')
          },
        }),
        confirming && !note ? h('div', { className: 'st-note' }, t('menu.deleteWarning')) : null,
        pending ? h('div', { className: 'st-note' }, pending) : null,
        note ? h('div', { className: 'st-note' }, note) : null,
      )
    }

    /**
     * Settings page body: two directory fields (conversation logs and cache/KV),
     * each with a native directory picker, a save, and a data migration. The
     * values are read from and written through this package's Host route.
     */
    function createStorageSection(ctx, fallbackTranslate) {
      const KINDS = [
        { kind: 'sessions', titleKey: 'storage.sessions', hintKey: 'storage.sessionsHint' },
        { kind: 'storages', titleKey: 'storage.storages', hintKey: 'storage.storagesHint' },
      ]

      async function pickDirectory() {
        // `uiWorkspace.pickDirectory()` unwraps the Remote Result into a path,
        // while `remote.directoryPicker.pick()` may return either a Result or
        // a bare string depending on the transport in use.
        const unwrap = (value) => {
          if (typeof value === 'string' && value.trim() !== '') return value
          if (value && typeof value === 'object') {
            if (value.ok === true && typeof value.value === 'string') return value.value
            if (typeof value.path === 'string') return value.path
          }
          return null
        }
        try {
          const uiWorkspace = ctx.uiWorkspace ?? ctx.get?.('uiWorkspace')
          if (typeof uiWorkspace?.pickDirectory === 'function') {
            const chosen = unwrap(await uiWorkspace.pickDirectory())
            if (chosen !== null) return chosen
          }
        } catch {}
        try {
          const remote = (ctx.remote ?? ctx.get?.('remote'))?.directoryPicker
          if (typeof remote?.pick === 'function') {
            const chosen = unwrap(await remote.pick())
            if (chosen !== null) return chosen
          }
        } catch {}
        return null
      }

      function StorageSection({ t }) {
        const translate = typeof t === 'function' ? t : fallbackTranslate
        const [values, setValues] = React.useState({})
        const [info, setInfo] = React.useState({})
        const [notes, setNotes] = React.useState({})
        const [busy, setBusy] = React.useState(null)

        const load = React.useCallback(async () => {
          try {
            const result = await callHost('storage-info', {})
            const nextValues = {}
            const nextInfo = {}
            for (const item of result?.items ?? []) {
              nextValues[item.kind] = item.root
              nextInfo[item.kind] = item
            }
            setValues(nextValues)
            setInfo(nextInfo)
            setNotes((prev) => ({ ...prev, loaded: true, loadError: undefined }))
          } catch (error) {
            setNotes((prev) => ({ ...prev, loadError: error?.message ?? String(error) }))
          }
        }, [])

        React.useEffect(() => {
          load()
        }, [load])

        const save = async (kind) => {
          const root = (values[kind] ?? '').trim()
          const backslash = String.fromCharCode(92)
          if (root !== '' && !/^[A-Za-z]:/.test(root) && !root.startsWith('/') && !root.startsWith(backslash)) {
            setNotes((prev) => ({ ...prev, error: translate('storage.invalidPath') }))
            return
          }
          setBusy(`save:${kind}`)
          setNotes((prev) => ({ ...prev, error: undefined, saved: undefined, migrated: undefined }))
          try {
            const result = await callHost('storage-set', { kind, root })
            if (result?.changed !== true) {
              setNotes((prev) => ({ ...prev, saved: `${kind}: ${translate('storage.same')}` }))
            } else {
              const moved = result.migration
              const text = moved === undefined
                ? translate('storage.savedNoMigration')
                : moved.sourceMissing === true
                  ? translate('storage.savedNoSource', { source: moved.source })
                  : translate('storage.savedWithMigration', {
                      copied: moved.copied ?? 0,
                      overwritten: moved.overwritten ?? 0,
                      skipped: moved.skipped ?? 0,
                      failed: moved.failed ?? 0,
                    })
              setNotes((prev) => ({ ...prev, saved: `${kind}: ${text}` }))
            }
            await load()
          } catch (error) {
            setNotes((prev) => ({ ...prev, error: describeError(translate, error) }))
          } finally {
            setBusy(null)
          }
        }

        const migrate = async (kind) => {
          setBusy(`migrate:${kind}`)
          setNotes((prev) => ({ ...prev, error: undefined, migrated: undefined }))
          try {
            const result = await callHost('storage-migrate', { kind, removeSource: false })
            setNotes((prev) => ({
              ...prev,
              migrated: translate('storage.migratedDetail', {
                source: result?.source,
                target: result?.target,
                copied: result?.copied ?? 0,
                overwritten: result?.overwritten ?? 0,
                skipped: result?.skipped ?? 0,
                failed: result?.failed ?? 0,
              }),
            }))
          } catch (error) {
            setNotes((prev) => ({ ...prev, error: describeError(translate, error) }))
          } finally {
            setBusy(null)
          }
        }

        return h(
          'div',
          { className: 'st-page' },
          h(
            'div',
            { className: 'st-block' },
            h('div', { className: 'st-blockTitle' }, translate('storage.title')),
            h('div', { className: 'st-blockHint' }, translate('storage.hint')),
          ),
          KINDS.map((item) => {
            const value = values[item.kind] ?? ''
            const fieldBusy = busy === `save:${item.kind}` || busy === `migrate:${item.kind}`
            return h(
              'div',
              { className: 'st-block', key: item.kind },
              h('div', { className: 'st-fieldLabel' }, translate(item.titleKey)),
              h('div', { className: 'st-fieldRow' },
                h('input', {
                  className: 'st-input',
                  type: 'text',
                  value,
                  placeholder: info[item.kind]?.defaultRoot ?? '',
                  spellCheck: false,
                  'aria-label': translate(item.titleKey),
                  onChange: (event) => setValues((prev) => ({ ...prev, [item.kind]: event.target.value })),
                }),
                h('button', {
                  type: 'button',
                  className: 'st-btn',
                  disabled: fieldBusy,
                  onClick: async () => {
                    const chosen = await pickDirectory()
                    if (chosen === null) {
                      setNotes((prev) => ({ ...prev, error: translate('storage.browseFailed') }))
                      return
                    }
                    setValues((prev) => ({ ...prev, [item.kind]: chosen }))
                    setNotes((prev) => ({ ...prev, error: undefined }))
                  },
                }, translate('storage.browse')),
              ),
              h('div', { className: 'st-blockHint' }, translate(item.hintKey)),
              info[item.kind]?.previousRoot
                ? h('div', { className: 'st-blockHint' }, translate('storage.migrateFrom', { source: info[item.kind].previousRoot }))
                : null,
              info[item.kind]?.pendingRestart
                ? h('div', { className: 'st-status st-warn' }, translate('storage.pendingRestart', {
                    runtime: info[item.kind].runtimeRoot,
                    root: info[item.kind].root,
                  }))
                : null,
              notes.loaded && info[item.kind]?.editable === false
                ? h('div', { className: 'st-status st-error' }, translate('storage.notEditable'))
                : null,
              h('div', { className: 'st-fieldRow' },
                h('button', {
                  type: 'button',
                  className: 'st-btn st-btnPrimary',
                  disabled: fieldBusy || value.trim() === '' || info[item.kind]?.editable === false,
                  onClick: () => save(item.kind),
                }, busy === `save:${item.kind}` ? translate('storage.saving') : translate('storage.save')),
                h('button', {
                  type: 'button',
                  className: 'st-btn',
                  disabled: fieldBusy,
                  onClick: () => migrate(item.kind),
                }, busy === `migrate:${item.kind}` ? translate('storage.migrating') : translate('storage.migrate')),
              ),
            )
          }),
          h(
            'div',
            { className: 'st-block' },
            h('div', { className: 'st-blockHint' }, translate('storage.restart')),
            notes.loadError
              ? h('div', { className: 'st-fieldRow' },
                  h('div', { className: 'st-status st-error' }, translate('storage.loadFailed', { message: notes.loadError })),
                  h('button', { type: 'button', className: 'st-btn', onClick: load }, translate('storage.retry')),
                )
              : null,
            notes.error ? h('div', { className: 'st-status st-error' }, notes.error) : null,
            notes.migrated ? h('div', { className: 'st-status' }, notes.migrated) : null,
            notes.saved ? h('div', { className: 'st-status' }, notes.saved) : null,
          ),
        )
      }
      return StorageSection
    }

    // ── model picker filter ───────────────────────────────────────────────────
    // The composer's model dropdown is rendered by the host bundle
    // (ui-model-selection / ModelSelect) and exposes no client slot, so the bar
    // is attached with a DOM observer. Model metadata comes from
    // dsh-our-free-model's /summary endpoint, which already carries
    // `availability` and `vision` for every model it publishes.
    const MF_KEY = 'session-tools.modelFilter.v1'
    const MF_TTL = 60_000
    // Models proven to actually answer, kept as a live-verified allowlist so
    // "available only" stays honest for rows the upstream summary labels
    // `available` without probing (probedAt === 0).
    //
    // Two sources, both evidence-based (2026-11-25):
    //  1. Free-pool ids that answered a real chat round-trip via the 18899
    //     gateway (see output/probe-all-models.mjs).
    //  2. Channel ids with a successful request history in channel-pack's
    //     token-ledger.json — e.g. Loomy/讯飞 spark-x2.6 (281 req / 30 err over
    //     3 days), qodercn qfmodel (888 req). These are NOT probed by the host,
    //     so without this list they were wrongly demoted and hidden.
    // Ids here match either the full catalog id or its tail segment (so
    // `spark-x2.6`, `loomy/spark-x2.6`, `loomy:spark-x2.6` all hit). Models with
    // only failures in the ledger (Kimi-K3, OpenPangu) are deliberately absent.
    // Re-check the ledger when quotas rotate or channels change.
    const MF_VERIFIED_LIVE = new Set([
      // free pool — real chat round-trip
      'recursive/flint-v1.0:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'baidu/ernie-5.5-flash-preview:free',
      'liquid/lfm-3-1.7b:free',
      'nvidia/nemotron-3.5-lightning:free',
      'nvidia/nemotron-3.5-super-vl:free',
      'stealth/glyph-cluster',
      'combo:main-fallback',
      // channel models — proven by token-ledger success history
      'qfmodel',              // qodercn, 888 req / 32 err
      'spark-x2.6',           // loomy 讯飞, 281 req / 30 err
      'sn-sensenova-6-8-flash', // raccoon
      'qwen3.8-omni-flash',   // lobsterai
      'MiniMax-M3.1-Flash',   // minimax
      'deepseek-v4-pro',      // lobsterai
    ])
    // Fast membership check against a normalized full id or any of its tail
    // segments, so channel-prefixed catalog ids still match a bare allowlist id.
    const mfIsLiveVerified = (id) => {
      for (const key of mfIdKeys(id)) if (MF_VERIFIED_LIVE.has(key)) return true
      const flat = mfNormalize(id)
      for (const verified of MF_VERIFIED_LIVE) if (flat.endsWith(mfNormalize(verified))) return true
      return false
    }
    const MF_FUNNEL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3.4h12L9.5 8.8v3.5L6.5 14V8.8z"/></svg>'

    function mfNormalize(value) {
      return String(value ?? '').toLowerCase().replace(/[^0-9a-z\u4e00-\u9fff]+/g, '')
    }

    /** Word-level tokens survive punctuation, unlike mfNormalize's flat string. */
    function mfTokens(value) {
      return String(value ?? '').toLowerCase().match(/[a-z0-9]{3,}|[\u4e00-\u9fff]{2,}/g) ?? []
    }

    /** The host may namespace an id (`provider:model/id`), so index both forms. */
    function mfIdKeys(raw) {
      const value = String(raw ?? '')
      const keys = new Set()
      const full = mfNormalize(value)
      if (full) keys.add(full)
      const parts = value.split(/[:/\\]/)
      if (parts.length > 1) {
        const tail = mfNormalize(parts[parts.length - 1])
        // Ignore short generic tails ("free", "auto"): many unrelated ids end
        // with them and they would collide in the shared index.
        if (tail.length >= 5) keys.add(tail)
      }
      return [...keys]
    }

    function mfIsVision(entry) {
      if (entry?.vision === true) return true
      return Array.isArray(entry?.inputModalities) && entry.inputModalities.includes('image')
    }

    function mfBuildIndex(catalog) {
      const byId = new Map()
      const byName = new Map()
      const names = []
      const tokenRows = new Map()
      let size = 0
      const put = (map, key, meta) => { if (key && !map.has(key)) map.set(key, meta) }
      for (const entry of Array.isArray(catalog) ? catalog : []) {
        if (!entry || typeof entry !== 'object') continue
        const id = String(entry.id ?? '').trim()
        const rawAvailability = String(entry.availability ?? 'unknown')
        // dsh-our-free-model labels every EAC / Kilo / aggregate / combo row
        // `available` without ever pinging it (probedAt === 0), so "available"
        // alone does not mean the model can actually answer. Demote those rows
        // to `unverified`; only a real probe verdict or the live-verified list
        // below counts as available. "Show unknown" still brings them back.
        const probedAt = Number(entry.probedAt ?? 0)
        const unverified = rawAvailability === 'available' && !(probedAt > 0)
        const availability = rawAvailability === 'available'
          ? (unverified && !mfIsLiveVerified(id) ? 'unverified' : 'available')
          : rawAvailability
        const meta = {
          id,
          name: String(entry.name ?? '').trim(),
          availability,
          vision: mfIsVision(entry),
        }
        if (!meta.id && !meta.name) continue
        size += 1
        for (const key of mfIdKeys(meta.id)) put(byId, key, meta)
        const keyName = mfNormalize(meta.name)
        if (keyName) {
          put(byName, keyName, meta)
          names.push([keyName, meta])
        }
        for (const token of new Set([...mfTokens(meta.id), ...mfTokens(meta.name)])) {
          if (!tokenRows.has(token)) tokenRows.set(token, [])
          tokenRows.get(token).push(meta)
        }
      }
      // Longest first: fuzzy label matching should prefer the most specific row.
      names.sort((a, b) => b[0].length - a[0].length)
      return { byId, byName, names, tokenRows, size }
    }

    /**
     * Last resort for renamed dynamic models: score catalog rows by the rare
     * tokens they share with the visible label. A token like "cline" (present on
     * hundreds of rows) is nearly worthless; a dated build token is decisive.
     */
    function mfTokenMatch(index, label) {
      const scores = new Map()
      for (const token of new Set(mfTokens(label))) {
        const rows = index.tokenRows.get(token)
        if (!rows || rows.length === 0) continue
        const weight = 1 / rows.length
        for (const meta of rows) scores.set(meta, (scores.get(meta) ?? 0) + weight)
      }
      let best = null
      let bestScore = 0
      for (const [meta, score] of scores) {
        if (score > bestScore) { bestScore = score; best = meta }
      }
      return bestScore >= 0.75 ? best : null
    }

    /** Resolve a picker option: data-model-id → exact label → fuzzy label → tokens. */
    function mfLookup(index, option) {
      if (!index || !option) return null
      const idNode = typeof option.querySelector === 'function' ? option.querySelector('[data-model-id]') : null
      const rawId = String(idNode?.getAttribute?.('data-model-id') ?? '')
      for (const key of mfIdKeys(rawId)) {
        if (index.byId.has(key)) return index.byId.get(key)
      }
      const flatId = mfNormalize(rawId)
      if (flatId) {
        for (const [key, meta] of index.byId) {
          if (key.length >= 5 && (flatId.includes(key) || key.includes(flatId))) return meta
        }
      }
      const rawLabel = String(option.getAttribute?.('title') || option.textContent || '')
      const label = mfNormalize(rawLabel)
      if (!label) return null
      if (index.byName.has(label)) return index.byName.get(label)
      for (const [key, meta] of index.names) {
        if (key.length >= 4 && (label.includes(key) || key.includes(label))) return meta
      }
      return mfTokenMatch(index, rawLabel)
    }

    /**
     * With a filter on, rows with no metadata are hidden by default: keeping
     * 500+ unknown entries would make "available only" look like it did nothing.
     * "Show unknown" brings them back for comparison.
     */
    function mfShouldShow(meta, filters) {
      const active = filters.available === true || filters.multimodal === true
      if (!meta) return !active || filters.showUnknown === true
      if (filters.available && meta.availability !== 'available') {
        // Unprobed channel rows are labelled `available` by the upstream but
        // were never verified; treat them like `unknown` so "available only"
        // really means "proven to answer". They come back with "show unknown".
        if (filters.showUnknown === true && meta.availability === 'unverified') return true
        return false
      }
      if (filters.multimodal && !meta.vision) return false
      return true
    }

    function mfReadState() {
      try {
        const raw = JSON.parse(localStorage.getItem(MF_KEY) || '{}')
        return {
          available: raw?.available === true,
          multimodal: raw?.multimodal === true,
          showUnknown: raw?.showUnknown === true,
          // Open by default: the chips are the actual feature, and a host that
          // re-renders the menu must not force an extra click before they show.
          expanded: raw?.expanded !== false,
        }
      } catch { return { available: false, multimodal: false, showUnknown: false, expanded: true } }
    }

    function mfWriteState(state) {
      try { localStorage.setItem(MF_KEY, JSON.stringify(state)) } catch { /* private mode */ }
    }

    // Collapsed model sources, keyed by the stable heading text (provider name).
    const MF_FOLD_KEY = 'session-tools.modelFilter.folds.v1'
    function mfReadFolds() {
      try {
        const raw = JSON.parse(localStorage.getItem(MF_FOLD_KEY) || '[]')
        return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string' && x) : [])
      } catch { return new Set() }
    }
    function mfWriteFolds(folds) {
      try { localStorage.setItem(MF_FOLD_KEY, JSON.stringify([...folds])) } catch { /* private mode */ }
    }

    // ── per-provider remaining quota ──────────────────────────────────────
    // Mirror dsh-our-free-model's own channel cards exactly: they ask the
    // channel-pack gateway for `credits.balances` with a 90s timeout, because
    // balances are fetched sequentially per account against upstream APIs.
    // `usage.badge` additionally probes subscription windows and needs even
    // longer — a 12s budget used to make every lookup time out to "—".
    const QUOTA_TTL = 120_000
    const QUOTA_TIMEOUT = 90_000
    const QUOTA_PARALLEL = 3
    const QUOTA_METHOD = 'credits.balances'

    // Ordered most-specific first: "Qoder 中国版" must not resolve to `qoder`,
    // and "WorkBuddy 国内版" must not resolve to `workbuddy` (the intl product).
    const QUOTA_PROVIDERS = [
      { id: 'qodercn', unit: 'credits', aliases: ['qoder中国版', 'qodercn'] },
      { id: 'buddy', unit: 'credits', aliases: ['workbuddy国内版', 'codebuddy', 'copilottencent'] },
      { id: 'workbuddy', unit: 'credits', aliases: ['workbuddy国际版', 'workbuddyai', 'workbuddy'] },
      { id: 'lobsterai', unit: 'credits', aliases: ['lobsterai', '有道', '龙虾'] },
      { id: 'codearts', unit: 'credits', aliases: ['codearts', '华为云'] },
      { id: 'qoder', unit: 'credits', aliases: ['qoder'] },
      { id: 'trae', unit: 'credits', aliases: ['trae', '字节'] },
      { id: 'cline', unit: 'dollars', aliases: ['cline'] },
      { id: 'loomy', unit: 'credits', aliases: ['loomy', '讯飞'] },
      { id: 'raccoon', unit: 'credits', aliases: ['raccoon', '商汤'] },
      { id: 'minimax', unit: 'credits', aliases: ['minimax'] },
      { id: 'zcode', unit: 'tokens', aliases: ['zcode', '智谱'] },
      { id: 'gemini', unit: 'count', aliases: ['gemini', 'googlecodeassist'] },
    ]

    /** Map a MenuGroup heading (e.g. "LobsterAI (有道)") to a provider id. */
    function mfProviderOf(name) {
      const key = mfNormalize(name)
      if (key.length < 3) return null
      for (const entry of QUOTA_PROVIDERS) {
        for (const alias of entry.aliases) {
          const a = mfNormalize(alias)
          if (a && (key.includes(a) || a.includes(key))) return entry
        }
      }
      return null
    }

    /** Same formatting as the channel cards' own `kilo()` (10K / 6.0K / 0). */
    function mfKilo(value) {
      const raw = Number(value)
      if (!Number.isFinite(raw)) return ''
      const n = Math.round(raw)
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
      if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`
      return String(n)
    }

    /**
     * `collectCreditBalances` emits `{balance}` where balance is usually
     * `{total, packages}`, but a few adapters (e.g. CodeArts) return a bare
     * number. Accept every shape the pack can produce so a number never reads
     * as "no data".
     */
    function mfQuotaValue(balance) {
      if (balance === null || balance === undefined) return null
      if (typeof balance === 'number') return Number.isFinite(balance) ? balance : null
      if (typeof balance !== 'object') return null
      for (const key of ['total', 'remaining', 'credit', 'credits', 'balance', 'amount', 'value']) {
        const raw = balance[key]
        if (typeof raw === 'number' && Number.isFinite(raw)) return raw
        if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) return Number(raw)
      }
      if (Array.isArray(balance.packages)) {
        let sum = 0
        let known = false
        for (const pkg of balance.packages) {
          if (pkg?.active === false) continue
          const raw = Number(pkg?.remaining ?? pkg?.total)
          if (Number.isFinite(raw)) { sum += raw; known = true }
        }
        if (known) return sum
      }
      return null
    }

    /** Sum the enabled accounts' balance totals; keep the failure evidence. */
    function mfQuotaTotal(snapshot) {
      const rows = Array.isArray(snapshot?.accounts) ? snapshot.accounts : []
      let total = 0
      let known = 0
      for (const row of rows) {
        const amount = mfQuotaValue(row?.balance)
        if (amount === null) continue
        total += amount
        known += 1
      }
      return { total, known, accounts: rows.length }
    }

    function mfBadgeBody(provider, force) {
      return {
        type: 'client-request',
        rpcId: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        method: 'channel-pack',
        payload: {
          method: QUOTA_METHOD,
          payload: force ? { provider, force: true } : { provider },
        },
      }
    }

    /**
     * `connection.rpc.call` hands back the handler's `{ok,value}`; a raw HTTP
     * reply wraps that once more in `{type:'server-response',rpcId,result}`.
     * Some shells add another `data` layer. Peel them all off.
     */
    function mfUnwrapQuota(result) {
      if (!result || typeof result !== 'object') throw new Error('empty response')
      let node = result
      for (let depth = 0; depth < 5 && node && typeof node === 'object'; depth += 1) {
        if (Array.isArray(node.accounts)) return node
        if (node.ok === false) throw new Error(node.error?.message || node.error?.code || 'rpc-failed')
        if (node.value && typeof node.value === 'object') { node = node.value; continue }
        if (node.result && typeof node.result === 'object') { node = node.result; continue }
        if (node.data && typeof node.data === 'object') { node = node.data; continue }
        break
      }
      throw new Error('unexpected payload')
    }

    /** A short, language-neutral reason so a broken channel is visible at a glance. */
    function mfShortError(message) {
      const text = String(message || '')
      if (/abort|timeout|timed.?out/i.test(text)) return 'timeout'
      const http = text.match(/HTTP\s*(\d{3})/)
      if (http) return `HTTP${http[1]}`
      if (/no-account|unsupported provider|未接入/i.test(text)) return 'no-acct'
      if (/no-connection|no-conn/i.test(text)) return 'no-conn'
      if (/unexpected payload|empty response/i.test(text)) return 'payload'
      if (/network|fetch failed/i.test(text)) return 'network'
      return 'error'
    }

    /** MenuGroup renders <section data-menu-group><div data-menu-group-heading>. */
    function mfGroupHeading(group) {
      const direct = typeof group?.querySelector === 'function'
        ? group.querySelector('[data-menu-group-heading]') : null
      if (direct && direct.parentElement === group) return direct
      const kids = Array.from(group?.children ?? [])
      return kids.find((node) => node?.getAttribute?.('role') !== 'menuitemradio' &&
        node?.tagName !== 'BUTTON') ?? null
    }

    /** Resolve the source section owning an option; fall back to the list's direct child. */
    function mfGroupOf(option, list) {
      let node = option
      while (node && node !== list) {
        if (typeof node.getAttribute === 'function' &&
            node.getAttribute('data-menu-group') !== null) return node
        node = node.parentElement
      }
      let group = option
      while (group?.parentElement && group.parentElement !== list) group = group.parentElement
      return group
    }

    function startModelFilter(translate, ctx) {
      const state = mfReadState()
      const folds = mfReadFolds()
      let lastGroupKeys = []
      let lastFold = { key: '', at: 0 }
      const t = (key, vars) => translate(key, vars)
      const quota = new Map()
      const quotaPending = new Set()
      const quotaJobs = []
      const quotaControllers = new Set()
      let quotaActive = 0
      let index = null
      let lastFetch = 0
      let fetchError = ''
      let fetching = false
      let disposed = false
      let bar = null
      let menu = null
      let list = null
      let current = null
      let listObserver = null
      let bodyObserver = null
      let frame = 0

      function summaryUrls() {
        const urls = []
        const add = (value) => { if (value && !urls.includes(value)) urls.push(value) }
        try {
          const resolved = new URL('api/our-free-model/summary', document.baseURI)
          // Exactly the shape used by dsh-our-free-model's own api(): a
          // pathname, so a reverse-proxy prefix is preserved.
          add(resolved.pathname)
          // Some hosts gate the web app on a token carried in the page URL;
          // carry that query along as a second candidate.
          const pageQuery = new URL(document.baseURI).search
          if (pageQuery) {
            const withQuery = new URL(resolved.href)
            withQuery.search = pageQuery
            add(withQuery.href)
          }
        } catch { /* no usable base URI */ }
        add('/api/our-free-model/summary')
        return urls
      }

      async function loadCatalog(force) {
        if (fetching || disposed) return
        if (!force && index && Date.now() - lastFetch < MF_TTL) return
        fetching = true
        let lastError = ''
        try {
          for (const url of summaryUrls()) {
            try {
              const response = await fetch(url, { headers: { Accept: 'application/json' }, redirect: 'error' })
              if (!response.ok) { lastError = `HTTP ${response.status}`; continue }
              const payload = await response.json()
              if (!payload || !Array.isArray(payload.catalog)) { lastError = 'unexpected payload'; continue }
              index = mfBuildIndex(payload.catalog)
              lastFetch = Date.now()
              fetchError = ''
              render()
              applyFilter()
              return
            } catch (error) { lastError = error?.message ?? String(error) }
          }
          fetchError = lastError || 'unavailable'
          render()
        } finally { fetching = false }
      }

      // ── quota lookups ─────────────────────────────────────────────────────
      function visibleProviders() {
        const out = new Set()
        if (!list || typeof list.querySelectorAll !== 'function') return []
        for (const heading of Array.from(list.querySelectorAll('[data-menu-group-heading]'))) {
          const provider = mfProviderOf(foldKey(heading))
          if (provider) out.add(provider.id)
        }
        return [...out]
      }

      /** The badge lives in a data attribute, so heading text stays fold-safe. */
      function renderQuotaTags() {
        if (!list || !list.isConnected || disposed ||
            typeof list.querySelectorAll !== 'function') return
        for (const heading of Array.from(list.querySelectorAll('[data-menu-group-heading]'))) {
          const provider = mfProviderOf(foldKey(heading))
          if (!provider) { setAttr(heading, 'data-st-mf-quota', ''); continue }
          const entry = quota.get(provider.id)
          setAttr(heading, 'data-st-mf-quota', entry ? entry.text : t('quota.none'))
          setAttr(heading, 'title', entry?.hint || t('quota.hint'))
        }
      }

      function quotaText(snapshot, provider) {
        const sum = mfQuotaTotal(snapshot)
        if (sum.accounts === 0) {
          return { state: 'error', text: t('quota.none'), hint: t('quota.noAccount') }
        }
        if (sum.known === 0) {
          // Accounts exist but no numeric field was recognised — surface the
          // cause instead of the same silent "—" as an unconnected provider.
          return { state: 'error', text: '×payload', hint: t('quota.noData') }
        }
        const shown = provider.unit === 'dollars'
          ? (Math.round(sum.total * 100) / 100).toFixed(2)
          : mfKilo(sum.total)
        const key = {
          credits: 'quota.credits', dollars: 'quota.dollars',
          tokens: 'quota.tokens', count: 'quota.count',
        }[provider.unit] || 'quota.credits'
        return { state: 'ok', text: t(key, { value: shown }), hint: t('quota.hint') }
      }

      function quotaUrls() {
        const urls = []
        const add = (value) => { if (value && !urls.includes(value)) urls.push(value) }
        try {
          const resolved = new URL('api/channel-pack', document.baseURI)
          // Keep any reverse-proxy prefix, exactly like summaryUrls().
          add(resolved.pathname)
          const pageQuery = new URL(document.baseURI).search
          if (pageQuery) {
            const withQuery = new URL(resolved.href)
            withQuery.search = pageQuery
            add(withQuery.href)
          }
        } catch { /* no usable base URI */ }
        add('/api/channel-pack')
        return urls
      }

      async function fetchQuota(providerId, force) {
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        const timer = controller ? setTimeout(() => controller.abort(), QUOTA_TIMEOUT) : 0
        if (controller) quotaControllers.add(controller)
        try {
          const payload = force ? { provider: providerId, force: true } : { provider: providerId }
          // `ctx.connection` is a guarded accessor: reading it without an
          // explicit `inject` entry throws "cannot get property ... without
          // inject". Optional chaining / ?? cannot catch a throwing getter, so
          // mirror the model plugin: try the property, then fall back to the
          // explicit get() (allowed for an optional, undeclared service).
          let conn
          try { conn = ctx?.connection } catch { conn = undefined }
          if (conn === undefined && typeof ctx?.get === 'function') {
            try { conn = ctx.get('connection') } catch { conn = undefined }
          }
          let rpcError = ''
          if (conn?.rpc?.call) {
            try {
              const result = await conn.rpc.call('/api', 'channel-pack',
                { method: QUOTA_METHOD, payload }, controller?.signal)
              return mfUnwrapQuota(result)
            } catch (error) {
              // A shell whose connection service speaks a different dialect
              // must not hide the quota: fall through to the HTTP gateway.
              rpcError = error?.message || String(error)
            }
          }
          let httpError = ''
          for (const url of quotaUrls()) {
            try {
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(mfBadgeBody(providerId, force)),
                redirect: 'error',
                signal: controller?.signal,
              })
              if (!response.ok) { httpError = `HTTP ${response.status}`; continue }
              return mfUnwrapQuota((await response.json())?.result)
            } catch (error) {
              httpError = error?.message || String(error)
            }
          }
          throw new Error(rpcError ? `${rpcError}; HTTP ${httpError}` : (httpError || 'unavailable'))
        } finally {
          if (timer) clearTimeout(timer)
          if (controller) quotaControllers.delete(controller)
        }
      }

      /** Best-effort durable trace: a 401 and a timeout must be distinguishable. */
      function reportQuota(providerId, outcome, detail) {
        try {
          fetch('/session-tools/quota-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line: `${providerId} ${outcome} ${String(detail).slice(0, 900)}` }),
          }).catch(() => {})
        } catch { /* diagnostics must never break the picker */ }
      }

      async function runQuota(providerId, force) {
        const meta = QUOTA_PROVIDERS.find((entry) => entry.id === providerId)
        if (!meta) return
        quota.set(providerId, {
          at: Date.now(), state: 'loading',
          text: t('quota.loading'), hint: t('quota.hint'),
        })
        renderQuotaTags()
        try {
          const snapshot = await fetchQuota(providerId, force)
          if (disposed) return
          const entry = quotaText(snapshot, meta)
          quota.set(providerId, { at: Date.now(), ...entry })
          reportQuota(providerId, entry.state, entry.text)
        } catch (error) {
          if (disposed) return
          const message = error?.message || String(error)
          const code = mfShortError(message)
          quota.set(providerId, {
            at: Date.now(), state: 'error', text: `×${code}`,
            hint: t('quota.error', { message }),
          })
          reportQuota(providerId, 'error', `${code}: ${message}`)
        }
        renderQuotaTags()
      }

      function enqueueQuota(providerId, force) {
        if (!providerId || quotaPending.has(providerId) || disposed) return
        if (!force) {
          const cached = quota.get(providerId)
          if (cached && (cached.state === 'loading' || Date.now() - cached.at < QUOTA_TTL)) return
        }
        quotaPending.add(providerId)
        quotaJobs.push({ providerId, force })
        pumpQuota()
      }

      // Bounded parallelism: an unauthenticated provider fails fast, but a
      // dozen slow upstream balance endpoints must not stall the picker.
      function pumpQuota() {
        while (!disposed && quotaActive < QUOTA_PARALLEL && quotaJobs.length) {
          const job = quotaJobs.shift()
          quotaActive += 1
          Promise.resolve(runQuota(job.providerId, job.force))
            .catch(() => {})
            .finally(() => {
              quotaActive -= 1
              quotaPending.delete(job.providerId)
              pumpQuota()
            })
        }
      }

      function refreshQuotas() {
        for (const id of visibleProviders()) enqueueQuota(id, true)
      }

      /**
       * More than one ModelSelect can exist on a page (composer, settings-style
       * pickers). Prefer the one with the most options; on a tie take the last,
       * which is the most recently opened portal.
       */
      function findPicker() {
        const boxes = Array.from(document.querySelectorAll('input[role="searchbox"][aria-controls$="-models"]'))
        let best = null
        let bestCount = -1
        for (const box of boxes) {
          if (!box.isConnected) continue
          const listEl = document.getElementById(box.getAttribute('aria-controls'))
          if (!listEl) continue
          const surface = box.closest('[id$="-menu"]') || listEl.parentElement
          const row = box.parentElement
          if (!surface || !row) continue
          const count = listEl.querySelectorAll('button[role="menuitemradio"]').length
          if (count >= bestCount) {
            bestCount = count
            best = { box, listEl, surface, row }
          }
        }
        return best
      }

      // Every host DOM mutation runs `ensure` again. Replacing identical text
      // would create a fresh text node each time and feed the observer forever,
      // so all writes are guarded by a value comparison.
      function setText(node, value) {
        const text = String(value)
        if (node && node.textContent !== text) node.textContent = text
      }
      function setAttr(node, name, value) {
        const text = String(value)
        if (node && node.getAttribute(name) !== text) node.setAttribute(name, text)
      }
      function setHidden(node, hidden) {
        if (node && node.hidden !== hidden) node.hidden = hidden
      }

      function mountBar(found) {
        const root = document.createElement('div')
        root.className = 'st-mf'
        root.setAttribute('role', 'group')
        root.innerHTML = [
          '<div class="st-mf-row">',
            '<button type="button" class="st-mf-btn" data-mf="toggle" aria-expanded="false">',
              MF_FUNNEL, '<span data-mf="label"></span>',
              '<span class="st-mf-badge" data-mf="badge" hidden></span></button>',
          '<div class="st-mf-chips" data-mf="chips" hidden>',
            '<button type="button" class="st-mf-chip" data-mf="available" aria-pressed="false"></button>',
            '<button type="button" class="st-mf-chip" data-mf="multimodal" aria-pressed="false"></button>',
            '<button type="button" class="st-mf-chip" data-mf="showUnknown" aria-pressed="false"></button>',
            '<button type="button" class="st-mf-chip" data-mf="foldAll"></button>',
            '<button type="button" class="st-mf-chip" data-mf="refreshQuota"></button>',
            '<button type="button" class="st-mf-clear" data-mf="clear" hidden></button>',
          '</div></div>',
          '<div class="st-mf-meta">',
            '<span data-mf="stat"></span>',
            '<span class="st-mf-warn" data-mf="unknown" hidden></span>',
            '<span class="st-mf-folded" data-mf="folded" hidden></span>',
            '<span class="st-mf-error" data-mf="noData" hidden></span>',
            '<button type="button" class="st-mf-retry" data-mf="retry" hidden></button>',
          '</div>',
        ].join('')
        const HANDLED = new Set(['toggle', 'available', 'multimodal', 'showUnknown', 'foldAll', 'refreshQuota', 'clear', 'retry'])
        let lastActivation = { key: '', at: 0 }

        function activate(key) {
          if (key === 'toggle') {
            state.expanded = !state.expanded
          } else if (key === 'available' || key === 'multimodal' || key === 'showUnknown') {
            state[key] = !state[key]
          } else if (key === 'clear') {
            state.available = false
            state.multimodal = false
            state.showUnknown = false
          } else if (key === 'foldAll') {
            const allCollapsed = lastGroupKeys.length > 0 && lastGroupKeys.every((k) => folds.has(k))
            if (allCollapsed) folds.clear()
            else for (const k of lastGroupKeys) folds.add(k)
            mfWriteFolds(folds)
          } else if (key === 'refreshQuota') {
            refreshQuotas()
          } else if (key === 'retry') {
            loadCatalog(true)
            return
          } else return
          mfWriteState(state)
          render()
          applyFilter()
          // The host may replace the whole list on this very gesture. Re-resolve
          // the picker next frame so a stale `list` never leaves empty source
          // headings on screen until the user clicks something else.
          schedule(() => { ensure(); applyFilter() })
        }

        /**
         * Only the button is actionable. `closest('[data-mf]')` would stop on the
         * inner <span data-mf="label"> — i.e. exactly the text the user clicks —
         * and silently discard the event. Duck-typing instead of `instanceof
         * Element` also keeps this working if the bundle and menu are in
         * different realms.
         */
        function hitKey(event) {
          const target = event?.target
          const hit = target && typeof target.closest === 'function'
            ? target.closest('button[data-mf]') : null
          if (!hit || !root.contains(hit)) return ''
          const key = hit.dataset?.mf ?? ''
          return HANDLED.has(key) ? key : ''
        }

        // Keep focus in the search box: a blur makes the host re-render the
        // portal, which used to replace the button between mousedown and click.
        root.addEventListener('mousedown', (event) => {
          if (hitKey(event)) event.preventDefault?.()
        })
        // Act on press, not on release. If the host does replace the node mid
        // gesture, no click is ever dispatched — the state is already saved.
        root.addEventListener('pointerdown', (event) => {
          const key = hitKey(event)
          if (!key) return
          event.preventDefault?.()
          event.stopPropagation?.()
          activate(key)
          lastActivation = { key, at: Date.now() }
        })
        // Fallback for keyboard activation and browsers without PointerEvent.
        root.addEventListener('click', (event) => {
          const key = hitKey(event)
          if (!key) return
          event.stopPropagation?.()
          if (lastActivation.key === key && Date.now() - lastActivation.at < 1500) {
            lastActivation = { key: '', at: 0 }
            return // already handled on pointerdown; never toggle twice
          }
          activate(key)
        })
        found.row.after(root)
        return root
      }

      // Group headings belong to React and are replaced on every re-render, so
      // delegate from document and resolve the heading at event time.
      function foldHeading(event) {
        const target = event?.target
        if (!target || typeof target.closest !== 'function') return null
        const heading = target.closest('[data-menu-group-heading]')
        if (!heading || !list || !list.isConnected ||
            typeof list.contains !== 'function' || !list.contains(heading)) return null
        return heading
      }
      function foldKey(heading) {
        return heading.getAttribute('data-st-mf-key') ||
          String(heading.textContent || '').replace(/[▾▸]/g, '').trim()
      }
      function toggleFold(heading) {
        const key = foldKey(heading)
        if (!key) return
        if (folds.has(key)) folds.delete(key)
        else folds.add(key)
        mfWriteFolds(folds)
        render()
        applyFilter()
      }
      function onFoldMouseDown(event) {
        if (foldHeading(event)) event.preventDefault?.()
      }
      function onFoldPointerDown(event) {
        const heading = foldHeading(event)
        if (!heading) return
        event.preventDefault?.()
        event.stopPropagation?.()
        toggleFold(heading)
        lastFold = { key: foldKey(heading), at: Date.now() }
      }
      function onFoldClick(event) {
        const heading = foldHeading(event)
        if (!heading) return
        event.stopPropagation?.()
        const key = foldKey(heading)
        if (lastFold.key === key && Date.now() - lastFold.at < 1500) {
          lastFold = { key: '', at: 0 }
          return // pointerdown already handled this gesture
        }
        toggleFold(heading)
      }
      const foldListeners = [
        ['mousedown', onFoldMouseDown],
        ['pointerdown', onFoldPointerDown],
        ['click', onFoldClick],
      ]
      for (const [type, fn] of foldListeners) {
        if (typeof document.addEventListener === 'function') document.addEventListener(type, fn)
      }

      function q(key) {
        return bar ? bar.querySelector(`[data-mf="${key}"]`) : null
      }

      function renderFoldControls() {
        const foldAll = q('foldAll')
        if (!foldAll) return
        const allCollapsed = lastGroupKeys.length > 0 && lastGroupKeys.every((k) => folds.has(k))
        setText(foldAll, allCollapsed ? t('filter.unfoldAll') : t('filter.foldAll'))
        setAttr(foldAll, 'aria-pressed', allCollapsed ? 'true' : 'false')
        setAttr(foldAll, 'title', t('filter.foldHint'))
        const foldedCount = lastGroupKeys.filter((k) => folds.has(k)).length
        setHidden(q('folded'), foldedCount === 0)
        setText(q('folded'), foldedCount ? t('filter.folded', { count: foldedCount }) : '')
      }

      function render() {
        if (!bar || !bar.isConnected) return
        const active = Number(state.available) + Number(state.multimodal)
        const toggle = q('toggle')
        if (!toggle) return
        setAttr(toggle, 'data-active', active > 0 ? 'true' : 'false')
        setAttr(toggle, 'aria-expanded', state.expanded ? 'true' : 'false')
        setAttr(toggle, 'title', t('filter.title'))
        setAttr(toggle, 'aria-label', t('filter.title'))
        setText(q('label'), t('filter.button'))
        const badge = q('badge')
        setHidden(badge, active === 0)
        setText(badge, String(active))
        setHidden(q('chips'), !state.expanded)
        for (const key of ['available', 'multimodal', 'showUnknown']) {
          const chip = q(key)
          setText(chip, t(`filter.${key}`))
          setAttr(chip, 'aria-pressed', state[key] ? 'true' : 'false')
          setAttr(chip, 'title', t(`filter.${key}Hint`))
        }
        const clear = q('clear')
        setText(clear, t('filter.clear'))
        setHidden(clear, active === 0 && !state.showUnknown)
        setHidden(q('noData'), !fetchError)
        setText(q('noData'), fetchError ? t('filter.noData', { message: fetchError }) : '')
        setHidden(q('retry'), !fetchError)
        setText(q('retry'), t('filter.retry'))
        const refresh = q('refreshQuota')
        setText(refresh, t('quota.refresh'))
        setAttr(refresh, 'title', t('quota.refreshHint'))
        renderFoldControls()
      }

      /** Inject one fold button per source heading; idempotent across re-renders. */
      function ensureFoldButton(heading) {
        let key = heading.getAttribute('data-st-mf-key')
        if (!key) {
          key = String(heading.textContent || '').replace(/[▾▸]/g, '').trim()
          if (key) setAttr(heading, 'data-st-mf-key', key)
        }
        let button = typeof heading.querySelector === 'function'
          ? heading.querySelector('[data-st-mf-fold]') : null
        if (!button && typeof document.createElement === 'function') {
          button = document.createElement('button')
          button.setAttribute('type', 'button')
          button.setAttribute('data-st-mf-fold', '')
          button.className = 'st-mf-fold'
          const first = heading.firstChild ?? null
          if (typeof heading.insertBefore === 'function') heading.insertBefore(button, first)
          else if (typeof heading.prepend === 'function') heading.prepend(button)
          else heading.appendChild(button)
        }
        return { key, button }
      }

      function applyFilter() {
        if (!list || !list.isConnected || !bar) return
        const options = Array.from(list.querySelectorAll('button[role="menuitemradio"]'))
        const groups = new Map()
        const filtering = state.available || state.multimodal
        let shown = 0
        let unknown = 0

        function groupInfo(section) {
          let info = groups.get(section)
          if (!info) {
            const heading = mfGroupHeading(section)
            const prepared = heading ? ensureFoldButton(heading) : { key: '', button: null }
            info = {
              flags: [],
              key: prepared.key,
              heading,
              button: prepared.button,
              collapsed: prepared.key ? folds.has(prepared.key) : false,
            }
            groups.set(section, info)
          }
          return info
        }

        // Seed every source section, including ones whose options are not in the
        // DOM yet (virtualised list / host-side search). Without this their
        // heading survives a filter until the user expands the group and React
        // finally renders the options — the old "expand once to make it vanish".
        if (typeof list.querySelectorAll === 'function') {
          for (const section of Array.from(list.querySelectorAll('[data-menu-group]'))) {
            if (section) groupInfo(section)
          }
        }

        for (const option of options) {
          const meta = mfLookup(index, option)
          if (!meta) unknown += 1
          const info = groupInfo(mfGroupOf(option, list))
          const passes = mfShouldShow(meta, state)
          const visible = passes && !info.collapsed
          // React owns className, not inline display; clearing it restores the
          // host layout without fighting its renderer.
          option.style.display = visible ? '' : 'none'
          if (passes) shown += 1 // the counter reports filtering, not folding
          info.flags.push(passes)
        }
        lastGroupKeys = [...groups.values()].map((i) => i.key).filter(Boolean)
        for (const [group, info] of groups) {
          const hasMatch = info.flags.some(Boolean)
          // While filtering, a source with no match must disappear at once,
          // heading included. Being collapsed must not keep it alive — that
          // used to postpone the removal until an expand/collapse click.
          const hide = filtering && !hasMatch
          group.style.display = hide ? 'none' : ''
          setAttr(group, 'data-st-mf-empty', hide ? 'true' : 'false')
          // The heading may be portalled/sticky outside the section; tag it too.
          if (info.heading) setAttr(info.heading, 'data-st-mf-empty', hide ? 'true' : 'false')
          if (info.button) {
            setText(info.button, info.collapsed ? '▸' : '▾')
            setAttr(info.button, 'aria-expanded', info.collapsed ? 'false' : 'true')
            setAttr(info.button, 'aria-label', info.collapsed ? t('filter.unfold') : t('filter.fold'))
            setAttr(info.button, 'title', t('filter.foldHint'))
            setAttr(info.button, 'data-collapsed', info.collapsed ? 'true' : 'false')
          }
        }
        setText(q('stat'), shown === 0 && (state.available || state.multimodal)
          ? t('filter.empty')
          : t('filter.stat', { shown, total: options.length }))
        setHidden(q('unknown'), index === null)
        setText(q('unknown'), index === null ? ''
          : t('filter.unknown', { count: unknown, meta: index.size }))
        renderFoldControls()
        renderQuotaTags()
        for (const id of visibleProviders()) enqueueQuota(id, false)
      }

      function schedule(task) {
        if (frame || disposed) return
        frame = requestAnimationFrame(() => {
          frame = 0
          if (!disposed) task()
        })
      }

      function detachList() {
        if (listObserver) { listObserver.disconnect(); listObserver = null }
        list = null
      }

      function detach() {
        if (bar) { bar.remove(); bar = null }
        detachList()
        menu = null
        current = null
      }

      function ensure() {
        const found = findPicker()
        if (!found) { detach(); return }
        if (menu !== found.surface || list !== found.listEl) {
          detachList()
          menu = found.surface
          list = found.listEl
        }
        current = found
        // `row.after(bar)` puts the bar in row's parent, not necessarily in
        // `surface` (the closest [id$="-menu"] can be several levels up). The
        // old `bar.parentElement !== menu` test was therefore always true on
        // the real portal and rebuilt the bar on every mutation — destroying
        // the very button the user was pressing. Compare against the real
        // insertion parent instead, and move the existing node when reordering.
        const anchor = found.row.parentElement
        if (!bar || !bar.isConnected || bar.parentElement !== anchor) {
          if (bar) bar.remove()
          bar = mountBar(found)
        } else if (found.row.nextElementSibling !== bar) {
          found.row.after(bar)
        }
        if (!listObserver) {
          listObserver = new MutationObserver(() => schedule(() => {
            if (!current || !list || !list.isConnected) return
            if (bar && bar.isConnected && current.row.nextElementSibling !== bar) current.row.after(bar)
            applyFilter()
          }))
          listObserver.observe(list, { childList: true, subtree: true })
        }
        render()
        applyFilter()
        loadCatalog(false)
      }

      const observedRoot = document.body || document.documentElement
      bodyObserver = new MutationObserver((records) => {
        // Our own status writes create text nodes inside the bar. Feeding those
        // back into `ensure` is pure churn; ignore records originating in it.
        if (records?.length && bar && records.every((record) => {
          const node = record?.target
          return node === bar || (node && typeof bar.contains === 'function' && bar.contains(node))
        })) return
        schedule(ensure)
      })
      bodyObserver.observe(observedRoot, { childList: true, subtree: true })
      ensure()
      return () => {
        disposed = true
        if (frame) cancelAnimationFrame(frame)
        if (bodyObserver) bodyObserver.disconnect()
        for (const controller of quotaControllers) {
          try { controller?.abort?.() } catch { /* already settled */ }
        }
        quotaControllers.clear()
        for (const [type, fn] of foldListeners) {
          if (typeof document.removeEventListener === 'function') document.removeEventListener(type, fn)
        }
        detach()
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.plugin = '@local/session-tools'
          style.textContent = CSS + MF_CSS
          document.head.appendChild(style)
          return () => style.remove()
        }, 'session-tools: styles')

        // Dictionaries enter the shared locale registry, so the rows read the
        // user's language and re-render when it changes in Settings.
        ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), 'session-tools: dictionaries')

        // The slot injects `t` bound to this namespace for a registered entry; the
        // wrapper keeps a local fallback so a missing seat never blanks the row.
        const fallbackTranslate = makeTranslate(ctx)
        const withTranslate = (Component) => (props) =>
          h(Component, { ...props, t: typeof props?.t === 'function' ? props.t : fallbackTranslate })
        const beforeDelete = (id) => archiveBeforeDelete(ctx, id)

        ctx.slots.inject('sidebar.workspaces.session.menu.item', () => {
          ctx.slots.register(
            { name: 'sidebar.workspaces.session.menu.item', id: 'open-folder', order: 460, locale: NS },
            withTranslate(OpenFolderMenuItem),
          )
          ctx.slots.register(
            { name: 'sidebar.workspaces.session.menu.item', id: 'delete-session', order: 900, locale: NS },
            (props) => h(withTranslate(DeleteSessionMenuItem), { ...props, beforeDelete }),
          )
        })

        // A Settings page holding the two durable directories.
        ctx.slots.inject('settings.section', () => {
          ctx.slots.register({
            name: 'settings.section',
            id: 'session-tools-storage',
            order: 150,
            label: () => fallbackTranslate('storage.title'),
            locale: NS,
          }, withTranslate(createStorageSection(ctx, fallbackTranslate)))
        })

        // The composer's model picker has no client slot, so attach the filter
        // bar through a DOM observer. Returning the teardown lets Cordis undo it
        // when the plugin is disabled or reloaded.
        ctx.effect(() => startModelFilter(fallbackTranslate, ctx), 'session-tools: model filter')
      },
    }
  },
})

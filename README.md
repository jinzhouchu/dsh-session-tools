# 会话工具 · Session Tools

> DeepSeek Harness（`dsh-desktop`）的本地增强插件。
> 把会话存储目录管理、对话记录操作、模型选择器增强三件事做在一起。

`@local/session-tools` · v1.0.0 · 适用于带 `cordis.patch.yml` bundle patch 机制的 Harness 桌面端。

---

## 为什么做这个插件

Harness 本身有几个不好用的地方：

- **会话记录没法删**：`dsh-session-persistence` 明确没有删除/保留策略 API，JSONL 后端也「Nothing deletes session files」。对话越积越多，只能手动去数据目录里翻。
- **存储目录设置在热重载时会回滚**：`configEditor.edit()` 会触发 recompose，但在本机构建上必然报 `file-upload: Agent resolver is already registered`，patch 被自动撤销，前端表现为裸 `405`。
- **模型下拉没有筛选**：几百个模型混在一起，分不清哪些可用、哪些支持图片、哪些是按量计费的免费渠道，也看不出每个来源还剩多少额度。

这个插件逐个解决上面三点。

---

## 功能

### 1. 会话与存储目录管理

设置页「会话工具」一节可以：

- 查看 `sessions`（对话记录）和 `storages`（状态数据）两种存储的**当前生效路径**与**已保存路径**；两者不一致时标「● 待重启」。
- 修改任一存储根目录；修改时**先把旧目录内容完整复制到新目录，再写配置**，避免数据丢失。
- 支持一键迁移；路径校验会拒绝嵌套目录、共用同一 root 等危险配置，并兼容 Windows 大小写不敏感的路径比较。

> 实现上刻意绕开了 `configEditor.edit()`：直接对 profile 的 `cordis.patch.yml` 做行级编辑（原子写 + 并发锁），只改目标条目的 `config.root`，保留注释与其它配置。**改完必须重启 Harness 才生效。**

### 2. 对话右键菜单

每个会话新增两个操作：

- **打开所在文件夹** —— 在系统文件管理器里定位该会话的记录目录。
- **彻底删除记录** —— 先把会话从侧栏归档、flush 活跃状态，再删除磁盘文件。安全检查包括：路径必须落在 sessions root 内、拒绝删除发起本次操作的当前对话、拒绝删除仍在运行的会话。

Host 侧同时注册了工具 `open_folder` / `delete` / `storage_info` / `storage_set` / `storage_migrate`，以及 HTTP 路由 `/session-tools/{locate,open-folder,delete,storage-info,storage-set,storage-migrate,quota-log}`。

### 3. 模型选择器增强

打开输入框的模型下拉，搜索框下方会出现一条筛选/分组工具条：

| 功能 | 说明 |
|---|---|
| **仅可用** | 只显示**探测确认可用**或列入实测白名单的模型；上游把未探测的渠道模型（EAC/Kilo/aggregate/combo，`probedAt === 0`）直接标成 `available`，这些会被当成「未验证」隐藏，可用「显示未知」放回 |
| **仅多模态** | 只显示支持图像输入（`vision === true`）的模型 |
| **显示未知** | 把没有状态元数据的模型重新显示出来，不参与上述两个判定 |
| **来源折叠** | 每个来源标题前加 `▾/▸` 按钮，点标题也能折叠/展开；状态按来源名存 localStorage |
| **全部收起 / 全部展开** | 一键操作所有来源 |
| **刷新额度** | 强制重查各厂商剩余额度（默认缓存 2 分钟） |

细节：

- 筛选后**零命中的来源连标题一起立即隐藏**，不需要先展开一次。
- **"可用"的可信度**：`dsh-our-free-model` 的 summary 把未探测的模型（`probedAt === 0`，含 EAC / Kilo / aggregate / combo）无条件标成 `available`，所以标"可用"不等于真能对话。本插件据此把它们降级为 `unverified`，"仅可用"默认隐藏；有真实证据能吐字的模型列在 `client.js` 的 `MF_VERIFIED_ROWS` 里，匹配支持完整 id 与尾缀（如 `spark-x2.6` 可命中 `loomy:spark-x2.6`）。渠道模型的证据来自 `token-ledger.json`，会随实际路由变化更新：11-25 起 Loomy 的实际流量从 `spark-x2.6` 迁到 `auto`（54req/34err），所以 `auto` 也以 `providers: ['loomy', 'qodercn']` 入表。
  - ⚠️ `/summary` 只发布免费池 + Kilo 约 48 行，**Loomy（讯飞）/Qoder/Raccoon/LobsterAI 等渠道模型根本不在目录里**。早期只写白名单没有可匹配的行，导致"仅可用"把整个讯飞组隐藏。现在证据行会携带下拉实际渲染的别名（如 `Spark X2.6 · x0.1`）被种子化进索引；种子行只参与查找，不计入"元数据 N 条"统计。
  - 白名单有**严格的证据门槛**，只收两类：① 18899 网关真实对话实测通过的免费池模型；② `channel-pack/token-ledger.json` 里**有充分成功记录**（数十次请求）的渠道模型（讯飞 `spark-x2.6` 281req、qodercn `qfmodel` 888req 等）。仅 1 次成功、或只有失败记录的（Kimi-K3、OpenPangu、Qoder `mmodel`/MiniMax-M3 7req/7err）一律不收。
  - ⚠️ **证据按产品隔离**：同一个 id 在不同渠道表现可以完全相反。`qfmodel`（显示名 `Qwen3.8-Flash · 免费`）在 Qoder 中国版有 888req/32err 的成功历史，但 Qoder 国际版 2026-11-25 是 5req/5err（112/model_error + pricingUrl 门槛）。证据行带 `providers`，`mfLookup` 会用来源分组校验；Qoder 国际版不会继承 Qoder 中国版的"可用"判定。
  - ⚠️ 已修复的坑：一个失败渠道模型（如 Qoder `mmodel`，显示名 MiniMax-M3）会被 `mfLookup` 的模糊名字匹配串到白名单里的 `minimaxai/minimax-m3.1-flash`，从而"借用"对方的 available 通过筛选。证据门槛 + 回归测试已堵住；切勿把名字相似但证据不足的模型加入白名单。
  - 注意：**额度徽章显示的数字是账户余额，与某个具体模型能否调用是两回事**（Qoder 有 398 积分但 `mmodel` 全失败）。渠道额度与可用模型都会滚动，需定期对照 ledger 更新白名单。
- 来源标题黑色加粗；额度写在 `data-st-mf-quota` 属性上，用 CSS `::after` 渲染，不污染作为折叠 key 的标题文字。
- 三种开关状态跨重启保留。

#### 厂商剩余额度

额度来自 `dsh-our-free-model` 内置 channel-pack 的 `credits.balances` RPC，口径与插件设置页「白嫖模型接入」完全一致：

- 显示 `剩余 10K 积分`、`$0.00`、`剩余 1.2M token` 等，单位按各厂商口径。
- 查询失败显示短码（`×timeout` / `×HTTP401` / `×no-conn` / `×no-acct` / `×payload`），悬停看完整原因。
- 90 秒超时、最多 3 个厂商并发、单厂商失败不影响其它来源。
- `connection` 服务是**可选注入**：Cordis 里直接读 `ctx.connection` 会抛 `cannot get property ... without inject`，必须用 `try/catch` 包住再 fallback 到 `ctx.get('connection')`。

---

## 安装

### 方式一：图形界面安装（推荐）

设置 → 插件 → 右上箭头 → **安装第三方插件**，在「包名或地址」框里填 Git 仓库地址：

```
https://github.com/jinzhouchu/dsh-session-tools.git
```

点**安装**，等 pnpm 拉完仓库并应用 bundle patch，然后**重启 Harness**。

插件自带 `cordis.patch.yml` 并在 `package.json` 的 `dsh.bundle.patch` 里声明，满足安装器的"组合包 patch"要求，能被正常识别和安装。若拉 GitHub 卡住，安装对话框提供「改用国内镜像」，但镜像只替代 npm 包下载、不替代 GitHub 仓库本身。

> 如果之前已经用下面的 link 方式装过同一个包，**先卸载再装**，否则同一个包名 `@local/session-tools` 会冲突。换机器或全新环境可直接用本方式。

### 方式二：本地 link（开发用）

改源码后即时生效，适合二次开发（本插件不发布到 npm，`package.json` 标了 `private: true`）：

1. 在 profile 的 `package.json` 里加一条依赖：

   ```json
   "dependencies": {
     "@local/session-tools": "link:F:/path/to/session-tools-plugin"
   },
   "dsh": {
     "profile": {
       "bundles": ["@local/session-tools"]
     }
   }
   ```

2. 插件目录里的 `cordis.patch.yml` 会向 profile 插入一条配置：

   ```yaml
   - insert:
       - id: session-tools
         name: '@local/session-tools'
         config: {}
   ```

3. **重启 Harness** 加载 Host 与 Client 两半。存储目录的改动同样要重启才生效。

---

## 诊断

出问题时不用猜，直接看日志：

- `~/.dsh/session-tools-error.log` —— 存储目录设置/迁移的失败堆栈。
- `~/.dsh/session-tools-quota.log` —— 每个厂商每次额度查询的成功/失败结果与错误码。

---

## 目录结构

```
.
├── index.js            Host 半：存储管理、对话操作、HTTP 路由、工具注册
├── client.js           Client 半：设置页 UI、模型下拉筛选/折叠/额度
├── cordis.patch.yml    bundle patch，向 profile 插入插件配置
├── package.json        插件元数据与导出
├── icon.svg            插件图标
├── locale/
│   ├── zh.json         中文文案
│   └── en.json         英文文案
└── tests/              Node 回归测试，零第三方依赖
    ├── model-filter.test.mjs   模型筛选/折叠/额度集成测试（80 例）
    ├── client.test.mjs         Client 错误映射与字典校验（17 例）
    └── storage.test.mjs        Host 存储写入与迁移（29 例）
```

## 测试

```bash
node tests/model-filter.test.mjs
node tests/client.test.mjs
node tests/storage.test.mjs
```

纯 Node 环境即可运行，不需要 Harness 或npm install。合计 125 个用例。

---

## 已知限制

- **必须重启**：存储目录改动和插件代码更新都需要重启 Harness，热重载在本机会触发 recompose 失败。
- **DOM 注入**：宿主没有给输入区模型下拉提供 slot，筛选条靠 `MutationObserver` 挂到搜索行后面。Harness 升级若改变下拉结构，锚点可能需要微调（最坏情况是按钮不出现，不影响原有功能）。
- **元数据覆盖有限**：下拉里大部分模型来自 channel-pack 的运行时目录，本地 `/api/our-free-model/summary` 只收录约 25 条元数据；没有权威状态的服务商模型会被归入「未知」。要全覆盖需要从 Host 端读取运行时 LLM adapter 注册表。
- **标题纯黑**：来源标题按需求硬编码为黑色加粗，深色主题下需改成跟随主题变量。

---

## 许可

MIT — 见 [LICENSE](./LICENSE)。

这是非官方插件，与 DeepSeek 官方无关。修改存储目录或删除会话前请先备份重要数据。

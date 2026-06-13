# 你好，新蒸程 - 问答与问题诊断页面

本项目是《你好，新蒸程》整合包的网站源码，用于展示公告、更新日志、QA 知识库、AI 问题助手和最新版整合包下载入口。

当前版本已经接入在线后台：下载链接、更新日志、QA 知识库、QA 分类都可以在 `admin.html` 里管理，数据保存到 Cloudflare KV。首页刷新后会从后台接口读取最新数据；如果接口失败，会继续使用 `data/` 里的静态数据作为备用。

---

## 当前功能

- 首页公告与下载入口
- 最新版整合包下载弹窗
- 更新日志展示与历史日志弹窗
- QA 知识库搜索、分类筛选、长答案折叠
- AI 问题助手
- 支持上传日志、截图、图片给 AI 分析
- 在线后台管理
  - 下载版本、夸克链接、百度链接、下载提示
  - 更新日志新增、编辑、删除、移动到指定位置
  - QA 新增、编辑、删除、搜索、分页、移动到指定位置
  - QA 分类新增、重命名、删除、排序
  - AI 自动生成 QA 关键词，并参考已有关键词风格
- Cloudflare Workers + KV 在线数据存储

专家系统入口已经从首页删除，`js/expert-module.js` 目前只是保留的旧文件，不再被首页加载。

---

## 项目结构

```text
assets/
  css/
    style.css
    base.css
    layout.css
    buttons.css
    modal.css
    qa.css
    expert.css
    changelog.css
    chat.css
    download.css
    responsive.css
    admin.css

data/
  changelog.js
  qa-data.js

js/
  config.js
  site-data.js
  utils.js
  main.js
  changelog-module.js
  qa-module.js
  chat-module.js
  download-module.js
  admin-module.js
  expert-module.js

workers/
  admin-worker.js
  ai-worker.js
  新建文本文档.txt

index.html
admin.html
README.md
```

---

## 重要页面

### `index.html`

网站主页。

负责展示：

- 公告
- 更新日志
- QA 搜索
- AI 问题助手按钮
- 下载入口

首页加载顺序里有 `js/site-data.js`，它会优先从 Admin Worker 拉取 Cloudflare KV 里的最新数据。

如果后台接口失败，首页会继续使用：

- `data/changelog.js`
- `data/qa-data.js`

作为静态备用数据。

### `admin.html`

后台管理页面。

后台登录 token 不再保存到浏览器长期存储中。刷新页面、关闭页面或重新进入后台，都需要重新输入后台密码。

后台保存的数据会进入 Cloudflare KV。保存后首页普通刷新即可读取最新数据。

---

## 关键配置文件

### `js/config.js`

统一配置接口地址。

当前格式：

```js
window.SITE_CONFIG = {
    AI_API_BASE_URL: "https://api.xn--efv066biyh.online",
    ADMIN_API_BASE_URL: "https://site-admin-api.sansanjx.workers.dev"
};
```

说明：

- `AI_API_BASE_URL`：AI Worker 地址，不要带 `/chat`
- `ADMIN_API_BASE_URL`：Admin Worker 地址，不要带末尾 `/`

---

## 前台数据加载

### `js/site-data.js`

负责从 Admin Worker 读取在线数据：

```text
GET /api/public/site-data
```

读取成功后会覆盖：

- `window.DOWNLOAD_CONFIG`
- `window.CHANGELOG_DATA`
- `window.QA_DATA`
- `window.QA_CATEGORIES`

为了避免缓存，读取时会自动带时间戳参数。

### `js/main.js`

页面启动文件。

启动顺序：

1. 先执行 `SiteData.load()` 读取在线数据
2. 初始化更新日志模块
3. 初始化 QA 模块
4. 初始化 AI 问题助手

---

## 后台功能文件

### `js/admin-module.js`

后台核心逻辑。

负责：

- 后台登录、退出
- 拉取后台数据
- 保存全部
- 下载链接表单
- 更新日志列表、编辑、删除、移动
- QA 搜索、分页、编辑、删除、移动
- QA 分类管理
- AI 生成关键词
- 自定义弹窗 UI

后台“保存全部”会把当前数据写到 Admin Worker：

```text
PUT /api/admin/site-data
```

如果编辑弹窗还开着，点击“保存全部”会先同步当前弹窗内容，再保存。

### `assets/css/admin.css`

后台页面样式。

后台 UI 目前保持和网站原本风格一致：

- 白色卡片
- 绿色按钮
- 浅绿色提示块
- 圆角输入框
- 自定义分类下拉框
- 自定义删除/移动弹窗

---

## Cloudflare Workers

本项目使用两个 Worker：

### 1. Admin Worker

文件：

```text
workers/admin-worker.js
```

用途：

- 后台登录
- 后台 session 校验
- 保存和读取站点数据
- 公开首页数据接口
- 转发 AI 关键词生成请求

主要接口：

```text
GET  /
GET  /api/public/site-data
POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/session
GET  /api/admin/site-data
PUT  /api/admin/site-data
POST /api/admin/qa-keywords
```

Admin Worker 需要绑定 KV：

```text
SITE_KV
```

Admin Worker 需要配置变量/密钥：

```text
ADMIN_PASSWORD      后台登录密码，建议用密钥
SESSION_SECRET      session 加密用随机字符串，建议用密钥
AI_API_BASE_URL     AI Worker 地址，不要带 /chat
AI_ADMIN_SECRET     Admin Worker 和 AI Worker 共用的内部密钥
```

### 2. AI Worker

推荐使用文件：

```text
workers/ai-worker.js
```

旧文件：

```text
workers/新建文本文档.txt
```

只是保留备份，推荐以后使用 `ai-worker.js`。

AI Worker 用途：

- `/chat`：网站 AI 问题助手
- `/qa-keywords`：后台 AI 生成 QA 关键词

AI Worker 需要配置变量/密钥：

```text
OPENAI_API_KEY      AI 接口密钥
OPENAI_BASE_URL     OpenAI-compatible API 地址
OPENAI_MODEL        模型 ID
AI_ADMIN_SECRET     必须和 Admin Worker 里的 AI_ADMIN_SECRET 一致
```

---

## Cloudflare KV 数据

Admin Worker 使用 KV 保存数据。

主要 key：

```text
SITE_DATA
SITE_DATA_VERSION
ADMIN_SESSION:<hash>
```

`SITE_DATA` 里保存的数据大致结构：

```js
{
    version: 2,
    dataVersion: "时间戳版本号",
    updatedAt: "更新时间",
    download: {
        versionText: "V1.5.0",
        quarkUrl: "https://...",
        baiduUrl: "https://...",
        notice: "下载提示"
    },
    qaCategories: [
        { id: "cat_xxx", name: "基础与获取" }
    ],
    changelog: [
        {
            id: "log_xxx",
            date: "2026-06-14",
            title: "更新标题",
            content: ["更新内容 1", "更新内容 2"]
        }
    ],
    qa: [
        {
            id: "qa_xxx",
            category: "基础与获取",
            question: "问题",
            answer: "答案",
            keywords: ["关键词1", "关键词2"]
        }
    ]
}
```

---

## 本地测试

不要直接用 `file:///` 打开测试，建议在项目根目录启动本地服务器。

例如：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
http://localhost:8000/admin.html
```

---

## 部署时需要上传/复制的内容

### 网站文件

需要部署到 GitHub Pages：

```text
index.html
admin.html
assets/
data/
js/
README.md
```

### Worker 文件

复制到 Cloudflare Workers：

```text
workers/admin-worker.js  -> Admin Worker
workers/ai-worker.js     -> AI Worker
```

---

## 常用修改位置

现在推荐优先使用后台修改内容。

### 推荐用后台修改

```text
admin.html
```

可管理：

- 下载版本和下载链接
- 更新日志
- QA 内容
- QA 分类
- QA 关键词

### 代码层修改位置

修改接口地址：

```text
js/config.js
```

修改首页结构和固定文案：

```text
index.html
```

修改首页在线数据加载逻辑：

```text
js/site-data.js
```

修改 QA 搜索和分类显示逻辑：

```text
js/qa-module.js
```

修改更新日志显示逻辑：

```text
js/changelog-module.js
```

修改 AI 聊天前端逻辑：

```text
js/chat-module.js
```

修改下载弹窗逻辑：

```text
js/download-module.js
```

修改后台逻辑：

```text
js/admin-module.js
```

修改后台样式：

```text
assets/css/admin.css
```

修改 Admin Worker：

```text
workers/admin-worker.js
```

修改 AI Worker：

```text
workers/ai-worker.js
```

---

## 缓存说明

首页读取后台数据时会自动带时间戳，Admin Worker 公开数据接口也设置了不缓存响应头。

后台保存时会写入 `dataVersion`，用于降低刚保存后首页读到旧 KV 数据的概率。

如果修改的是 JS/CSS 文件本身，仍然建议更新 HTML 里的 `?v=日期序号`，例如：

```html
<script src="js/site-data.js?v=2026061404" defer></script>
```

如果只是通过后台修改 QA、日志、下载链接，一般不需要改 HTML 版本号。

---

## 注意事项

- 不要把 `OPENAI_API_KEY`、`ADMIN_PASSWORD`、`SESSION_SECRET`、`AI_ADMIN_SECRET` 写进前端源码。
- `ADMIN_PASSWORD`、`SESSION_SECRET`、`AI_ADMIN_SECRET` 建议都用 Cloudflare 的“密钥”类型。
- Admin Worker 和 AI Worker 的 `AI_ADMIN_SECRET` 必须一致。
- `AI_API_BASE_URL` 填 AI Worker 根地址，不要带 `/chat`。
- `ADMIN_API_BASE_URL` 填 Admin Worker 根地址，不要带末尾 `/`。
- 后台登录状态不会长期保存在浏览器里，刷新后台需要重新输入密码。

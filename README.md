# 你好，新蒸程 - 问答与问题诊断页面

本项目用于展示《你好，新蒸程》整合包的公告、更新日志、常见问答、问题诊断专家系统、AI 问题助手和最新版整合包下载入口。

---

## 项目结构

- assets/
  - css/
    - style.css
    - base.css
    - layout.css
    - buttons.css
    - modal.css
    - qa.css
    - expert.css
    - changelog.css
    - chat.css
    - download.css
    - responsive.css
- data/
  - changelog.js
  - qa-data.js
- js/
  - utils.js
  - main.js
  - changelog-module.js
  - qa-module.js
  - expert-module.js
  - chat-module.js
  - download-module.js
- index.html

---

## 文件说明

**assets/css/style.css**

主样式入口文件。  
通过 @import 引入其他 CSS 文件。  
一般不直接写具体样式，只负责统一管理 CSS 文件加载顺序。

**assets/css/base.css**

基础样式文件。  
负责全站基础设置，比如颜色变量、默认字体、页面背景、全局换行、链接、图片自适应、弹窗打开时禁止页面滚动等。

**assets/css/layout.css**

页面布局样式文件。  
负责网站头部、作者卡片、主体容器、公告卡片、更新日志卡片、通用卡片布局等页面大结构。

**assets/css/buttons.css**

通用按钮样式文件。  
负责 primary-btn 和 secondary-btn 等按钮样式。

**assets/css/modal.css**

通用弹窗样式文件。  
负责专家系统、更新日志、AI 助手、下载弹窗等共用的遮罩层、弹窗主体、弹窗头部和关闭按钮样式。

**assets/css/qa.css**

问答搜索模块样式文件。  
负责搜索框、分类按钮、问答数量统计、问题卡片、答案内容、链接显示、长答案折叠和展开按钮样式。

**assets/css/expert.css**

专家系统样式文件。  
负责问题诊断专家系统入口、按钮区域、弹窗布局、问题类型按钮、诊断结果面板和处理建议样式。

**assets/css/changelog.css**

更新日志样式文件。  
负责更新日志列表、查看详情按钮、查看全部日志按钮、更新详情弹窗和历史日志弹窗样式。

**assets/css/chat.css**

AI 问题助手样式文件。  
负责 AI 聊天弹窗、提示区域、消息气泡、快捷问题按钮、附件预览、上传按钮、输入框和发送按钮样式。

**assets/css/download.css**

最新版整合包下载模块样式文件。  
负责下载按钮、下载弹窗、下载提示框、客户端和服务端下载按钮等样式。  
当前页面部分下载弹窗样式复用了通用弹窗样式。

**assets/css/responsive.css**

移动端适配样式文件。  
负责手机和平板上的页面布局、卡片、搜索框、弹窗、AI 助手、下载弹窗等自适应显示。

---

**data/changelog.js**

更新日志数据文件。  
负责保存网页右上角“更新日志”模块显示的版本更新内容。  
如果要新增或修改版本更新记录，一般改这个文件。

**data/qa-data.js**

问答数据文件。  
负责保存“问答搜索”模块里的常见问题、答案、分类和关键词。  
如果要新增、删除、修改问答内容，一般改这个文件。

---

**js/utils.js**

公共工具文件。  
存放多个模块都会用到的小工具方法，比如 HTML 转义、文本格式化、答案换行处理、防抖函数等。

**js/main.js**

网站主启动文件。  
负责在页面加载完成后初始化更新日志、问答搜索、专家系统和 AI 问题助手等模块。  
同时负责按 ESC 键关闭弹窗。

**js/changelog-module.js**

更新日志功能模块。  
负责读取 data/changelog.js 里的更新日志数据，并渲染到网页上。  
支持查看更新详情和查看全部历史日志。

**js/qa-module.js**

问答搜索功能模块。  
负责读取 data/qa-data.js 里的问答数据，并生成分类按钮、问答列表和搜索结果。  
支持关键词搜索、分类筛选、智能匹配、长答案折叠和展开。

**js/expert-module.js**

问题诊断专家系统模块。  
负责生成“进入专家系统”按钮和专家系统弹窗。  
用户选择问题类型后，会显示常见表现和处理建议。  
如果要修改专家系统里的问题分类和建议内容，一般改这个文件。

**js/chat-module.js**

AI 问题助手模块。  
负责生成“AI问题助手”按钮和聊天弹窗。  
支持输入问题、快捷问题、上传日志、上传图片、粘贴截图，并调用 AI 接口返回建议。  
如果要更换 AI 接口地址，改这个文件里的 AI_API_URL。

**js/download-module.js**

最新版整合包下载模块。  
负责“点击下载最新版整合包”按钮、下载弹窗、客户端和服务端下载按钮逻辑。  
如果以后更新整合包版本或下载链接，主要改这个文件里的 DOWNLOAD_CONFIG。

---

**index.html**

网站主页文件。  
负责网页整体结构、页面内容和各模块挂载位置。  
里面引入 CSS、数据文件和 JS 功能文件。  
如果要修改网页标题、公告文字、作者信息、下载弹窗里的固定说明，一般改这个文件。

---

## 常用修改位置

修改网页标题、公告、作者信息：  
index.html

修改常见问题和答案：  
data/qa-data.js

修改更新日志内容：  
data/changelog.js

修改下载版本和下载链接：  
js/download-module.js

修改专家系统问题类型和建议：  
js/expert-module.js

修改 AI 接口地址：  
js/chat-module.js

修改问答搜索逻辑：  
js/qa-module.js

修改更新日志显示逻辑：  
js/changelog-module.js

修改页面整体布局：  
assets/css/layout.css

修改全站颜色和基础样式：  
assets/css/base.css

修改按钮样式：  
assets/css/buttons.css

修改弹窗样式：  
assets/css/modal.css

修改问答区域样式：  
assets/css/qa.css

修改专家系统样式：  
assets/css/expert.css

修改更新日志样式：  
assets/css/changelog.css

修改 AI 助手样式：  
assets/css/chat.css

修改下载模块样式：  
assets/css/download.css

修改手机端适配：  
assets/css/responsive.css

---

## 使用方法

直接打开 index.html 即可查看网页。

如果样式没有显示，请检查：

1. assets/css/style.css 是否存在。
2. style.css 里的 @import 路径是否正确。
3. CSS 文件是否都在 assets/css/ 文件夹里。

如果功能没有显示，请检查：

1. data/changelog.js 是否存在。
2. data/qa-data.js 是否存在。
3. js 文件是否都在 js/ 文件夹里。
4. index.html 里的 script 引入路径是否正确。
5. 浏览器控制台是否有报错。
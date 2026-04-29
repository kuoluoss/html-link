项目文件夹/
├─ index.html
├─ assets/
│  ├─ css/
│    └─ style.css
├─ data/
│  ├─ qa-data.js
│  └─ changelog.js
└─ js/
   ├─ utils.js
   ├─ main.js
   ├─ qa-module.js
   ├─ changelog-module.js
   ├─ expert-module.js
   └─ chat-module.js
   
index.html
网站主页面。
网页的基本结构都在这里。

assets/css/style.css
网站样式。
比如颜色、按钮、卡片、弹窗、手机适配。

data/qa-data.js
问答数据。
你要新增、修改问答内容，一般改这里。

data/changelog.js
更新日志数据。
网站更新记录写这里。

js/utils.js
公共工具。
给其他 JS 文件用的小功能。

js/main.js
总启动文件。
负责启动整个网站的各个功能。

js/qa-module.js
问答搜索功能。
负责搜索、分类、显示问答。

js/changelog-module.js
更新日志功能。
负责显示更新记录。

js/expert-module.js
专家建议功能。
负责显示重点提示、推荐处理方案之类的内容。

js/chat-module.js
问题诊断助手。
负责弹窗助手，根据用户描述给处理建议。

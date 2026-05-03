window.ExpertModule = (() => {
    let root = null;
    let modal = null;

    const problemTypes = [
        {
            id: "basic",
            name: "基础与获取 / 下载 / 安装",
            keywords: [
                "下载",
                "整合包",
                "QQ群",
                "群文件",
                "夸克",
                "网盘",
                "文件空",
                "链接失效",
                "图片",
                "png",
                "zip",
                "后缀",
                "PCL2",
                "HMCL",
                "安装",
                "全量客户端",
                "正式版",
                "服务端",
                "存档"
            ],
            questions: [
                "整合包在哪里下载，网盘文件空了怎么办",
                "为什么下载的是图片 / .png 文件",
                "怎么安装整合包，PCL2 安装失败怎么办",
                "全量客户端、正式版和服务端有什么区别",
                "HMCL 能不能用",
                "存档应该放在哪里"
            ],
            advice: [
                "整合包优先从 QQ 群文件下载，夸克网盘只是备用方式，可能会出现文件为空、被吞或链接失效。",
                "如果下载的文件看起来像图片或 .png，请开启文件扩展名，把最后的 .png 改成 .zip。",
                "普通正式版整合包一般是 .zip，不要解压，直接拖进 PCL2 安装。",
                "全量客户端是解压即玩版本，解压后打开里面的启动器即可，不需要再拖进 PCL2。",
                "服务端是开服用版本，通常会去掉 VOXY、光影等客户端 MOD。",
                "HMCL 能用但不推荐，萌新建议优先使用 PCL2。",
                "存档需要放进对应版本的 saves 文件夹里，并注意不要出现多层文件夹嵌套。"
            ]
        },
        {
            id: "performance",
            name: "运行与优化 / 内存 / 卡顿",
            keywords: [
                "内存",
                "RAM",
                "4GB",
                "8GB",
                "12GB",
                "16GB",
                "Java",
                "卡顿",
                "FPS",
                "帧数",
                "低帧率",
                "闪退",
                "崩溃",
                "VOXY",
                "光影",
                "视距",
                "模拟距离",
                "预加载地图",
                "跑图",
                "配置低"
            ],
            questions: [
                "玩这个整合包需要多少内存",
                "为什么游戏很卡 / FPS 很低",
                "为什么分配更多内存反而更容易崩",
                "首次进图很慢怎么办",
                "开 VOXY 或光影后卡顿怎么办"
            ],
            advice: [
                "新版 1.1.0 整合包已经优化过，但仍建议最低分配 8GB 内存。",
                "16GB 总内存的电脑，建议分配 8GB。",
                "24GB 总内存的电脑，建议分配 8GB 到 12GB。",
                "32GB 总内存的电脑，建议分配 12GB 到 16GB。",
                "不要把所有内存都分给 Java，系统和后台程序也需要运行空间，分太满反而容易卡死或闪退。",
                "如果游戏很卡，可以尝试使用群文件里的预加载存档、关闭光影、关闭 VOXY、降低视距和模拟距离。",
                "首次进图可能正在生成地形或加载资源，可以等待一会儿再判断是否真的卡死。"
            ]
        },
        {
            id: "voxy",
            name: "VOXY / 超远视距 / 跑图",
            keywords: [
                "VOXY",
                "Voxy",
                "远景",
                "超远视距",
                "视距",
                "Chunky",
                "跑图",
                "预加载",
                "chunky center",
                "chunky radius",
                "chunky shape",
                "chunky start",
                "chunky confirm",
                "voxy import",
                ".voxy",
                "联机远景"
            ],
            questions: [
                "VOXY 是什么，必须开吗",
                "如何使用 VOXY 加载超远视距地形",
                "VOXY 导入、跑图时崩溃 / 卡死 / 闪退怎么办",
                "联机时其他人怎么也看到 VOXY 远景"
            ],
            advice: [
                "VOXY 是客户端远景模组，可以显示很远距离的地形，但不是必须开的。",
                "如果配置一般，或者开 VOXY 后卡顿、闪退，可以关闭 VOXY。",
                "最简单的方法是直接使用 QQ 群文件里已经跑好的地图存档。",
                "如果要自己跑图，可以先用 Chunky 预生成地形，再使用 /voxy import 导入。",
                "VOXY 导入崩溃时，优先检查内存是否至少 8GB、Java 是否为 Java 21，并先关闭光影再试。",
                "第一次自己跑图不建议半径太大，可以先从小范围测试。",
                "联机时 VOXY 是客户端模组，服务端不会自动同步远景数据。谁想看远景，谁本地就要有 VOXY 数据。"
            ]
        },
        {
            id: "shader",
            name: "光影 / 显示 / UI 兼容",
            keywords: [
                "光影",
                "光影设置",
                "空白",
                "盲点",
                "菜单",
                "菜单空白",
                "YSM",
                "Iris",
                "菜单背景模糊",
                "UI冲突",
                "渲染冲突",
                "蓝图",
                "强力胶",
                "动力臂",
                "预览",
                "框选",
                "不显示"
            ],
            questions: [
                "我该用什么光影，为什么有些光影会出错",
                "光影设置界面空白 / 可以盲点怎么办",
                "光影下看不到强力胶范围、蓝图预览或者动力臂框选怎么办",
                "开光影后 UI 或菜单显示异常怎么办"
            ],
            advice: [
                "建议优先使用整合包自带光影，或群文件提供的兼容光影。",
                "部分光影可能和 VOXY、YSM、Iris 等模组冲突，导致菜单空白、按钮看不见、游戏崩溃或 UI 异常。",
                "光影设置界面空白，通常是 YSM 和 Iris 的 UI 渲染冲突。",
                "可以尝试删除 YSM 或等待修复。",
                "也可以关闭 Iris 的菜单背景模糊：游戏 → 选项 → 辅助功能 → 菜单背景模糊：关。",
                "强力胶范围、蓝图预览、动力臂框选等内容，在部分光影下可能不显示。",
                "遇到这类显示问题时，可以先关闭光影，完成操作后再打开光影。"
            ]
        },
        {
            id: "gameplay",
            name: "游戏内容 / 机械动力 / 载具",
            keywords: [
                "机械动力",
                "萌新",
                "新手",
                "教程",
                "扳手",
                "护目镜",
                "JEI",
                "W键",
                "思索",
                "Ponder",
                "应力",
                "传动",
                "车",
                "开局车",
                "撬棍",
                "回收",
                "机动车加工台",
                "飞机",
                "飞艇",
                "航空学",
                "燃料",
                "烈焰蛋糕",
                "煤炭",
                "无线红石",
                "遥控器",
                "无线打字机",
                "自然指南针",
                "自然罗盘",
                "下界要塞",
                "末地城"
            ],
            questions: [
                "完全没玩过机械动力，可以直接玩这个包吗",
                "游戏里的 W 键思索是什么",
                "开局送的车怎么收起来，掉坑里或找不到怎么办",
                "任务奖励的飞机 / 飞艇怎么飞",
                "物理结构上的无线红石遥控器用不了怎么办",
                "如何快速找到下界要塞或末地城"
            ],
            advice: [
                "完全没玩过机械动力也可以玩，但建议先学一点机械动力基础。",
                "建议至少学会使用扳手、护目镜、JEI、W 键思索和方块说明书。",
                "W 键思索是机械动力模组的教程功能，可以查看物品用途、工作逻辑和动画演示。",
                "开局送的车可以用同模组的撬棍回收，回收后可以用机动车加工台重新组装。",
                "飞机或飞艇需要给引擎放燃料，例如烈焰蛋糕、煤炭等。",
                "飞船、汽车等结构物理化后，无线红石遥控器可能无法正常使用，可以尝试改用无线打字机。",
                "找下界要塞、末地城等结构，可以使用自然指南针 / 自然罗盘，或者在 JEI 搜索指南针。"
            ]
        },
        {
            id: "bugs",
            name: "Bug 与问题 / 崩溃 / 已知问题",
            keywords: [
                "Bug",
                "崩溃",
                "闪退",
                "报错",
                "错误报告",
                "日志",
                "missing tacz",
                "TACZ",
                "枪械",
                "扳手",
                "连锁采集",
                "物品消失",
                "传送石碑",
                "物理化",
                "Waystones",
                "动物",
                "不刷新动物",
                "doMobSpawning",
                "抱起",
                "生物",
                "车",
                "人",
                "掉线",
                "崩服",
                "老存档",
                "存档不兼容",
                "经验颗粒",
                "W键",
                "思索"
            ],
            questions: [
                "游戏启动时报错 missing tacz 怎么办",
                "用扳手加连锁采集，回收机械动力物品会消失怎么办",
                "为什么把传送石碑物理化后会崩溃",
                "为什么群文件地图存档不刷新动物",
                "为什么抱起生物、车或者人会闪退 / 掉线 / 崩服",
                "新版本整合包能不能使用老地图存档",
                "为什么经验颗粒一按 W 思索就崩溃",
                "发现 Bug 后应该怎么反馈"
            ],
            advice: [
                "missing tacz 一般不用管，TACZ 枪械模组因为兼容问题暂时被移除，不影响正常游戏。",
                "TACZ 暂时不确定什么时候加回来，不建议自己手动添加，可能会崩溃。",
                "扳手加连锁采集导致机械动力物品消失是旧版本 BUG，新版 1.1.0 已经修复。",
                "传送石碑物理化后可能崩溃，普通玩家建议不要把传送石碑物理化。",
                "群文件地图不刷新动物时，可以输入：/gamerule doMobSpawning true。",
                "抱起生物、车或人导致闪退 / 掉线 / 崩服是旧版本 BUG，新版 1.1.0 整合包 / 服务端已经修复，请确认客户端和服务端版本一致。",
                "新版本不建议直接转移老地图存档，如果一定要试，请先备份旧存档。",
                "经验颗粒按 W 思索崩溃是已知 BUG，目前不建议对经验颗粒使用 W 键思索。",
                "反馈 Bug 时最好提供整合包版本号、是否开光影、是否开 VOXY、单机还是联机、截图、crash-report、latest.log 或服务端日志。"
            ]
        },
        {
            id: "server",
            name: "服务端 / 联机 / 开服",
            keywords: [
                "服务端",
                "开服",
                "服务器",
                "联机",
                "下载",
                "群文件",
                "最新版",
                "flyhigher",
                "CPU",
                "内存",
                "12GB",
                "4核",
                "4.5GHz",
                "TPS",
                "启动报错",
                "卡住",
                "连接失败",
                "进不去服务器",
                "防火墙",
                "端口映射",
                "内网穿透",
                "Java",
                "版本一致",
                "客户端",
                "服务端版本不一致",
                "官方服务器",
                "官方群服",
                "面板服",
                "VPS",
                "NeoForge",
                "未知键",
                "注册表",
                "hello_new_generation_core"
            ],
            questions: [
                "服务端在哪里下载，服务端什么时候出",
                "开服务端需要什么配置",
                "服务端启动报错 / 卡住 / 连接失败怎么办",
                "客户端和服务端版本不一致能进服吗",
                "这个包能联机吗，有官方服务器吗",
                "面板服可以开这个包吗",
                "开服后连接服务器报错含有未知键的注册表怎么办"
            ],
            advice: [
                "服务端已经发布在 QQ 群文件里，请下载最新版服务端，不要用旧版本。",
                "客户端和服务端版本必须一致，否则容易进服失败、连接中断、报错或崩溃。",
                "开服务端建议 CPU 4 核及以上，主频建议 4.5GHz 以上，服务端内存至少 12GB。",
                "服务端启动报错或连接失败时，检查客户端和服务端版本、Java 版本、启动脚本、防火墙、端口映射和内网穿透。",
                "目前没有官方服务器，也没有官方群服，可以自行开服，或加入群友开的服务器。",
                "不推荐面板服。很多面板服存在配置虚标、超开、CPU 性能不足、客服不懂 NeoForge 等问题。",
                "如果连接服务器报错含有未知键的注册表，可能是网盘文件缺失，可以前往 QQ 群重新下载最新版服务端，或用客户端里的 hello_new_generation_core 文件夹替换服务端同名文件夹。"
            ]
        },
        {
            id: "mods",
            name: "模组 / 自定义 / 投稿",
            keywords: [
                "加模组",
                "MOD",
                "兼容性",
                "后果自负",
                "AE2",
                "存储模组",
                "配方冲突",
                "服务端无法启动",
                "客户端进不去服务器",
                "航空学",
                "载具",
                "投稿",
                "Turin",
                "Turambar",
                "nbt",
                "蓝图",
                "可兑换载具"
            ],
            questions: [
                "整合包里有 AE2 / 存储模组吗，可以自己加 MOD 吗",
                "整合包里能自己加别的模组吗",
                "加模组后崩溃怎么办",
                "航空学载具可以投稿吗，怎么投稿"
            ],
            advice: [
                "整合包内没有 AE2。",
                "可以自己加 MOD，但后果自负。",
                "自己加 MOD 可能导致崩溃、存档损坏、配方冲突、服务端无法启动、客户端进不去服务器。",
                "因为自行加 MOD 导致的问题，制作组不提供支持，萌新不建议乱加。",
                "航空学载具可以投稿，联系管理 @Turin·Turambar。",
                "投稿一般需要 .nbt 格式蓝图文件，建议载具外形美观、功能正常、结构完整、生存可用。"
            ]
        },
        {
            id: "mobile",
            name: "手机端 / Pojav",
            keywords: [
                "手机",
                "Pojav",
                "安卓",
                "移动端",
                "手机能玩吗",
                "启动",
                "闪退",
                "兼容性",
                "电脑端"
            ],
            questions: [
                "手机能不能玩",
                "Pojav 能不能启动",
                "手机端崩溃怎么办",
                "手机性能不足怎么办"
            ],
            advice: [
                "群里有成功启动案例。",
                "但手机端不保证兼容，也不负责教学和解答。",
                "具体操作只能自己研究。",
                "优先建议使用电脑端游玩。",
                "如果使用手机端，建议自行降低视距、画质和其他性能消耗设置。"
            ]
        },
        {
            id: "feedback",
            name: "反馈 / 日志 / 报错提交",
            keywords: [
                "反馈",
                "Bug",
                "报错",
                "崩溃",
                "错误报告",
                "日志",
                "AI",
                "群公告",
                "Bug收集表",
                "开发组",
                "版本号",
                "截图",
                "crash-report",
                "latest.log",
                "服务端日志",
                "复现"
            ],
            questions: [
                "发现 Bug 后应该怎么反馈",
                "游戏崩溃要发什么",
                "报错文件怎么看",
                "应该怎么描述问题",
                "要不要发日志"
            ],
            advice: [
                "先看 FAQ 和群公告，确认是不是已知问题。",
                "如果是崩溃或报错，可以先把错误报告丢给 AI 看一下。",
                "反馈时最好提供整合包版本号。",
                "说明是否开光影、是否开 VOXY、单机还是联机。",
                "最好附上截图、crash-report、latest.log 或服务端日志。",
                "请描述怎么复现，不要只发一句“我崩了”，这样别人没法判断。",
                "可以查看公告内的网页、群公告里的 Bug 收集表，或者在群里艾特开发组。"
            ]
        }
    ];

    function init(options = {}) {
        root = document.querySelector(options.selector || "#expertSystemBox");

        if (!root) {
            console.error("ExpertModule 找不到容器");
            return;
        }

        renderButtonArea();
        createModal();
    }

    function renderButtonArea() {
        root.innerHTML = `
            <div class="expert-entry">
                <div>
                    <h2>问题诊断专家系统</h2>
                    <p>遇到问题时，可以进入专家系统，根据问题类型快速获得排查建议。</p>
                </div>

                <div class="expert-actions" id="expertActionBox">
                    <button class="primary-btn" id="openExpertBtn" type="button">进入专家系统</button>
                </div>
            </div>
        `;

        const btn = document.querySelector("#openExpertBtn");

        if (btn) {
            btn.addEventListener("click", openModal);
        }
    }

    function createModal() {
        if (modal) {
            return;
        }

        const existingExpertModal = document.querySelector("#expertModalMask");

        if (existingExpertModal) {
            modal = existingExpertModal;
            renderTypes();
            return;
        }

        modal = document.createElement("div");
        modal.id = "expertModalMask";
        modal.className = "expert-modal-mask";
        modal.setAttribute("aria-hidden", "true");

        modal.innerHTML = `
            <div class="expert-modal" role="dialog" aria-modal="true" aria-labelledby="expertModalTitle">
                <div class="expert-modal-header">
                    <div>
                        <h2 id="expertModalTitle">问题诊断专家系统</h2>
                        <p>请选择你遇到的问题类型，系统会给出可能原因和处理建议。</p>
                    </div>
                    <button class="modal-close-btn" id="closeExpertBtn" type="button" aria-label="关闭专家系统">×</button>
                </div>

                <div class="expert-modal-body">
                    <div class="expert-type-list" id="expertTypeList"></div>
                    <div class="expert-result-panel" id="expertResultPanel">
                        <div class="empty-tip">请先选择左侧的问题类型。</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector("#closeExpertBtn");

        if (closeBtn) {
            closeBtn.addEventListener("click", closeModal);
        }

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        renderTypes();
    }

    function renderTypes() {
        if (!modal) {
            return;
        }

        const list = modal.querySelector("#expertTypeList");

        if (!list) {
            return;
        }

        list.innerHTML = problemTypes.map(item => `
            <button class="expert-type-btn" data-id="${item.id}" type="button">
                ${escapeHtml(item.name)}
            </button>
        `).join("");

        list.querySelectorAll(".expert-type-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                list.querySelectorAll(".expert-type-btn").forEach(item => {
                    item.classList.remove("active");
                });

                btn.classList.add("active");

                const item = problemTypes.find(type => type.id === btn.dataset.id);
                renderResult(item);
            });
        });
    }

    function renderResult(item) {
        if (!modal) {
            return;
        }

        const panel = modal.querySelector("#expertResultPanel");

        if (!panel) {
            return;
        }

        if (!item) {
            panel.innerHTML = `<div class="empty-tip">未找到对应的问题类型。</div>`;
            return;
        }

        const relatedQA = getRelatedQA(item);

        panel.innerHTML = `
            <h3>${escapeHtml(item.name)}</h3>

            <div class="expert-section">
                <h4>常见表现</h4>
                <ul>
                    ${item.questions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}
                </ul>
            </div>

            <div class="expert-section">
                <h4>处理建议</h4>
                <ol>
                    ${item.advice.map(a => `<li>${escapeHtml(a)}</li>`).join("")}
                </ol>
            </div>

            ${relatedQA.length ? `
                <div class="expert-section">
                    <h4>相关问答参考</h4>
                    <ul>
                        ${relatedQA.map(qa => `
                            <li>
                                <strong>${escapeHtml(qa.question)}</strong>
                                <br>
                                ${escapeHtml(getShortAnswer(qa))}
                            </li>
                        `).join("")}
                    </ul>
                </div>
            ` : ""}

            <div class="expert-note">
                如果以上方法无法解决，建议使用问答搜索，或者使用 AI问题助手并上传日志 / 截图。
            </div>
        `;
    }

    function getRelatedQA(type) {
        const data = getQAData();

        if (!type || !Array.isArray(data) || !data.length) {
            return [];
        }

        const typeText = normalize([
            type.name,
            type.questions.join(" "),
            type.advice.join(" "),
            Array.isArray(type.keywords) ? type.keywords.join(" ") : ""
        ].join(" "));

        const typeKeywords = Array.isArray(type.keywords)
            ? type.keywords.map(keyword => normalize(keyword)).filter(Boolean)
            : [];

        return data
            .map(item => {
                const category = String(item.category || "");
                const question = String(item.question || "");
                const answer = String(item.rawAnswer || item.answer || item.answerHtml || "");
                const keywords = Array.isArray(item.keywords)
                    ? item.keywords.map(keyword => String(keyword || ""))
                    : [];

                const qaText = normalize([
                    category,
                    question,
                    answer,
                    keywords.join(" ")
                ].join(" "));

                let score = 0;

                typeKeywords.forEach(keyword => {
                    if (!keyword) {
                        return;
                    }

                    if (qaText.includes(keyword)) {
                        score += keyword.length >= 4 ? 28 : 18;
                    }

                    if (typeText.includes(keyword) && qaText.includes(keyword)) {
                        score += 18;
                    }
                });

                if (type.id === "basic" && category === "基础与获取") {
                    score += 80;
                }

                if (type.id === "performance" && category === "运行与优化") {
                    score += 80;
                }

                if (type.id === "voxy" && qaText.includes("voxy")) {
                    score += 80;
                }

                if (type.id === "shader" && qaText.includes("光影")) {
                    score += 80;
                }

                if (type.id === "gameplay" && category === "游戏内容与玩法") {
                    score += 80;
                }

                if (type.id === "bugs" && category === "Bug与问题") {
                    score += 80;
                }

                if (type.id === "server" && category === "服务端与联机") {
                    score += 80;
                }

                if (type.id === "mods" && category === "模组与投稿") {
                    score += 80;
                }

                if (type.id === "mobile" && qaText.includes("手机")) {
                    score += 80;
                }

                if (type.id === "feedback" && qaText.includes("反馈")) {
                    score += 80;
                }

                return {
                    item,
                    score
                };
            })
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(entry => entry.item);
    }

    function getQAData() {
        if (Array.isArray(window.QA_DATA)) {
            return window.QA_DATA;
        }

        if (Array.isArray(window.qaData)) {
            return window.qaData;
        }

        if (Array.isArray(window.QAData)) {
            return window.QAData;
        }

        return [];
    }

    function getShortAnswer(item) {
        const answer = String(item.rawAnswer || item.answer || "");
        const cleanText = answer
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n+/g, " ")
            .trim();

        if (cleanText.length <= 90) {
            return cleanText;
        }

        return cleanText.slice(0, 90).trimEnd() + "……";
    }

    function openModal() {
        if (!modal) {
            return;
        }

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        if (!modal) {
            return;
        }

        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        unlockBodyIfNoModal();
    }

    function unlockBodyIfNoModal() {
        const hasOpenModal = document.querySelector(
            ".expert-modal-mask.show, .changelog-modal-mask.show, .chat-modal-mask.show"
        );

        if (!hasOpenModal) {
            document.body.classList.remove("modal-open");
        }
    }

    function normalize(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[，。！？、,.!?;；:：()（）[\]【】"'“”‘’《》<>\/\\|_\-—]/g, "");
    }

    function escapeHtml(value) {
        if (window.AppUtils && typeof window.AppUtils.escapeHtml === "function") {
            return window.AppUtils.escapeHtml(value);
        }

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    return {
        init
    };
})();
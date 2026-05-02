window.ExpertModule = (() => {
    let root = null;
    let modal = null;

    const problemTypes = [
        {
            id: "install",
            name: "安装 / 下载 / 启动器问题",
            questions: [
                "整合包在哪里下载",
                "夸克网盘文件为空或链接失效",
                "下载的整合包变成图片或 .png 文件",
                "PCL2 安装失败",
                "不知道全量客户端、正式版和服务端区别",
                "HMCL 能不能用"
            ],
            advice: [
                "整合包优先从 QQ 群文件下载，夸克网盘只是备用方式，可能会出现文件为空、被吞或链接失效。",
                "如果下载的文件看起来像图片或 .png，请开启文件扩展名，把最后的 .png 改成 .zip。",
                "普通正式版整合包一般是 .zip，不要解压，直接拖进 PCL2 安装。",
                "全量客户端是解压即玩版本，解压后打开里面的启动器即可，不需要再拖进 PCL2。",
                "服务端是开服用版本，通常会去掉 VOXY、光影等客户端 MOD。",
                "HMCL 能用但不推荐，萌新建议优先使用 PCL2。"
            ]
        },
        {
            id: "memory",
            name: "内存 / 卡顿 / 性能问题",
            questions: [
                "游戏很卡或 FPS 很低",
                "进入世界卡顿",
                "内存分配多少合适",
                "分配更多内存反而闪退",
                "VOXY 或光影导致卡顿",
                "首次进图很慢"
            ],
            advice: [
                "理论最低 4GB 可能能进游戏，但不建议。建议最低分配 8GB。",
                "16GB 总内存的电脑，建议分配 8GB。",
                "24GB 总内存的电脑，建议分配 8GB 到 12GB。",
                "32GB 总内存的电脑，建议分配 12GB 到 16GB。",
                "不要把所有内存都分给 Java，系统和后台程序也需要内存，分太满反而容易卡死或闪退。",
                "如果游戏很卡，可以尝试使用群文件里的预加载存档、关闭光影、关闭 VOXY、降低视距和模拟距离。"
            ]
        },
        {
            id: "voxy",
            name: "VOXY / 超远视距 / 跑图问题",
            questions: [
                "VOXY 是什么",
                "VOXY 必须开吗",
                "VOXY 导入崩溃",
                "VOXY 跑图卡死或闪退",
                "怎么用 VOXY 加载超远视距",
                "联机时朋友看不到 VOXY 远景"
            ],
            advice: [
                "VOXY 是客户端远景模组，可以显示很远距离的地形，但不是必须开的。",
                "如果配置一般，或者开 VOXY 后卡顿、闪退，可以关闭 VOXY。",
                "最省事的方法是直接使用 QQ 群文件里已经跑好的地图存档。",
                "自己跑图时，可以先用 Chunky 预生成地形，再使用 /voxy import 导入。",
                "VOXY 导入崩溃时，优先检查内存是否至少 8GB、Java 是否为 Java 21，并先关闭光影再试。",
                "联机时 VOXY 是客户端模组，服务端不会自动同步远景数据。谁想看远景，谁本地就要有 VOXY 数据。"
            ]
        },
        {
            id: "shader",
            name: "光影 / 显示 / UI 兼容问题",
            questions: [
                "光影设置界面空白",
                "菜单看不见但可以盲点",
                "开光影后蓝图预览不显示",
                "强力胶范围不显示",
                "动力臂框选不显示",
                "某些光影导致崩溃"
            ],
            advice: [
                "建议优先使用整合包自带光影，或群文件提供的兼容光影。",
                "光影设置界面空白，通常是 YSM 和 Iris 的 UI 渲染冲突。",
                "可以尝试删除 YSM 或等待修复。",
                "也可以关闭 Iris 的菜单背景模糊：游戏 → 选项 → 辅助功能 → 菜单背景模糊：关。",
                "强力胶范围、蓝图预览、动力臂框选等内容，在部分光影下可能不显示。",
                "遇到这类显示问题时，可以先关闭光影，完成操作后再打开光影。"
            ]
        },
        {
            id: "server",
            name: "服务器 / 联机问题",
            questions: [
                "服务端在哪里下载",
                "服务端启动报错",
                "服务器连接失败",
                "客户端和服务端版本不一致",
                "有没有官方服务器",
                "面板服能不能开这个包"
            ],
            advice: [
                "服务端已经发布在 QQ 群文件里，请下载最新版服务端，不要用旧版本。",
                "客户端和服务端版本必须一致，否则容易进服失败、连接中断、报错或崩溃。",
                "开服务端建议 CPU 4 核及以上，主频建议 4.5GHz 以上，服务端内存至少 12GB。",
                "服务端启动报错或连接失败时，检查客户端和服务端版本、Java 版本、启动脚本、防火墙、端口映射和内网穿透。",
                "目前没有官方服务器，也没有官方群服，可以自行开服，或加入群友开的服务器。",
                "不推荐面板服。很多面板服存在配置虚标、超开、CPU 性能不足、客服不懂 NeoForge 等问题。"
            ]
        },
        {
            id: "known-bugs",
            name: "已知 Bug / 崩溃问题",
            questions: [
                "missing tacz 报错",
                "光影设置界面空白",
                "传送石碑物理化后崩溃",
                "群文件地图不刷新动物",
                "抱起生物、车或人会闪退",
                "扳手加连锁采集导致物品消失",
                "经验颗粒按 W 思索崩溃"
            ],
            advice: [
                "missing tacz 一般不用管，TACZ 枪械模组因为兼容问题暂时被移除，不影响正常游戏。",
                "TACZ 暂时不确定什么时候加回来，不建议自己手动添加，可能会崩溃。",
                "传送石碑物理化后可能崩溃，普通玩家建议不要把传送石碑物理化。",
                "群文件地图不刷新动物时，可以输入：/gamerule doMobSpawning true。",
                "抱起生物、车或人导致闪退 / 掉线 / 崩服是旧版本 BUG，新版 1.1.0 整合包 / 服务端已经修复，请确认客户端和服务端版本一致。",
                "扳手加连锁采集导致机械动力物品消失是旧版本 BUG，新版 1.1.0 已经修复。",
                "经验颗粒按 W 思索崩溃是已知 BUG，目前不建议对经验颗粒使用 W 键思索。"
            ]
        },
        {
            id: "gameplay",
            name: "游戏内容 / 机械动力 / 载具玩法",
            questions: [
                "完全没玩过机械动力能不能玩",
                "W 键思索是什么",
                "开局送的车怎么收起来",
                "车掉坑里或找不到怎么办",
                "飞机或飞艇怎么飞",
                "无线红石遥控器用不了",
                "怎么找下界要塞或末地城"
            ],
            advice: [
                "完全没玩过机械动力也可以玩，但建议先学一点基础。",
                "建议至少学会使用扳手、护目镜、JEI、W 键思索和方块说明书。",
                "W 键思索是机械动力模组的教程功能，可以查看物品用途、工作逻辑和动画演示。",
                "开局送的车可以用同模组的撬棍回收，回收后可以用机动车加工台重新组装。",
                "飞机或飞艇需要给引擎放燃料，例如烈焰蛋糕、煤炭等。",
                "飞船、汽车等结构物理化后，无线红石遥控器可能无法正常使用，可以尝试改用无线打字机。",
                "找下界要塞、末地城等结构，可以使用自然指南针 / 自然罗盘，或者在 JEI 搜索指南针。"
            ]
        },
        {
            id: "mods",
            name: "模组 / 投稿 / 自定义内容",
            questions: [
                "能不能自己加 MOD",
                "有没有 AE2",
                "想加存储模组",
                "加模组后崩溃怎么办",
                "航空学载具能不能投稿",
                "怎么投稿载具"
            ],
            advice: [
                "可以自己加 MOD，但后果自负。",
                "自己加 MOD 可能导致崩溃、存档损坏、配方冲突、服务端无法启动、客户端进不去服务器。",
                "整合包内没有 AE2。",
                "因为自行加 MOD 导致的问题，制作组不提供支持，萌新不建议乱加。",
                "航空学载具可以投稿，联系管理 @Turin·Turambar。",
                "投稿一般需要 .nbt 格式蓝图文件，建议载具外形美观、功能正常、结构完整、生存可用。"
            ]
        },
        {
            id: "mobile",
            name: "手机端 / Pojav 问题",
            questions: [
                "手机能不能玩",
                "Pojav 能不能启动",
                "手机端崩溃",
                "手机性能不足",
                "手机端按键异常"
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
            name: "Bug 反馈 / 报错提交",
            questions: [
                "发现 Bug 后怎么反馈",
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
                "请描述怎么复现，不要只发一句“我崩了”，这样别人没法判断。"
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
                    <button class="primary-btn" id="openExpertBtn">进入专家系统</button>
                </div>
            </div>
        `;

        const btn = document.querySelector("#openExpertBtn");

        if (btn) {
            btn.addEventListener("click", openModal);
        }
    }

    function createModal() {
        if (modal || document.querySelector(".expert-modal-mask")) {
            modal = document.querySelector(".expert-modal-mask");
            return;
        }

        modal = document.createElement("div");
        modal.className = "expert-modal-mask";
        modal.innerHTML = `
            <div class="expert-modal">
                <div class="expert-modal-header">
                    <div>
                        <h2>问题诊断专家系统</h2>
                        <p>请选择你遇到的问题类型，系统会给出可能原因和处理建议。</p>
                    </div>
                    <button class="modal-close-btn" id="closeExpertBtn">×</button>
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

        modal.querySelector("#closeExpertBtn").addEventListener("click", closeModal);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        renderTypes();
    }

    function renderTypes() {
        const list = modal.querySelector("#expertTypeList");

        list.innerHTML = problemTypes.map(item => `
            <button class="expert-type-btn" data-id="${item.id}">
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
        const panel = modal.querySelector("#expertResultPanel");

        if (!item) {
            panel.innerHTML = `<div class="empty-tip">未找到对应的问题类型。</div>`;
            return;
        }

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

            <div class="expert-note">
                如果以上方法无法解决，建议使用问答搜索，或者使用 AI问题助手并上传日志 / 截图。
            </div>
        `;
    }

    function openModal() {
        if (!modal) return;

        modal.classList.add("show");
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        if (!modal) return;

        modal.classList.remove("show");
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
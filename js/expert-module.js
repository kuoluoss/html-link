window.ExpertModule = (() => {
    let root = null;
    let modal = null;

    const problemTypes = [
        {
            id: "install",
            name: "安装 / 下载 / 启动器问题",
            questions: [
                "网盘下载的整合包变成图片",
                "PCL2 显示安装失败",
                "启动器无法导入整合包",
                "不知道全量客户端和正式版有什么区别",
                "HMCL 能不能用",
                "夸克网盘文件为空或被吞"
            ],
            advice: [
                "推荐优先使用群文件下载整合包，夸克网盘文件可能被吞或失效。",
                "如果整合包显示成图片，请在文件管理器中开启“文件扩展名”，把后缀从 .png 改回 .zip。",
                "PCL2 安装失败通常和网络、压缩包损坏、文件后缀错误或路径特殊字符有关，建议重新下载一次。",
                "正式版通常需要拖入 PCL2 导入安装；全量客户端是解压即玩的版本。",
                "HMCL 可以用，但不推荐。萌新建议优先使用群文件提供的 PCL 环境。",
                "不要直接在压缩包里启动游戏，请按说明导入或完整解压。"
            ]
        },
        {
            id: "memory",
            name: "内存 / 卡顿 / 性能问题",
            questions: [
                "进入游戏很卡",
                "FPS 很低",
                "创建世界或跑图时崩溃",
                "提示内存不足",
                "分配更多内存反而更容易崩",
                "加载地图很慢"
            ],
            advice: [
                "这个整合包建议分配 12GB 或以上运行内存，最低 8GB 可能会非常卡顿或崩溃。",
                "如果电脑总内存只有 16GB，请关闭浏览器、录屏、聊天软件等后台程序后再启动。",
                "不要把全部物理内存都分给 Java，系统、驱动和后台程序也需要内存。",
                "一般建议：总内存 24GB 时分配 10~12GB；总内存 32GB 时分配 12~16GB。",
                "降低视距、模拟距离，关闭光影和 VOXY，可以明显减轻压力。",
                "首次进入世界或没有使用预加载地图时，后台生成地形会导致明显卡顿。"
            ]
        },
        {
            id: "voxy",
            name: "VOXY / 超远视距 / 跑图问题",
            questions: [
                "VOXY 是不是必须开",
                "VOXY 导入后闪退",
                "VOXY 加载到一半崩溃或卡死",
                "怎么用 VOXY 加载超远视距",
                "联机时别人看不到 VOXY 远景",
                "要不要给朋友也发 VOXY 数据"
            ],
            advice: [
                "VOXY 不是必须开的，不开也能正常玩，只是看不到超远景。",
                "想省事可以直接使用群文件中已经预加载好的地图存档。",
                "自己跑图时建议先使用 Chunky 预生成地形，再进行 VOXY 导入。",
                "VOXY 导入闪退时，优先检查 Java 内存分配，建议 12GB 以上。",
                "可以尝试关闭光影、关闭 VOXY 后先进存档，再重新导入。",
                "联机时 VOXY 是客户端模组，不会由服务器自动同步远景数据。需要把跑好的 .voxy 文件夹或相关存档数据发给其他玩家。"
            ]
        },
        {
            id: "shader",
            name: "光影 / 显示 / UI 兼容问题",
            questions: [
                "光影设置界面是空白的",
                "菜单看不见但可以盲点",
                "开光影后看不到强力胶范围",
                "蓝图预览不显示",
                "动力臂框选不显示",
                "某些光影导致崩溃"
            ],
            advice: [
                "部分光影可能与 VOXY、YSM、Iris 等模组存在兼容性问题。",
                "如果光影设置界面空白，可能是 YSM 和 Iris 的 UI 渲染冲突。",
                "可以尝试关闭 Iris 的菜单背景模糊：游戏 → 选项 → 辅助功能 → 菜单背景模糊：关。",
                "如果强力胶范围、蓝图预览或动力臂框选在光影下不显示，建议先关闭光影操作，操作完再打开。",
                "整合包自带或群文件提供的光影通常更稳，例如 Photon。",
                "Derivative 等部分光影可能已停更或存在兼容性问题，不建议优先使用。"
            ]
        },
        {
            id: "server",
            name: "服务器 / 联机问题",
            questions: [
                "服务器进不去",
                "连接失败或连接超时",
                "客户端和服务端版本不匹配",
                "1.0.1.1 客户端能不能进 1.0.0 服务端",
                "有没有官方群服",
                "面板服能不能开这个包",
                "联机时朋友是否也要加载 VOXY"
            ],
            advice: [
                "客户端和服务端版本必须尽量一致，不一致可能导致注册表不同步、网络协议错误、进服失败甚至崩溃。",
                "1.0.1.1 客户端不能稳定进入 1.0.0 服务端，建议客户端和服务端使用同一个版本。",
                "服务端建议至少 4 核 CPU，主频 4.5GHz 以上，并分配至少 12GB 运行内存。",
                "连接失败时请检查服务器防火墙、端口映射、内网穿透和服务器地址端口是否正确。",
                "不推荐使用面板服，很多面板服存在配置虚标、超开、性能缩水或客服不懂现代服务端的问题。",
                "目前没有官方群服，可以自行开服，或找群里其他玩家的服务器。",
                "VOXY 是客户端模组，联机时不会自动同步远景，需要把 .voxy 文件夹或跑好的数据发给朋友。"
            ]
        },
        {
            id: "known-bugs",
            name: "已知 Bug / 崩溃问题",
            questions: [
                "抱起生物、车或人会闪退",
                "经验颗粒按 W 思索崩溃",
                "传送石碑物理化后崩溃",
                "扳手加连锁采集导致机械动力物品消失",
                "missing tacz 报错",
                "TACZ 枪械模组什么时候加回来",
                "群文件地图不刷新动物"
            ],
            advice: [
                "抱人、抱生物、抱车、放下实体等操作可能导致掉线、闪退甚至崩服，这是当前版本已知 Bug，建议暂时不要使用。",
                "经验颗粒使用 W 键思索会崩溃，暂时不要对经验颗粒使用思索功能。",
                "传送石碑物理化后崩溃属于已知兼容问题，可自行尝试 Waystones-Sable 等社区 Mod，但稳定性不保证。",
                "扳手加连锁采集导致机械动力物品消失是已知 Bug，建议安装 create ultimine 或等待整合包后续补装。",
                "missing tacz 报错一般不用管，TACZ 因兼容问题已被暂时移除，不影响正常游戏。",
                "不建议手动添加 TACZ，可能引发崩溃。",
                "如果群文件地图不刷新动物，可以输入：/gamerule doMobSpawning true"
            ]
        },
        {
            id: "gameplay",
            name: "游戏内容 / 机械动力 / 载具玩法",
            questions: [
                "完全没玩过机械动力能不能玩",
                "开局送的车怎么收起来",
                "车掉坑里或找不到了怎么办",
                "飞机或飞艇怎么飞",
                "航空学飞机怎么转向",
                "无线红石遥控器用不了",
                "怎么找下界要塞或末地城"
            ],
            advice: [
                "完全没玩过机械动力也可以玩，但强烈建议先补一点基础。",
                "至少先学会使用扳手、护目镜、JEI、W 键思索和方块说明书。",
                "开局送的车可以使用同模组的撬棍回收。",
                "如果车掉入虚空或彻底丢失，可以在创造模式重新拿取，或使用命令召唤。",
                "飞机或飞艇需要往引擎中放入燃料，例如烈焰蛋糕、煤炭等。",
                "航空学载具转向和重心、推力线有关，建议搜索航空学飞艇或飞机教程。",
                "寻找下界要塞、末地城等结构，可以使用结构指南针，在 JEI 中搜索“指南针”。"
            ]
        },
        {
            id: "mods",
            name: "模组 / 投稿 / 自定义内容",
            questions: [
                "能不能自己加 MOD",
                "有没有 AE2 或其他存储模组",
                "加模组后崩溃怎么办",
                "载具能不能投稿",
                "怎么投稿航空学载具",
                "简易存储配方和以前不一样"
            ],
            advice: [
                "可以自己加 MOD，但后果自负。",
                "自行添加 MOD 后出现的崩溃、冲突、进不去游戏等问题，需要自己解决，制作组不提供支持。",
                "包内没有 AE2，如果你自行添加，需要自己承担兼容性问题。",
                "简易存储更换过材质包，外观和配方感觉可能不同，合成终端在游戏里叫“合成器”。",
                "航空学载具可以投稿，可以联系管理 @Turin·Turambar。",
                "投稿载具建议以 .nbt 蓝图文件形式保存，并确保原创、功能完整、生存可用。"
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
                "触控或按键异常"
            ],
            advice: [
                "群里目前有手机端成功启动案例，但具体操作方式需要自行研究。",
                "手机端兼容性不保证，优先建议使用电脑端。",
                "如果使用 PojavLauncher，请自行确认 Java Runtime、游戏版本、模组环境是否匹配。",
                "建议降低渲染距离、画质、视距和其他性能消耗设置。",
                "本群一般不负责手机端教学和排错。"
            ]
        },
        {
            id: "feedback",
            name: "Bug 反馈 / 报错提交",
            questions: [
                "发现 Bug 后怎么反馈",
                "游戏崩溃了要发什么",
                "报错文件怎么看",
                "应该怎么描述问题",
                "要不要把错误报告发出来"
            ],
            advice: [
                "反馈前先看 FAQ 或群公告，确认是否已经是已知问题。",
                "如果有崩溃或报错，建议先把错误报告丢给 AI 看一眼，判断大概原因。",
                "反馈时最好附上整合包版本号。",
                "说明你是单机还是联机，是否开启光影，是否开启 VOXY。",
                "最好附上截图、crash-report、latest.log 或服务端日志。",
                "不要只说“崩了”“进不去”，这样很难判断原因。"
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

        document.querySelector("#openExpertBtn").addEventListener("click", openModal);
    }

    function createModal() {
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
                如果以上方法无法解决，建议使用问答搜索，或者在搜索框中输入关键词搜索具体问题。
            </div>
        `;
    }

    function openModal() {
        modal.classList.add("show");
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        modal.classList.remove("show");
        document.body.classList.remove("modal-open");
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

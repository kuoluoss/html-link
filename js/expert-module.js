window.ExpertModule = (() => {
    let root = null;
    let modal = null;

    const problemTypes = [
        {
            id: "install",
            name: "安装 / 下载问题",
            questions: [
                "整合包下载失败",
                "压缩包无法解压",
                "启动器无法导入整合包",
                "缺少必要文件"
            ],
            advice: [
                "确认下载的文件是否完整，建议重新下载一次。",
                "不要直接在压缩包内启动游戏，请先完整解压。",
                "确认启动器支持导入该格式的整合包。",
                "检查路径中是否存在特殊字符、中文过长路径或权限问题。"
            ]
        },
        {
            id: "crash",
            name: "崩溃 / 闪退问题",
            questions: [
                "启动后立刻闪退",
                "进入世界时崩溃",
                "加载模组时报错",
                "出现 crash-report"
            ],
            advice: [
                "优先检查 Java 版本是否符合整合包要求。",
                "启动器内存建议分配 4GB 到 8GB，内存过低容易崩溃。",
                "不要随意删除或新增模组，可能导致依赖缺失。",
                "如果有 crash-report，请根据报错中的 modid 定位问题模组。"
            ]
        },
        {
            id: "performance",
            name: "卡顿 / 性能问题",
            questions: [
                "游戏 FPS 很低",
                "加载地图很慢",
                "进入世界后卡顿",
                "内存占用很高"
            ],
            advice: [
                "降低光影、材质包、视距和模拟距离。",
                "关闭后台占用较高的软件。",
                "确认游戏是否使用独立显卡运行。",
                "适当增加内存，但不要超过电脑总内存的一半。"
            ]
        },
        {
            id: "server",
            name: "服务器 / 联机问题",
            questions: [
                "服务器进不去",
                "版本不匹配",
                "连接超时",
                "被提示缺少模组"
            ],
            advice: [
                "确认客户端整合包版本和服务器要求完全一致。",
                "检查服务器地址和端口是否填写正确。",
                "连接超时通常和网络、服务器状态、防火墙有关。",
                "如果提示缺少模组，请重新安装完整整合包。"
            ]
        },
        {
            id: "mobile",
            name: "手机端 / Pojav 问题",
            questions: [
                "手机无法启动",
                "Pojav 崩溃",
                "手机性能不足",
                "触控或按键异常"
            ],
            advice: [
                "手机端兼容性不保证，优先建议使用电脑端。",
                "降低渲染距离和画质设置。",
                "确认 PojavLauncher、Java Runtime、游戏版本匹配。",
                "部分模组可能不兼容手机端环境。"
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
                如果以上方法无法解决，建议使用问答助手，或者在搜索框中输入关键词搜索具体问题。
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
        return window.AppUtils.escapeHtml(value);
    }

    return {
        init
    };
})();

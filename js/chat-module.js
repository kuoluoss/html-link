window.ChatModule = (() => {
    let modal = null;

    const diagnosisRules = [
        {
            id: "install",
            title: "安装 / 下载问题",
            keywords: ["安装", "下载", "pcl", "pcl2", "导入", "压缩包", "zip", "png", "图片", "后缀", "网盘", "夸克", "文件空", "被吞", "安装失败"],
            causes: [
                "整合包文件没有下载完整。",
                "文件后缀不正确，例如被网盘改成了 .png。",
                "PCL2 网络下载依赖失败。",
                "压缩包路径过深，或者路径里有特殊字符。"
            ],
            steps: [
                "优先从QQ群文件重新下载整合包。",
                "确认文件后缀是 .zip，不是 .png 或其他格式。",
                "如果是 .png，打开文件扩展名显示后，把 .png 删除，只保留 .zip。",
                "把 .zip 整合包直接拖入 PCL2 安装。",
                "如果 PCL2 仍然安装失败，可以改用全量客户端。"
            ],
            searchWords: ["PCL2", "安装失败", "zip", "png", "网盘", "全量客户端"]
        },
        {
            id: "crash",
            title: "崩溃 / 闪退问题",
            keywords: ["崩溃", "闪退", "crash", "报错", "启动失败", "进不去", "卡死", "missing", "tacz", "内存不足"],
            causes: [
                "运行内存分配不足。",
                "Java 或启动器配置不正确。",
                "模组兼容性问题。",
                "整合包文件不完整。",
                "手动添加或删除过模组。"
            ],
            steps: [
                "先确认 PCL2 内存分配是否达到 12GB 或以上。",
                "确认整合包没有被手动删模组或加模组。",
                "如果报 missing tacz，一般可以先忽略，不影响正常游戏。",
                "如果创建世界或跑图崩溃，优先降低 VOXY / Chunky 跑图范围。",
                "如果有 crash-report，再根据报错里的模组名继续排查。"
            ],
            searchWords: ["崩溃", "闪退", "crash", "missing tacz", "内存不足", "启动失败"]
        },
        {
            id: "performance",
            title: "卡顿 / 性能问题",
            keywords: ["卡", "卡顿", "掉帧", "帧数", "fps", "低帧", "很慢", "加载慢", "内存", "配置", "优化"],
            causes: [
                "分配内存不足。",
                "首次进世界正在生成地形。",
                "VOXY 或光影带来较高性能压力。",
                "电脑配置不足或没有使用独立显卡。",
                "后台程序占用过高。"
            ],
            steps: [
                "PCL2 内存建议分配 12GB 或以上。",
                "优先使用群文件里已经预加载好的地图存档。",
                "关闭光影，或者换成更轻量的光影。",
                "降低视距、模拟距离和画质设置。",
                "如果仍然卡，可以暂时关闭 VOXY。"
            ],
            searchWords: ["卡顿", "FPS", "内存", "VOXY", "光影", "预加载"]
        },
        {
            id: "voxy",
            title: "VOXY / 超远视距问题",
            keywords: ["voxy", "chunky", "跑图", "远景", "超远视距", "预加载", ".voxy", "import", "地形"],
            causes: [
                "VOXY 需要预先生成地形数据。",
                "跑图范围过大导致内存压力过高。",
                "没有正确执行 Chunky 或 VOXY 导入指令。",
                ".voxy 文件夹没有放到正确位置。"
            ],
            steps: [
                "最简单的方法是直接使用群文件里已经跑好的地图存档。",
                "如果自己跑图，先用较小半径测试，例如 1000 格。",
                "Chunky 加载完成后，再执行 /voxy import <存档名字>。",
                "联机时，朋友不需要重新跑图，只需要拿到对应的 .voxy 文件夹。",
                "如果跑到一半崩溃，降低半径并提高内存分配。"
            ],
            searchWords: ["VOXY", "Chunky", "跑图", ".voxy", "超远视距", "import"]
        },
        {
            id: "shader",
            title: "光影 / 菜单空白问题",
            keywords: ["光影", "shader", "iris", "ysm", "菜单空白", "盲点", "看不见", "photon", "derivative"],
            causes: [
                "部分光影与 VOXY 兼容性不好。",
                "YSM 与 Iris 的 UI 渲染可能冲突。",
                "光影版本过旧或已经停更。",
                "菜单背景模糊可能导致界面显示异常。"
            ],
            steps: [
                "优先尝试整合包自带或群文件推荐的光影，例如 Photon。",
                "如果光影设置界面空白，先关闭菜单背景模糊。",
                "路径：游戏 → 选项 → 辅助功能 → 菜单背景模糊：关。",
                "如果仍然异常，可尝试删除 YSM 或等待修复补丁。",
                "不建议使用已知兼容性差或停更的光影。"
            ],
            searchWords: ["光影", "Iris", "YSM", "菜单空白", "Photon", "VOXY"]
        },
        {
            id: "server",
            title: "服务端 / 联机问题",
            keywords: ["服务器", "服务端", "联机", "开服", "连接失败", "超时", "缺少模组", "版本不一致", "面板服", "端口", "内网穿透"],
            causes: [
                "客户端和服务端版本不一致。",
                "服务端模组文件不完整。",
                "端口映射或内网穿透配置错误。",
                "服务器配置不足。",
                "面板服性能虚标或超开。"
            ],
            steps: [
                "确认客户端和服务端都使用群文件中的最新版。",
                "如果提示缺少模组，重新安装完整客户端，不建议单独补模组。",
                "检查防火墙、端口映射或内网穿透设置。",
                "服务端建议至少分配 12GB 内存。",
                "多人稳定联机不推荐面板服，建议使用 VPS。"
            ],
            searchWords: ["服务端", "联机", "连接失败", "缺少模组", "开服", "面板服"]
        },
        {
            id: "mobile",
            title: "手机端 / Pojav 问题",
            keywords: ["手机", "安卓", "pojav", "pojavlauncher", "移动端"],
            causes: [
                "手机端兼容性不保证。",
                "部分模组不适配 PojavLauncher。",
                "手机内存或性能不足。",
                "运行环境需要自行调试。"
            ],
            steps: [
                "优先建议使用电脑端游玩。",
                "群里可能有成功启动案例，但不负责手机端教学。",
                "如果坚持尝试，请自行研究 PojavLauncher、Java Runtime 和渲染器设置。",
                "降低视距、画质，关闭光影和高负载功能。",
                "遇到崩溃时，不保证可以解决。"
            ],
            searchWords: ["手机", "Pojav", "安卓", "移动端"]
        },
        {
            id: "gameplay",
            title: "游戏内容 / 玩法问题",
            keywords: ["车", "飞机", "飞艇", "撬棍", "燃料", "烈焰蛋糕", "航空学", "转向", "思索", "w键", "经验颗粒", "传送石碑", "结构指南针"],
            causes: [
                "部分内容来自机械动力、航空学或物理化相关模组。",
                "部分物品存在已知兼容性问题。",
                "有些玩法需要特定工具或燃料。"
            ],
            steps: [
                "开局送的车可以用撬棍回收。",
                "飞机或飞艇需要给引擎加入燃料，例如烈焰蛋糕或煤炭。",
                "航空学载具转向需要考虑重心和推力线。",
                "经验颗粒不建议使用 W 键思索，可能崩溃。",
                "传送石碑物理化后崩溃属于已知问题。"
            ],
            searchWords: ["撬棍", "飞机", "飞艇", "航空学", "思索", "传送石碑"]
        }
    ];

    function init() {
        createButtonNearExpert();
        createModal();
    }

    function createButtonNearExpert() {
        const actionBox = document.querySelector("#expertActionBox");

        if (!actionBox) {
            console.warn("ChatModule 找不到 #expertActionBox");
            return;
        }

        const btn = document.createElement("button");
        btn.className = "secondary-btn";
        btn.id = "openChatBtn";
        btn.textContent = "问题诊断助手";

        actionBox.appendChild(btn);

        btn.addEventListener("click", openModal);
    }

    function createModal() {
        modal = document.createElement("div");
        modal.className = "chat-modal-mask";
        modal.innerHTML = `
            <div class="chat-modal">
                <div class="chat-modal-header">
                    <div>
                        <h2>问题诊断助手</h2>
                        <p>直接描述你遇到的问题，助手会判断类型并给出处理建议。</p>
                    </div>
                    <button class="modal-close-btn" id="closeChatBtn">×</button>
                </div>

                <div class="chat-modal-body">
                    <div class="assistant-tip">
                        示例：PCL2 安装失败、VOXY 跑图崩溃、服务器提示缺少模组、光影界面空白、手机能不能玩
                    </div>

                    <div class="chat-input-row">
                        <input id="chatSearchInput" type="text" placeholder="请描述你的问题，例如：我 VOXY 跑图到一半崩溃了">
                        <button id="chatSearchBtn">开始诊断</button>
                    </div>

                    <div class="quick-question-box">
                        <button data-text="PCL2 安装失败怎么办？">PCL2 安装失败</button>
                        <button data-text="VOXY 跑图崩溃怎么办？">VOXY 跑图崩溃</button>
                        <button data-text="游戏很卡帧数低怎么办？">游戏很卡</button>
                        <button data-text="服务器提示缺少模组怎么办？">缺少模组</button>
                        <button data-text="光影设置界面空白怎么办？">光影界面空白</button>
                        <button data-text="手机能不能玩？">手机能不能玩</button>
                    </div>

                    <div id="chatResultBox" class="chat-result-box">
                        ${renderWelcome()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#closeChatBtn").addEventListener("click", closeModal);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        const input = modal.querySelector("#chatSearchInput");
        const btn = modal.querySelector("#chatSearchBtn");

        btn.addEventListener("click", diagnose);

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                diagnose();
            }
        });

        modal.querySelectorAll(".quick-question-box button").forEach(button => {
            button.addEventListener("click", () => {
                input.value = button.dataset.text;
                diagnose();
            });
        });
    }

    function renderWelcome() {
        return `
            <div class="assistant-welcome">
                <h3>我可以帮你快速判断问题方向</h3>
                <p>这个助手不是单纯搜索，而是会根据你的描述，自动判断你更可能遇到的是安装、崩溃、卡顿、VOXY、光影、服务端还是手机端问题。</p>
                <div class="assistant-welcome-grid">
                    <span>安装失败</span>
                    <span>启动崩溃</span>
                    <span>游戏卡顿</span>
                    <span>VOXY 跑图</span>
                    <span>光影异常</span>
                    <span>服务端联机</span>
                    <span>手机端</span>
                    <span>玩法问题</span>
                </div>
            </div>
        `;
    }

    function diagnose() {
        const input = modal.querySelector("#chatSearchInput");
        const resultBox = modal.querySelector("#chatResultBox");

        const rawText = input.value.trim();

        if (!rawText) {
            resultBox.innerHTML = `<div class="empty-tip">请先描述你的问题。</div>`;
            return;
        }

        const matchedRule = getBestRule(rawText);
        const relatedQA = getRelatedQA(rawText, matchedRule);

        if (!matchedRule && !relatedQA.length) {
            resultBox.innerHTML = `
                <div class="assistant-diagnosis-card">
                    <h3>暂时无法判断问题类型</h3>
                    <p>你可以换一种说法，或者输入更具体的关键词。</p>
                    <div class="assistant-section">
                        <h4>建议补充的信息</h4>
                        <ul>
                            <li>你是安装失败、启动失败、进世界崩溃，还是联机失败？</li>
                            <li>有没有具体报错文字？</li>
                            <li>你使用的是 PCL2、全量客户端，还是服务端？</li>
                            <li>是否开了 VOXY、光影，或者自己添加过模组？</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }

        resultBox.innerHTML = `
            ${matchedRule ? renderDiagnosis(rawText, matchedRule) : ""}
            ${renderRelatedQA(relatedQA)}
        `;

        bindAssistantActions();
    }

    function getBestRule(text) {
        const normalizedText = normalize(text);

        let bestRule = null;
        let bestScore = 0;

        diagnosisRules.forEach(rule => {
            let score = 0;

            rule.keywords.forEach(keyword => {
                const normalizedKeyword = normalize(keyword);

                if (normalizedKeyword && normalizedText.includes(normalizedKeyword)) {
                    score += Math.max(1, normalizedKeyword.length);
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestRule = rule;
            }
        });

        return bestScore > 0 ? bestRule : null;
    }

    function getRelatedQA(text, rule) {
        const data = window.QA_DATA || window.qaData || [];
        const inputText = normalize(text);
        const ruleWords = rule ? rule.searchWords.map(normalize) : [];

        return data
            .map(item => {
                const qaText = normalize([
                    item.category,
                    item.question,
                    item.answer,
                    Array.isArray(item.keywords) ? item.keywords.join(" ") : item.keywords
                ].join(" "));

                let score = 0;

                if (inputText && qaText.includes(inputText)) {
                    score += 50;
                }

                splitToTokens(text).forEach(token => {
                    if (token.length >= 2 && qaText.includes(normalize(token))) {
                        score += token.length;
                    }
                });

                ruleWords.forEach(word => {
                    if (word && qaText.includes(word)) {
                        score += 8;
                    }
                });

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

    function renderDiagnosis(userText, rule) {
        return `
            <div class="assistant-diagnosis-card">
                <div class="assistant-diagnosis-head">
                    <div>
                        <span class="assistant-label">诊断结果</span>
                        <h3>${escapeHtml(rule.title)}</h3>
                    </div>
                    <button class="assistant-search-main-btn" data-keyword="${escapeHtml(rule.searchWords[0] || userText)}">
                        去主搜索查更多
                    </button>
                </div>

                <div class="assistant-section">
                    <h4>可能原因</h4>
                    <ul>
                        ${rule.causes.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                    </ul>
                </div>

                <div class="assistant-section">
                    <h4>优先处理步骤</h4>
                    <ol>
                        ${rule.steps.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                    </ol>
                </div>

                <div class="assistant-section">
                    <h4>推荐搜索词</h4>
                    <div class="assistant-keyword-row">
                        ${rule.searchWords.map(word => `
                            <button class="assistant-keyword-btn" data-keyword="${escapeHtml(word)}">
                                ${escapeHtml(word)}
                            </button>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    function renderRelatedQA(list) {
        if (!list.length) {
            return `
                <div class="assistant-related-card">
                    <h3>相关问答</h3>
                    <div class="empty-tip">没有匹配到特别相关的问答，可以点击推荐搜索词去主搜索区继续查。</div>
                </div>
            `;
        }

        return `
            <div class="assistant-related-card">
                <h3>相关问答</h3>
                <div class="assistant-related-list">
                    ${list.map(item => `
                        <div class="assistant-related-item">
                            <div class="assistant-related-question">
                                <span>${escapeHtml(item.category || "未分类")}</span>
                                <strong>${escapeHtml(item.question || "")}</strong>
                            </div>
                            <div class="assistant-related-answer">
                                ${formatAnswer(item.answer || "")}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    function bindAssistantActions() {
        modal.querySelectorAll(".assistant-keyword-btn, .assistant-search-main-btn").forEach(button => {
            button.addEventListener("click", () => {
                const keyword = button.dataset.keyword || "";
                sendToMainSearch(keyword);
            });
        });
    }

    function sendToMainSearch(keyword) {
        const mainInput = document.querySelector("#searchInput");

        if (!mainInput) {
            return;
        }

        mainInput.value = keyword;
        mainInput.dispatchEvent(new Event("input", { bubbles: true }));

        closeModal();

        setTimeout(() => {
            mainInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
            mainInput.focus();
        }, 100);
    }

    function openModal() {
        modal.classList.add("show");
        document.body.classList.add("modal-open");

        const input = modal.querySelector("#chatSearchInput");
        setTimeout(() => input.focus(), 50);
    }

    function closeModal() {
        modal.classList.remove("show");
        document.body.classList.remove("modal-open");
    }

    function normalize(value) {
        return window.AppUtils.normalizeText(value);
    }

    function escapeHtml(value) {
        return window.AppUtils.escapeHtml(value);
    }

    function formatAnswer(value) {
        return window.AppUtils.formatAnswerToHtml(value);
    }

    function splitToTokens(value) {
        return String(value || "")
            .replace(/[，。！？、,.!?;；:：()（）[\]【】"'“”‘’]/g, " ")
            .split(/\s+/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    return {
        init
    };
})();
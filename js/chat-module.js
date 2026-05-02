window.ChatModule = (() => {
    let modal = null;
    let messages = [];
    let pendingFiles = [];
    let isSending = false;

    // 这里换成你的 Cloudflare Worker 地址
    const AI_API_URL = "https://api.xn--efv066biyh.online";

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
        btn.textContent = "AI问题助手";

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
                        <h2>AI问题助手</h2>
                        <p>直接描述你遇到的问题，AI 会结合整合包常见问题给出建议。</p>
                        <p>AI思考时间较长，辛苦耐心等待。</p>
                    </div>
                    <button class="modal-close-btn" id="closeChatBtn" type="button">×</button>
                </div>

                <div class="chat-modal-body">
                    <div class="assistant-tip">
                        示例：PCL2 安装失败、VOXY 跑图崩溃、服务器提示缺少模组、光影界面空白、手机能不能玩
                    </div>

                    <div id="chatResultBox" class="chat-result-box">
                        ${renderWelcome()}
                    </div>

                    <div class="quick-question-box">
                        <button type="button" data-text="PCL2 安装失败怎么办？">PCL2 安装失败</button>
                        <button type="button" data-text="VOXY 跑图崩溃怎么办？">VOXY 跑图崩溃</button>
                        <button type="button" data-text="游戏很卡帧数低怎么办？">游戏很卡</button>
                        <button type="button" data-text="服务器提示缺少模组怎么办？">缺少模组</button>
                        <button type="button" data-text="光影设置界面空白怎么办？">光影界面空白</button>
                        <button type="button" data-text="手机能不能玩？">手机能不能玩</button>
                    </div>

                    <div id="attachmentPreview" class="attachment-preview"></div>

                    <div class="chat-input-row">
                        <input
                            id="chatSearchInput"
                            type="text"
                            placeholder="请描述问题，也可以 Ctrl+V 粘贴截图，或上传日志/图片"
                        >

                        <input
                            id="chatFileInput"
                            type="file"
                            multiple
                            style="display:none"
                        >

                        <button id="chatUploadBtn" type="button">上传</button>
                        <button id="chatSearchBtn" type="button">发送</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const resultBox = modal.querySelector("#chatResultBox");

        if (resultBox) {
            resultBox.style.overflowAnchor = "none";
        }

        modal.querySelector("#closeChatBtn").addEventListener("click", closeModal);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        const input = modal.querySelector("#chatSearchInput");
        const btn = modal.querySelector("#chatSearchBtn");

        btn.addEventListener("click", sendMessage);

        bindFileUpload();
        bindPasteImage();
        bindAttachmentPreviewRemove();

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                if (event.isComposing) {
                    return;
                }

                event.preventDefault();
                sendMessage();
            }
        });

        modal.querySelectorAll(".quick-question-box button").forEach(button => {
            button.addEventListener("click", () => {
                if (isSending) {
                    return;
                }

                input.value = button.dataset.text;
                sendMessage();
            });
        });

        updateSendingState(false);
    }

    function renderWelcome() {
        return `
            <div class="assistant-welcome">
                <h3>你好，我是 AI问题助手</h3>
                <p>
                    你可以直接告诉我你遇到的问题，比如安装失败、启动崩溃、VOXY、光影、联机、服务端、手机端等。
                </p>
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

    async function sendMessage() {
        if (isSending) {
            return;
        }

        const input = modal.querySelector("#chatSearchInput");

        const text = input.value.trim();

        if (!text && pendingFiles.length === 0) {
            return;
        }

        isSending = true;
        updateSendingState(true);

        const currentFiles = [...pendingFiles];
        const userDisplayText = text || "请分析我上传的日志或截图";

        input.value = "";

        const attachmentNames = currentFiles.map(file => file.name).join("、");

        messages.push({
            role: "user",
            content: attachmentNames
                ? `${userDisplayText}\n\n附件：${attachmentNames}`
                : userDisplayText
        });

        renderMessages({
            scrollTo: "bottom"
        });

        showLoading();

        try {
            const relatedQA = getRelatedQA(text || attachmentNames);

            const response = await fetch(`${AI_API_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: userDisplayText,
                    history: messages.slice(-8),
                    relatedQA,
                    attachments: currentFiles
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error("AI 接口请求失败：" + response.status + " " + errorText);
            }

            const data = await response.json();

            const reply = data.reply || "AI 没有返回内容。";

            removeLoading();

            messages.push({
                role: "assistant",
                content: reply
            });

            pendingFiles = [];
            updateAttachmentPreview();

            renderMessages({
                scrollTo: "lastAssistantTop"
            });

        } catch (error) {
            console.error(error);

            removeLoading();

            messages.push({
                role: "assistant",
                content: "抱歉，AI问题助手暂时连接失败。可能是图片或日志过大，也可能是接口暂时不可用。"
            });

            renderMessages({
                scrollTo: "lastAssistantTop"
            });
        } finally {
            isSending = false;
            updateSendingState(false);
        }
    }

    function updateSendingState(sending) {
        if (!modal) {
            return;
        }

        const input = modal.querySelector("#chatSearchInput");
        const sendBtn = modal.querySelector("#chatSearchBtn");
        const uploadBtn = modal.querySelector("#chatUploadBtn");
        const fileInput = modal.querySelector("#chatFileInput");
        const quickBtns = modal.querySelectorAll(".quick-question-box button");

        if (input) {
            input.disabled = sending;
            input.placeholder = sending
                ? "AI 正在回复，请稍等..."
                : "请描述问题，也可以 Ctrl+V 粘贴截图，或上传日志/图片";
        }

        if (sendBtn) {
            sendBtn.disabled = sending;
            sendBtn.textContent = sending ? "思考中..." : "发送";
        }

        if (uploadBtn) {
            uploadBtn.disabled = sending;
        }

        if (fileInput) {
            fileInput.disabled = sending;
        }

        quickBtns.forEach(btn => {
            btn.disabled = sending;
        });
    }

    function bindFileUpload() {
        const uploadBtn = modal.querySelector("#chatUploadBtn");
        const fileInput = modal.querySelector("#chatFileInput");

        if (!uploadBtn || !fileInput) {
            console.warn("找不到上传按钮或文件 input");
            return;
        }

        uploadBtn.addEventListener("click", () => {
            if (isSending) {
                return;
            }

            fileInput.click();
        });

        fileInput.addEventListener("change", async event => {
            if (isSending) {
                fileInput.value = "";
                return;
            }

            await addFilesToPending(event.target.files);
            fileInput.value = "";
        });
    }

    function bindPasteImage() {
        const input = modal.querySelector("#chatSearchInput");

        if (!input) return;

        input.addEventListener("paste", async event => {
            if (isSending) {
                event.preventDefault();
                return;
            }

            const items = event.clipboardData && event.clipboardData.items;

            if (!items) return;

            const files = [];

            for (const item of items) {
                if (item.kind !== "file") continue;

                const file = item.getAsFile();

                if (!file) continue;

                if (isImageFile(file)) {
                    const ext = getImageExt(file);
                    const pastedFile = new File(
                        [file],
                        `pasted-screenshot-${Date.now()}.${ext}`,
                        {
                            type: file.type || "image/png"
                        }
                    );

                    files.push(pastedFile);
                }
            }

            if (files.length > 0) {
                event.preventDefault();
                await addFilesToPending(files);
                input.placeholder = "截图已添加，请描述问题后发送";
            }
        });
    }

    function bindAttachmentPreviewRemove() {
        const preview = modal.querySelector("#attachmentPreview");

        if (!preview) return;

        preview.addEventListener("click", event => {
            if (isSending) {
                return;
            }

            const btn = event.target.closest("[data-remove-file-index]");

            if (!btn) return;

            const index = Number(btn.dataset.removeFileIndex);

            if (Number.isNaN(index)) return;

            pendingFiles.splice(index, 1);
            updateAttachmentPreview();
        });
    }

    async function addFilesToPending(fileList) {
        if (isSending) {
            return;
        }

        const files = Array.from(fileList || []);

        if (!files.length) return;

        const maxFileCount = 6;
        const maxImageSize = 5 * 1024 * 1024;
        const maxTextSize = 4 * 1024 * 1024;

        if (pendingFiles.length + files.length > maxFileCount) {
            messages.push({
                role: "assistant",
                content: `一次最多添加 ${maxFileCount} 个附件，请先发送当前问题。`
            });

            renderMessages({
                scrollTo: "lastAssistantTop"
            });

            return;
        }

        for (const file of files) {
            const image = isImageFile(file);

            if (image) {
                if (file.size > maxImageSize) {
                    messages.push({
                        role: "assistant",
                        content: `图片 ${file.name} 太大了，请控制在 5MB 以内。`
                    });

                    renderMessages({
                        scrollTo: "lastAssistantTop"
                    });

                    continue;
                }

                try {
                    const dataUrl = await fileToDataURL(file);

                    pendingFiles.push({
                        name: file.name || `image-${Date.now()}.png`,
                        type: "image",
                        mime: file.type || "image/png",
                        content: dataUrl
                    });
                } catch (error) {
                    console.error(error);

                    messages.push({
                        role: "assistant",
                        content: `图片 ${file.name} 读取失败，请重新上传。`
                    });

                    renderMessages({
                        scrollTo: "lastAssistantTop"
                    });
                }

                continue;
            }

            if (file.size > maxTextSize) {
                messages.push({
                    role: "assistant",
                    content: `日志文件 ${file.name} 太大了，请控制在 4MB 以内，或只上传关键报错部分。`
                });

                renderMessages({
                    scrollTo: "lastAssistantTop"
                });

                continue;
            }

            try {
                const text = await file.text();

                pendingFiles.push({
                    name: file.name || `log-${Date.now()}.txt`,
                    type: "text",
                    mime: file.type || "text/plain",
                    content: text.slice(0, 40000)
                });
            } catch (error) {
                console.error(error);

                messages.push({
                    role: "assistant",
                    content: `文件 ${file.name} 无法读取，请换成 log、txt、json、crash-report 等文本日志文件。`
                });

                renderMessages({
                    scrollTo: "lastAssistantTop"
                });
            }
        }

        updateAttachmentPreview();
    }

    function updateAttachmentPreview() {
        const preview = modal.querySelector("#attachmentPreview");

        if (!preview) return;

        if (!pendingFiles.length) {
            preview.innerHTML = "";
            return;
        }

        preview.innerHTML = pendingFiles.map((file, index) => {
            const icon = file.type === "image" ? "图片" : "日志";

            return `
                <div class="attachment-item">
                    <span>${icon}：${escapeHtml(file.name)}</span>
                    <button type="button" data-remove-file-index="${index}" ${isSending ? "disabled" : ""}>删除</button>
                </div>
            `;
        }).join("");
    }

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    }

    function isImageFile(file) {
        const type = file.type || "";
        const name = String(file.name || "").toLowerCase();

        return (
            type.startsWith("image/") ||
            name.endsWith(".png") ||
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".webp") ||
            name.endsWith(".gif") ||
            name.endsWith(".bmp")
        );
    }

    function getImageExt(file) {
        const type = file.type || "";

        if (type.includes("jpeg")) return "jpg";
        if (type.includes("webp")) return "webp";
        if (type.includes("gif")) return "gif";
        if (type.includes("bmp")) return "bmp";

        return "png";
    }

    function renderMessages(options = {}) {
        const resultBox = modal.querySelector("#chatResultBox");

        if (!resultBox) return;

        resultBox.style.overflowAnchor = "none";

        if (!messages.length) {
            resultBox.innerHTML = renderWelcome();
            return;
        }

        resultBox.innerHTML = messages.map((msg, index) => {
            const cls = msg.role === "user" ? "ai-message-user" : "ai-message-assistant";
            const name = msg.role === "user" ? "你" : "AI问题助手";

            return `
                <div class="ai-message ${cls}" data-message-index="${index}" data-role="${msg.role}">
                    <div class="ai-message-name">${name}</div>
                    <div class="ai-message-content">${formatAnswer(msg.content)}</div>
                </div>
            `;
        }).join("");

        if (options.scrollTo === "bottom") {
            scrollToBottom(resultBox);
            return;
        }

        if (options.scrollTo === "lastAssistantTop") {
            scrollToLastAssistantTopAfterRender(resultBox);
        }
    }

    function scrollToBottom(resultBox) {
        requestAnimationFrame(() => {
            resultBox.scrollTop = resultBox.scrollHeight;
        });
    }

    function scrollToLastAssistantTopAfterRender(resultBox) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToLastAssistantTop(resultBox);

                setTimeout(() => {
                    scrollToLastAssistantTop(resultBox);
                }, 30);
            });
        });
    }

    function scrollToLastAssistantTop(resultBox) {
        const assistantMessages = resultBox.querySelectorAll(".ai-message-assistant");

        if (!assistantMessages.length) return;

        const lastAssistant = assistantMessages[assistantMessages.length - 1];

        const boxRect = resultBox.getBoundingClientRect();
        const msgRect = lastAssistant.getBoundingClientRect();

        const currentScrollTop = resultBox.scrollTop;
        const distanceFromBoxTop = msgRect.top - boxRect.top;

        let targetTop = currentScrollTop + distanceFromBoxTop;

        if (targetTop < 0) {
            targetTop = 0;
        }

        resultBox.scrollTo({
            top: targetTop,
            behavior: "auto"
        });
    }

    function showLoading() {
        const resultBox = modal.querySelector("#chatResultBox");

        if (!resultBox) return;

        const loading = document.createElement("div");
        loading.className = "ai-message ai-message-assistant";
        loading.id = "aiLoadingMessage";
        loading.innerHTML = `
            <div class="ai-message-name">AI问题助手</div>
            <div class="ai-message-content">正在思考中...</div>
        `;

        resultBox.appendChild(loading);
        resultBox.scrollTop = resultBox.scrollHeight;
    }

    function removeLoading() {
        const loading = modal.querySelector("#aiLoadingMessage");

        if (loading) {
            loading.remove();
        }
    }

    function getRelatedQA(text) {
        const data = window.QA_DATA || window.qaData || [];
        const inputText = normalize(text);
        const tokens = splitToTokens(text);

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

                tokens.forEach(token => {
                    const t = normalize(token);

                    if (t.length >= 2 && qaText.includes(t)) {
                        score += t.length;
                    }
                });

                return {
                    item,
                    score
                };
            })
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(entry => ({
                category: entry.item.category || "",
                question: entry.item.question || "",
                answer: entry.item.answer || "",
                keywords: entry.item.keywords || []
            }));
    }

    function openModal() {
        modal.classList.add("show");
        document.body.classList.add("modal-open");

        const input = modal.querySelector("#chatSearchInput");

        if (!isSending) {
            setTimeout(() => input.focus(), 50);
        }
    }

    function closeModal() {
        modal.classList.remove("show");
        document.body.classList.remove("modal-open");
    }

    function normalize(value) {
        if (window.AppUtils && typeof window.AppUtils.normalizeText === "function") {
            return window.AppUtils.normalizeText(value);
        }

        return String(value || "").toLowerCase().replace(/\s+/g, "");
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

    function formatAnswer(value) {
        return escapeHtml(value).replace(/\r?\n/g, "<br>");
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

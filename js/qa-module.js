// js/qa-module.js
(function () {
    const QAModule = {
        config: {
            listSelector: "#qaList",
            categorySelector: "#categoryBox",
            searchSelector: "#searchInput",
            clearSelector: "#clearSearchBtn"
        },

        data: [],
        filteredData: [],
        categories: [],
        activeCategory: "全部",
        searchText: "",
        expandedItem: null,

        // 默认答案预览长度：越小显示越短
        answerPreviewLength: 90,

        // 默认答案预览行数：大概显示 3 排文字
        answerPreviewLineCount: 3,

        els: {
            list: null,
            categoryBox: null,
            searchInput: null,
            clearBtn: null,
            countBox: null
        },

        init(options = {}) {
            this.config = Object.assign({}, this.config, options);

            this.els.list = document.querySelector(this.config.listSelector);
            this.els.categoryBox = document.querySelector(this.config.categorySelector);
            this.els.searchInput = document.querySelector(this.config.searchSelector);
            this.els.clearBtn = document.querySelector(this.config.clearSelector);

            if (!this.els.list) {
                console.error("QAModule 初始化失败：找不到问答列表容器");
                return;
            }

            this.injectQAStyle();
            this.createCountBox();

            this.data = this.getQAData();
            this.buildCategories();
            this.bindEvents();
            this.applyFilter();
        },

        injectQAStyle() {
            if (document.querySelector("#qaModuleExtraStyle")) {
                return;
            }

            const style = document.createElement("style");
            style.id = "qaModuleExtraStyle";

            style.textContent = `
                .qa-count-box {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 10px;
                    margin: 14px 0 12px;
                    color: #334155;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .qa-count-box strong {
                    color: #047857;
                    font-weight: 800;
                }

                .qa-count-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: #0f172a;
                    font-size: 14px;
                    font-weight: 700;
                    max-width: 100%;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .qa-count-pill strong {
                    color: #047857;
                }

                .qa-count-keyword {
                    color: #2563eb;
                }

                .qa-count-category {
                    color: #ea580c;
                }

                html,
                body {
                    max-width: 100%;
                    overflow-x: hidden;
                }

                *,
                *::before,
                *::after {
                    box-sizing: border-box;
                }

                .page-container,
                .card,
                .qa-list,
                .qa-item,
                .qa-category,
                .qa-question,
                .qa-answer,
                .category-box,
                .search-box {
                    min-width: 0;
                    max-width: 100%;
                }

                .qa-item {
                    overflow: hidden;
                }

                .qa-question,
                .qa-answer {
                    overflow: hidden;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                    max-width: 100%;
                }

                .qa-answer *,
                .qa-question *,
                .qa-item *,
                .card * {
                    max-width: 100%;
                }

                .qa-answer-content {
                    max-width: 100%;
                    overflow: hidden;
                }

                .qa-answer-preview {
                    position: relative;
                }

                .qa-answer-preview::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    height: 26px;
                    pointer-events: none;
                    background: linear-gradient(to bottom, rgba(248, 250, 252, 0), #f8fafc);
                }

                .qa-answer-toggle-row {
                    display: flex;
                    justify-content: flex-start;
                    margin-top: 10px;
                }

                .qa-answer-toggle-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    max-width: 100%;
                    padding: 7px 13px;
                    border: 1px solid #b9dfca;
                    border-radius: 999px;
                    background: #ecfdf5;
                    color: #047857;
                    font-size: 13px;
                    font-weight: 800;
                    line-height: 1.4;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .qa-answer-toggle-btn:hover {
                    border-color: #168957;
                    background: #d8f3e4;
                    color: #065f46;
                }

                .qa-answer a {
                    display: inline-block;
                    max-width: 100%;
                    color: #0066cc;
                    text-decoration: underline;
                    overflow-wrap: anywhere;
                    word-break: break-all;
                    word-wrap: break-word;
                    white-space: normal;
                }

                .qa-answer p,
                .qa-answer div,
                .qa-answer span,
                .qa-answer li,
                .qa-answer code,
                .qa-answer pre {
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                img,
                video,
                iframe,
                canvas,
                svg {
                    max-width: 100%;
                    height: auto;
                }

                pre {
                    max-width: 100%;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                code {
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .category-box {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .category-btn {
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    visibility: visible !important;
                    opacity: 1 !important;
                    white-space: nowrap;
                }

                .category-btn.active {
                    display: inline-flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background: var(--green, #168957) !important;
                    color: #ffffff !important;
                    border-color: var(--green, #168957) !important;
                }

                @media (max-width: 768px) {
                    .qa-count-box {
                        gap: 8px;
                        font-size: 13px;
                    }

                    .qa-count-pill {
                        font-size: 13px;
                    }

                    .page-container {
                        width: 100%;
                        padding-left: 12px;
                        padding-right: 12px;
                    }

                    .card {
                        width: 100%;
                        padding-left: 16px;
                        padding-right: 16px;
                    }

                    .qa-item {
                        width: 100%;
                        padding: 14px;
                    }

                    .qa-question {
                        width: 100%;
                        padding: 11px 12px;
                        font-size: 15px;
                        line-height: 1.65;
                    }

                    .qa-answer {
                        width: 100%;
                        padding: 12px 13px;
                        font-size: 15px;
                        line-height: 1.8;
                    }

                    .qa-answer-toggle-btn {
                        padding: 7px 12px;
                        font-size: 13px;
                    }

                    .search-box {
                        width: 100%;
                    }

                    .search-box input {
                        min-width: 0;
                        width: 100%;
                    }

                    .category-box {
                        width: 100%;
                        display: flex;
                        flex-wrap: wrap;
                    }

                    .category-btn {
                        max-width: 100%;
                        white-space: normal;
                    }
                }
            `;

            document.head.appendChild(style);
        },

        createCountBox() {
            if (document.querySelector("#qaCountBox")) {
                this.els.countBox = document.querySelector("#qaCountBox");
                return;
            }

            const countBox = document.createElement("div");
            countBox.id = "qaCountBox";
            countBox.className = "qa-count-box";

            if (this.els.categoryBox && this.els.categoryBox.parentNode) {
                this.els.categoryBox.parentNode.insertBefore(countBox, this.els.categoryBox);
            } else if (this.els.list && this.els.list.parentNode) {
                this.els.list.parentNode.insertBefore(countBox, this.els.list);
            }

            this.els.countBox = countBox;
        },

        getQAData() {
            if (Array.isArray(window.QA_DATA)) return window.QA_DATA;
            if (Array.isArray(window.qaData)) return window.qaData;
            if (Array.isArray(window.QAData)) return window.QAData;

            console.warn("QAModule：没有找到 QA_DATA / qaData / QAData");
            return [];
        },

        buildCategories() {
            const set = new Set();

            this.data.forEach(item => {
                if (item && item.category) {
                    set.add(item.category);
                }
            });

            this.categories = ["全部"].concat(Array.from(set));
        },

        bindEvents() {
            if (this.els.searchInput) {
                this.els.searchInput.addEventListener("input", () => {
                    this.searchText = this.els.searchInput.value.trim();
                    this.expandedItem = null;
                    this.applyFilter();
                });
            }

            if (this.els.clearBtn) {
                this.els.clearBtn.addEventListener("click", () => {
                    this.searchText = "";
                    this.activeCategory = "全部";
                    this.expandedItem = null;

                    if (this.els.searchInput) {
                        this.els.searchInput.value = "";
                    }

                    this.applyFilter();
                });
            }
        },

        applyFilter() {
            const keyword = this.searchText.toLowerCase();

            this.filteredData = this.data.filter(item => {
                if (!item) return false;

                const category = String(item.category || "");
                const question = String(item.question || "");
                const answer = String(item.rawAnswer || item.answer || item.answerHtml || "");
                const keywords = Array.isArray(item.keywords) ? item.keywords.join(" ") : "";

                const matchCategory =
                    this.activeCategory === "全部" ||
                    category === this.activeCategory;

                if (!matchCategory) return false;

                if (!keyword) return true;

                const searchBody = [
                    category,
                    question,
                    answer,
                    keywords
                ].join(" ").toLowerCase();

                return searchBody.includes(keyword);
            });

            if (this.expandedItem && !this.filteredData.includes(this.expandedItem)) {
                this.expandedItem = null;
            }

            this.renderCount();
            this.renderCategories();
            this.renderList();
        },

        renderCount() {
            if (!this.els.countBox) return;

            const total = this.data.length;
            const current = this.filteredData.length;
            const keyword = this.searchText.trim();
            const category = this.activeCategory;

            const parts = [
                `<span class="qa-count-pill">总问题数：<strong>${total}</strong></span>`,
                `<span class="qa-count-pill">当前显示：<strong>${current}</strong></span>`
            ];

            if (category && category !== "全部") {
                parts.push(
                    `<span class="qa-count-pill qa-count-category">当前分类：${this.escapeHtml(category)}</span>`
                );
            }

            if (keyword) {
                parts.push(
                    `<span class="qa-count-pill qa-count-keyword">搜索关键词：${this.escapeHtml(keyword)}</span>`
                );
            }

            this.els.countBox.innerHTML = parts.join("");
        },

        renderCategories() {
            if (!this.els.categoryBox) return;

            this.els.categoryBox.innerHTML = "";

            this.categories.forEach(category => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "category-btn";
                button.textContent = category;
                button.dataset.category = category;

                if (category === this.activeCategory) {
                    button.classList.add("active");
                    button.setAttribute("aria-pressed", "true");
                } else {
                    button.setAttribute("aria-pressed", "false");
                }

                button.addEventListener("click", () => {
                    const nextCategory = button.dataset.category || "全部";

                    this.activeCategory = nextCategory;
                    this.expandedItem = null;
                    this.applyFilter();
                });

                this.els.categoryBox.appendChild(button);
            });
        },

        renderList() {
            if (!this.els.list) return;

            this.els.list.innerHTML = "";

            if (!this.filteredData.length) {
                const empty = document.createElement("div");
                empty.className = "empty-tip qa-empty";
                empty.textContent = "没有找到相关问答。";
                this.els.list.appendChild(empty);
                return;
            }

            this.filteredData.forEach(item => {
                this.els.list.appendChild(this.createQAItem(item));
            });
        },

        createQAItem(item) {
            const wrap = document.createElement("div");
            wrap.className = "qa-item";

            if (item.category) {
                const category = document.createElement("div");
                category.className = "qa-category";
                category.textContent = item.category;
                wrap.appendChild(category);
            }

            const question = document.createElement("div");
            question.className = "qa-question";
            question.textContent = item.question || "";
            wrap.appendChild(question);

            const answer = document.createElement("div");
            answer.className = "qa-answer";

            const answerText = this.getAnswerText(item);
            const shouldCollapse = this.shouldCollapseAnswer(answerText);
            const isExpanded = this.expandedItem === item;

            const content = document.createElement("div");
            content.className = "qa-answer-content";

            if (shouldCollapse && !isExpanded) {
                content.classList.add("qa-answer-preview");
                content.innerHTML = this.renderAnswer(this.getPreviewAnswer(answerText));
            } else if (answerText) {
                content.innerHTML = this.renderAnswer(answerText);
            } else if (item.answerHtml) {
                content.innerHTML = this.fixExistingHtml(item.answerHtml);
            } else {
                content.innerHTML = "";
            }

            answer.appendChild(content);

            if (shouldCollapse) {
                const toggleRow = document.createElement("div");
                toggleRow.className = "qa-answer-toggle-row";

                const toggleBtn = document.createElement("button");
                toggleBtn.type = "button";
                toggleBtn.className = "qa-answer-toggle-btn";
                toggleBtn.textContent = isExpanded ? "收起" : "显示全部";

                toggleBtn.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (this.expandedItem === item) {
                        this.expandedItem = null;
                    } else {
                        this.expandedItem = item;
                    }

                    this.renderList();
                });

                toggleRow.appendChild(toggleBtn);
                answer.appendChild(toggleRow);
            }

            wrap.appendChild(answer);

            return wrap;
        },

        getAnswerText(item) {
            if (!item) {
                return "";
            }

            return String(
                item.rawAnswer ||
                item.answer ||
                ""
            );
        },

        shouldCollapseAnswer(value) {
            const text = String(value || "");
            const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            const lineCount = normalized.split("\n").length;

            return text.length > this.answerPreviewLength || lineCount > this.answerPreviewLineCount;
        },

        getPreviewAnswer(value) {
            const text = String(value || "");
            const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            const lines = normalized.split("\n");

            let previewLines = [];
            let currentLength = 0;

            for (const line of lines) {
                if (previewLines.length >= this.answerPreviewLineCount) {
                    break;
                }

                const nextLength = currentLength + line.length;

                if (nextLength > this.answerPreviewLength) {
                    const remainLength = Math.max(this.answerPreviewLength - currentLength, 20);
                    previewLines.push(line.slice(0, remainLength).trimEnd());
                    break;
                }

                previewLines.push(line);
                currentLength = nextLength;
            }

            let preview = previewLines.join("\n").trimEnd();

            if (!preview) {
                preview = normalized.slice(0, this.answerPreviewLength).trimEnd();
            }

            if (preview.length > this.answerPreviewLength) {
                preview = preview.slice(0, this.answerPreviewLength).trimEnd();
            }

            return preview + "\n……";
        },

        renderAnswer(value) {
            let html = this.escapeHtml(String(value || ""));

            html = this.autoLink(html);

            html = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            html = html.replace(/\n/g, "<br>");

            return html;
        },

        autoLink(html) {
            return html.replace(
                /(https?:\/\/[^\s<>"']+)/g,
                url => {
                    const cleanUrl = url;
                    const href = this.escapeAttribute(cleanUrl);
                    const displayUrl = this.insertWordBreaks(cleanUrl);

                    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
                }
            );
        },

        insertWordBreaks(value) {
            const escaped = this.escapeHtml(String(value || ""));

            return escaped
                .replace(/\//g, "/<wbr>")
                .replace(/\./g, ".<wbr>")
                .replace(/\?/g, "?<wbr>")
                .replace(/&amp;/g, "&amp;<wbr>")
                .replace(/=/g, "=<wbr>")
                .replace(/-/g, "-<wbr>")
                .replace(/_/g, "_<wbr>")
                .replace(/%/g, "%<wbr>");
        },

        fixExistingHtml(html) {
            const box = document.createElement("div");
            box.innerHTML = String(html || "");

            box.querySelectorAll("a").forEach(a => {
                const href = a.getAttribute("href") || a.textContent || "";

                a.setAttribute("href", href);
                a.setAttribute("target", "_blank");
                a.setAttribute("rel", "noopener noreferrer");
                a.innerHTML = this.insertWordBreaks(a.textContent || href);
            });

            return box.innerHTML;
        },

        escapeHtml(text) {
            return String(text ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        escapeAttribute(text) {
            return String(text ?? "")
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
    };

    window.QAModule = QAModule;
})();
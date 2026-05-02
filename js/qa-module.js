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

        answerPreviewLength: 90,
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

            this.createCountBox();

            this.data = this.getQAData();
            this.buildCategories();
            this.bindEvents();
            this.applyFilter();
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
            const keywordRaw = this.searchText.trim();
            const keyword = keywordRaw.toLowerCase();
            const normalizedKeyword = this.normalizeSearchText(keywordRaw);
            const keywordTokens = this.splitSearchTokens(keywordRaw);

            this.filteredData = this.data
                .map(item => {
                    if (!item) {
                        return {
                            item,
                            score: 0,
                            matched: false
                        };
                    }

                    const category = String(item.category || "");
                    const question = String(item.question || "");
                    const answer = String(item.rawAnswer || item.answer || item.answerHtml || "");
                    const keywords = Array.isArray(item.keywords) ? item.keywords.join(" ") : "";

                    const matchCategory =
                        this.activeCategory === "全部" ||
                        category === this.activeCategory;

                    if (!matchCategory) {
                        return {
                            item,
                            score: 0,
                            matched: false
                        };
                    }

                    if (!keywordRaw) {
                        return {
                            item,
                            score: 1,
                            matched: true
                        };
                    }

                    const searchBody = [
                        category,
                        question,
                        answer,
                        keywords
                    ].join(" ").toLowerCase();

                    const normalizedBody = this.normalizeSearchText(searchBody);
                    const normalizedQuestion = this.normalizeSearchText(question);
                    const normalizedKeywords = this.normalizeSearchText(keywords);
                    const normalizedCategory = this.normalizeSearchText(category);
                    const normalizedAnswer = this.normalizeSearchText(answer);

                    let score = 0;

                    if (searchBody.includes(keyword)) {
                        score += 80;
                    }

                    if (normalizedKeyword && normalizedBody.includes(normalizedKeyword)) {
                        score += 120;
                    }

                    if (normalizedKeyword && normalizedQuestion.includes(normalizedKeyword)) {
                        score += 180;
                    }

                    if (normalizedKeyword && normalizedKeywords.includes(normalizedKeyword)) {
                        score += 140;
                    }

                    const simpleKeyword = this.removeQuestionWords(normalizedKeyword);
                    const simpleQuestion = this.removeQuestionWords(normalizedQuestion);

                    if (simpleKeyword && simpleQuestion) {
                        if (simpleQuestion.includes(simpleKeyword)) {
                            score += 160;
                        }

                        if (simpleKeyword.includes(simpleQuestion)) {
                            score += 160;
                        }

                        const similarity = this.getTextSimilarity(simpleKeyword, simpleQuestion);

                        if (similarity >= 0.78) {
                            score += 130;
                        } else if (similarity >= 0.6) {
                            score += 90;
                        } else if (similarity >= 0.42) {
                            score += 45;
                        }
                    }

                    keywordTokens.forEach(token => {
                        const t = this.normalizeSearchText(token);

                        if (t.length < 2) return;

                        if (normalizedQuestion.includes(t)) {
                            score += Math.min(t.length * 10, 70);
                        }

                        if (normalizedKeywords.includes(t)) {
                            score += Math.min(t.length * 9, 60);
                        }

                        if (normalizedCategory.includes(t)) {
                            score += 16;
                        }

                        if (normalizedAnswer.includes(t)) {
                            score += Math.min(t.length * 3, 25);
                        }
                    });

                    const slices = this.getChineseSlices(normalizedKeyword);

                    slices.forEach(slice => {
                        if (slice.length < 2) return;

                        if (normalizedQuestion.includes(slice)) {
                            score += Math.min(slice.length * 8, 55);
                        } else if (normalizedKeywords.includes(slice)) {
                            score += Math.min(slice.length * 7, 45);
                        } else if (normalizedAnswer.includes(slice)) {
                            score += Math.min(slice.length * 2, 16);
                        }
                    });

                    return {
                        item,
                        score,
                        matched: score > 0
                    };
                })
                .filter(entry => entry.matched)
                .sort((a, b) => b.score - a.score)
                .map(entry => entry.item);

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

        normalizeSearchText(value) {
            return String(value || "")
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[，。！？、,.!?;；:：()（）[\]【】"'“”‘’《》<>\/\\|_\-—]/g, "");
        },

        removeQuestionWords(value) {
            return String(value || "")
                .replace(/为什么/g, "")
                .replace(/怎么回事/g, "")
                .replace(/咋回事/g, "")
                .replace(/怎么办/g, "")
                .replace(/咋办/g, "")
                .replace(/怎么/g, "")
                .replace(/如何/g, "")
                .replace(/能不能/g, "")
                .replace(/可以吗/g, "")
                .replace(/是什么/g, "")
                .replace(/在哪/g, "")
                .replace(/哪里/g, "")
                .replace(/有没有/g, "")
                .replace(/为啥/g, "")
                .replace(/咋/g, "")
                .replace(/吗/g, "")
                .replace(/呢/g, "");
        },

        splitSearchTokens(value) {
            const raw = String(value || "");

            const basicTokens = raw
                .replace(/[，。！？、,.!?;；:：()（）[\]【】"'“”‘’《》<>\/\\|_\-—]/g, " ")
                .split(/\s+/)
                .map(item => item.trim())
                .filter(Boolean);

            const extraTokens = [];

            const commonWords = [
                "光影设置",
                "光影界面",
                "光影设置界面",
                "设置界面空白",
                "界面空白",
                "菜单空白",
                "可以盲点",
                "盲点",
                "空白",
                "光影",
                "Iris",
                "YSM",
                "VOXY",
                "PCL2",
                "HMCL",
                "安装失败",
                "整合包",
                "服务端",
                "服务器",
                "崩溃",
                "闪退",
                "卡顿",
                "内存",
                "手机",
                "下载",
                "报错",
                "缺少模组",
                "TACZ",
                "Java",
                "显卡",
                "驱动",
                "联机",
                "启动失败",
                "打不开",
                "进不去"
            ];

            commonWords.forEach(word => {
                if (raw.toLowerCase().includes(word.toLowerCase())) {
                    extraTokens.push(word);
                }
            });

            return Array.from(new Set(basicTokens.concat(extraTokens)));
        },

        getChineseSlices(text) {
            const value = String(text || "");
            const result = new Set();

            if (!value) {
                return [];
            }

            for (let len = 2; len <= 8; len++) {
                for (let i = 0; i <= value.length - len; i++) {
                    const slice = value.slice(i, i + len);

                    if (slice && !this.isMostlyQuestionWords(slice)) {
                        result.add(slice);
                    }
                }
            }

            return Array.from(result);
        },

        isMostlyQuestionWords(value) {
            const text = String(value || "");

            const useless = [
                "怎么",
                "怎么办",
                "为什么",
                "如何",
                "可以吗",
                "能不能",
                "是什么",
                "回事",
                "咋办",
                "咋回事"
            ];

            return useless.some(word => text === word);
        },

        getTextSimilarity(a, b) {
            const textA = String(a || "");
            const textB = String(b || "");

            if (!textA || !textB) {
                return 0;
            }

            const shortText = textA.length <= textB.length ? textA : textB;
            const longText = textA.length > textB.length ? textA : textB;

            let hit = 0;

            for (const char of shortText) {
                if (longText.includes(char)) {
                    hit++;
                }
            }

            return hit / Math.max(shortText.length, 1);
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
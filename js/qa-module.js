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
        searchValue: "",

        elements: {
            list: null,
            categoryBox: null,
            searchInput: null,
            clearBtn: null
        },

        init(options = {}) {
            this.config = {
                ...this.config,
                ...options
            };

            this.data = Array.isArray(window.QA_DATA)
                ? window.QA_DATA
                : (Array.isArray(window.qaData) ? window.qaData : []);

            this.elements.list = document.querySelector(this.config.listSelector);
            this.elements.categoryBox = document.querySelector(this.config.categorySelector);
            this.elements.searchInput = document.querySelector(this.config.searchSelector);
            this.elements.clearBtn = document.querySelector(this.config.clearSelector);

            if (!this.elements.list) {
                console.error("QAModule: 找不到问答列表容器");
                return;
            }

            this.buildCategories();
            this.bindEvents();
            this.applyFilterAndRender();
        },

        buildCategories() {
            const set = new Set();
            this.data.forEach(item => {
                if (item && item.category) {
                    set.add(item.category);
                }
            });

            this.categories = ["全部", ...Array.from(set)];
        },

        bindEvents() {
            if (this.elements.searchInput) {
                this.elements.searchInput.addEventListener("input", (e) => {
                    this.searchValue = String(e.target.value || "").trim();
                    this.applyFilterAndRender();
                });
            }

            if (this.elements.clearBtn) {
                this.elements.clearBtn.addEventListener("click", () => {
                    this.searchValue = "";
                    if (this.elements.searchInput) {
                        this.elements.searchInput.value = "";
                    }
                    this.activeCategory = "全部";
                    this.applyFilterAndRender();
                });
            }
        },

        applyFilterAndRender() {
            const search = this.searchValue.toLowerCase();

            this.filteredData = this.data.filter(item => {
                if (!item) return false;

                const categoryMatch =
                    this.activeCategory === "全部" ||
                    item.category === this.activeCategory;

                if (!categoryMatch) return false;

                if (!search) return true;

                const question = String(item.question || "").toLowerCase();
                const category = String(item.category || "").toLowerCase();
                const answer = String(item.rawAnswer || item.answer || "").toLowerCase();
                const keywords = Array.isArray(item.keywords)
                    ? item.keywords.join(" ").toLowerCase()
                    : "";

                return (
                    question.includes(search) ||
                    category.includes(search) ||
                    answer.includes(search) ||
                    keywords.includes(search)
                );
            });

            this.renderCategories();
            this.renderList();
        },

        renderCategories() {
            if (!this.elements.categoryBox) return;

            this.elements.categoryBox.innerHTML = "";

            this.categories.forEach(category => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "category-btn" + (category === this.activeCategory ? " active" : "");
                btn.textContent = category;

                btn.addEventListener("click", () => {
                    this.activeCategory = category;
                    this.applyFilterAndRender();
                });

                this.elements.categoryBox.appendChild(btn);
            });
        },

        renderList() {
            const list = this.elements.list;
            if (!list) return;

            list.innerHTML = "";

            if (!this.filteredData.length) {
                const empty = document.createElement("div");
                empty.className = "qa-empty";
                empty.textContent = "没有找到匹配的问答。";
                list.appendChild(empty);
                return;
            }

            this.filteredData.forEach(item => {
                const card = document.createElement("div");
                card.className = "qa-card";

                const category = document.createElement("div");
                category.className = "qa-category";
                category.textContent = item.category || "未分类";

                const question = document.createElement("h3");
                question.className = "qa-question";
                question.textContent = item.question || "";

                const answer = document.createElement("div");
                answer.className = "qa-answer";

                // 这里是关键：使用 innerHTML 才能让 <a> 可点击
                // 同时把换行转成 <br>，不然显示会挤成一行
                const answerHtml = item.answerHtml || this.linkify(String(item.answer || ""));
                answer.innerHTML = this.preserveLineBreaks(answerHtml);

                card.appendChild(category);
                card.appendChild(question);
                card.appendChild(answer);

                if (Array.isArray(item.keywords) && item.keywords.length) {
                    const keywordBox = document.createElement("div");
                    keywordBox.className = "qa-keywords";

                    item.keywords.forEach(keyword => {
                        const tag = document.createElement("span");
                        tag.className = "qa-keyword";
                        tag.textContent = keyword;
                        keywordBox.appendChild(tag);
                    });

                    card.appendChild(keywordBox);
                }

                list.appendChild(card);
            });
        },

        preserveLineBreaks(html) {
            return String(html).replace(/\n/g, "<br>");
        },

        linkify(text) {
            const escaped = this.escapeHtml(text);
            const urlRegex = /(https?:\/\/[^\s<]+)/g;

            return escaped.replace(urlRegex, function (url) {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            });
        },

        escapeHtml(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    };

    window.QAModule = QAModule;
})();

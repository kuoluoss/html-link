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

        els: {
            list: null,
            categoryBox: null,
            searchInput: null,
            clearBtn: null
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

            this.data = this.getQAData();
            this.buildCategories();
            this.bindEvents();
            this.applyFilter();
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
                    this.applyFilter();
                });
            }

            if (this.els.clearBtn) {
                this.els.clearBtn.addEventListener("click", () => {
                    this.searchText = "";
                    this.activeCategory = "全部";

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

                // keywords 只参与搜索，不显示到页面上
                const searchBody = [
                    category,
                    question,
                    answer,
                    keywords
                ].join(" ").toLowerCase();

                return searchBody.includes(keyword);
            });

            this.renderCategories();
            this.renderList();
        },

        renderCategories() {
            if (!this.els.categoryBox) return;

            this.els.categoryBox.innerHTML = "";

            this.categories.forEach(category => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "category-btn";
                button.textContent = category;

                if (category === this.activeCategory) {
                    button.classList.add("active");
                }

                button.addEventListener("click", () => {
                    this.activeCategory = category;
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
                empty.className = "qa-empty";
                empty.textContent = "没有找到相关问答。";
                this.els.list.appendChild(empty);
                return;
            }

            this.filteredData.forEach(item => {
                this.els.list.appendChild(this.createQAItem(item));
            });
        },

        createQAItem(item) {
            /*
             * 显示顺序：
             * 1. 分类标签
             * 2. 问题
             * 3. 答案
             *
             * keywords 不显示。
             */
            const wrap = document.createElement("div");
            wrap.className = "qa-item";

            // 分类标签放最上面
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

            const answerText =
                item.answerHtml ||
                item.rawAnswer ||
                item.answer ||
                "";

            answer.innerHTML = this.renderAnswer(answerText, Boolean(item.answerHtml));
            wrap.appendChild(answer);

            return wrap;
        },

        renderAnswer(value, isHtml) {
            let html;

            if (isHtml) {
                html = String(value || "");
            } else {
                html = this.escapeHtml(String(value || ""));
                html = this.autoLink(html);
            }

            html = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            html = html.replace(/\n/g, "<br>");

            return html;
        },

        autoLink(html) {
            return html.replace(
                /(https?:\/\/[^\s<>"']+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
            );
        },

        escapeHtml(text) {
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    };

    window.QAModule = QAModule;
})();

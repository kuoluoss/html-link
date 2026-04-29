window.QAModule = (() => {
    let qaList = [];
    let currentCategory = "全部";

    let listEl = null;
    let categoryEl = null;
    let searchEl = null;
    let clearBtn = null;
    let countEl = null;

    function init(options = {}) {
        qaList = window.QA_DATA || [];

        listEl = document.querySelector(options.listSelector || "#qaList");
        categoryEl = document.querySelector(options.categorySelector || "#categoryBox");
        searchEl = document.querySelector(options.searchSelector || "#searchInput");
        clearBtn = document.querySelector(options.clearSelector || "#clearSearchBtn");

        if (!listEl || !categoryEl || !searchEl) {
            console.error("QAModule 初始化失败：缺少必要容器");
            return;
        }

        createCountElement();
        renderCategories();
        bindEvents();
        renderList();
    }

    function createCountElement() {
        const old = document.querySelector("#qaCountText");

        if (old) {
            old.remove();
        }

        const searchArea = searchEl.closest(".search-box") || searchEl.parentElement;

        countEl = document.createElement("div");
        countEl.className = "qa-count";
        countEl.id = "qaCountText";
        countEl.textContent = `共 ${qaList.length} 个问题`;

        searchArea.insertAdjacentElement("afterend", countEl);
    }

    function renderCategories() {
        const categories = [
            "全部",
            ...new Set(qaList.map(item => item.category || "未分类"))
        ];

        categoryEl.innerHTML = categories.map(category => `
            <button class="category-btn ${category === currentCategory ? "active" : ""}" data-category="${escapeHtml(category)}">
                ${escapeHtml(category)}
            </button>
        `).join("");

        categoryEl.querySelectorAll(".category-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                currentCategory = btn.dataset.category;

                categoryEl.querySelectorAll(".category-btn").forEach(item => {
                    item.classList.remove("active");
                });

                btn.classList.add("active");

                renderList();
            });
        });
    }

    function bindEvents() {
        const handler = window.AppUtils.debounce(renderList, 150);

        searchEl.addEventListener("input", handler);

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                searchEl.value = "";
                renderList();
                searchEl.focus();
            });
        }
    }

    function renderList() {
        const keyword = normalize(searchEl.value);

        const result = qaList.filter(item => {
            const matchCategory =
                currentCategory === "全部" ||
                (item.category || "未分类") === currentCategory;

            const text = normalize([
                item.category,
                item.question,
                item.answer,
                Array.isArray(item.keywords) ? item.keywords.join(" ") : item.keywords
            ].join(" "));

            const matchKeyword = !keyword || text.includes(keyword);

            return matchCategory && matchKeyword;
        });

        updateCount(result.length);

        if (!result.length) {
            listEl.innerHTML = `
                <div class="empty-tip">
                    没有找到相关问题，可以换一个关键词试试。
                </div>
            `;
            return;
        }

        listEl.innerHTML = result.map(item => `
            <div class="qa-item">
                <div class="qa-question">
                    <span class="qa-category">${escapeHtml(item.category || "未分类")}</span>
                    <strong>${escapeHtml(item.question || "")}</strong>
                </div>
                <div class="qa-answer">
                    ${formatAnswer(item.answer || "")}
                </div>
            </div>
        `).join("");
    }

    function updateCount(showCount) {
        if (!countEl) return;

        if (showCount === qaList.length) {
            countEl.textContent = `共 ${qaList.length} 个问题`;
        } else {
            countEl.textContent = `当前显示 ${showCount} / 共 ${qaList.length} 个问题`;
        }
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

    return {
        init
    };
})();

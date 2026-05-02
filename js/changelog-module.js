window.ChangelogModule = (() => {
    let root = null;
    let detailModal = null;
    let historyModal = null;

    const VISIBLE_COUNT = 2;

    function init(options = {}) {
        root = document.querySelector(options.selector || "#changelogBox");

        if (!root) {
            console.error("ChangelogModule 找不到容器");
            return;
        }

        createDetailModal();
        createHistoryModal();
        render();
    }

    function getData() {
        return Array.isArray(window.CHANGELOG_DATA) ? window.CHANGELOG_DATA : [];
    }

    function render() {
        const data = getData();

        if (!data.length) {
            root.innerHTML = `<div class="empty-tip">暂无更新日志。</div>`;
            return;
        }

        const visibleData = data.slice(0, VISIBLE_COUNT);
        const hiddenCount = Math.max(data.length - VISIBLE_COUNT, 0);

        root.innerHTML = `
            ${hiddenCount > 0 ? `
                <div class="changelog-footer">
                    <button
                        class="changelog-all-btn"
                        id="openAllChangelogBtn"
                        type="button"
                        title="查看全部更新日志和详情"
                    >
                        查看全部日志
                    </button>
                </div>
            ` : ""}

            <div class="changelog-list">
                ${visibleData.map((item, index) => renderChangelogItem(item, index)).join("")}
            </div>
        `;

        bindVisibleEvents();

        const allBtn = root.querySelector("#openAllChangelogBtn");

        if (allBtn && hiddenCount > 0) {
            allBtn.addEventListener("click", openHistory);
        }
    }

    function renderChangelogItem(item, index) {
        return `
            <div class="changelog-item" data-index="${index}">
                <div class="changelog-title-row">
                    <span class="changelog-date">${escapeHtml(item.date)}</span>
                    <strong>${escapeHtml(item.title)}</strong>
                    <button class="changelog-detail-btn" data-index="${index}" type="button">查看详情</button>
                </div>
            </div>
        `;
    }

    function bindVisibleEvents() {
        root.querySelectorAll(".changelog-detail-btn").forEach(btn => {
            btn.addEventListener("click", event => {
                event.stopPropagation();

                const index = Number(btn.dataset.index);
                const data = getData();

                openDetail(data[index]);
            });
        });

        root.querySelectorAll(".changelog-item").forEach(item => {
            item.addEventListener("click", () => {
                const index = Number(item.dataset.index);
                const data = getData();

                openDetail(data[index]);
            });
        });
    }

    function createDetailModal() {
        if (detailModal) {
            return;
        }

        detailModal = document.createElement("div");
        detailModal.className = "changelog-modal-mask";
        detailModal.innerHTML = `
            <div class="changelog-modal" role="dialog" aria-modal="true" aria-labelledby="changelogModalTitle">
                <div class="changelog-modal-header">
                    <div>
                        <h2 id="changelogModalTitle">更新详情</h2>
                        <p id="changelogModalDate"></p>
                    </div>
                    <button class="modal-close-btn" id="closeChangelogBtn" type="button" aria-label="关闭">×</button>
                </div>

                <div class="changelog-modal-body" id="changelogModalBody"></div>
            </div>
        `;

        document.body.appendChild(detailModal);

        detailModal.querySelector("#closeChangelogBtn").addEventListener("click", closeDetail);

        detailModal.addEventListener("click", event => {
            if (event.target === detailModal) {
                closeDetail();
            }
        });
    }

    function createHistoryModal() {
        if (historyModal) {
            return;
        }

        historyModal = document.createElement("div");
        historyModal.className = "changelog-modal-mask changelog-history-modal-mask";
        historyModal.innerHTML = `
            <div class="changelog-modal changelog-history-modal" role="dialog" aria-modal="true" aria-labelledby="changelogHistoryTitle">
                <div class="changelog-modal-header">
                    <div>
                        <h2 id="changelogHistoryTitle">全部历史日志</h2>
                        <p>这里显示全部更新日志以及每条日志的详细内容。</p>
                    </div>
                    <button class="modal-close-btn" id="closeChangelogHistoryBtn" type="button" aria-label="关闭">×</button>
                </div>

                <div class="changelog-modal-body" id="changelogHistoryBody"></div>
            </div>
        `;

        document.body.appendChild(historyModal);

        historyModal.querySelector("#closeChangelogHistoryBtn").addEventListener("click", closeHistory);

        historyModal.addEventListener("click", event => {
            if (event.target === historyModal) {
                closeHistory();
            }
        });
    }

    function openDetail(item) {
        if (!item || !detailModal) {
            return;
        }

        closeHistory(false);

        detailModal.querySelector("#changelogModalTitle").textContent = item.title || "更新详情";
        detailModal.querySelector("#changelogModalDate").textContent = item.date || "";

        const content = normalizeContent(item.content);

        detailModal.querySelector("#changelogModalBody").innerHTML = `
            ${content.length ? `
                <ul>
                    ${content.map(line => `<li>${escapeHtml(line)}</li>`).join("")}
                </ul>
            ` : `
                <div class="empty-tip">这条日志暂无详细内容。</div>
            `}
        `;

        detailModal.classList.add("show");
        document.body.classList.add("modal-open");
    }

    function closeDetail(needUnlock = true) {
        if (!detailModal) {
            return;
        }

        detailModal.classList.remove("show");

        if (needUnlock) {
            unlockBodyIfNoModal();
        }
    }

    function openHistory() {
        if (!historyModal) {
            return;
        }

        closeDetail(false);

        const data = getData();
        const body = historyModal.querySelector("#changelogHistoryBody");

        if (!data.length) {
            body.innerHTML = `<div class="empty-tip">暂无更新日志。</div>`;
        } else {
            body.innerHTML = `
                <div class="changelog-expanded-list">
                    ${data.map((item, index) => renderExpandedHistoryItem(item, index)).join("")}
                </div>
            `;
        }

        historyModal.classList.add("show");
        document.body.classList.add("modal-open");
    }

    function renderExpandedHistoryItem(item, index) {
        const content = normalizeContent(item.content);

        return `
            <article class="changelog-expanded-item" data-index="${index}">
                <div class="changelog-expanded-head">
                    <span class="changelog-date">${escapeHtml(item.date)}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                </div>

                <div class="changelog-expanded-content">
                    ${content.length ? `
                        <ul>
                            ${content.map(line => `<li>${escapeHtml(line)}</li>`).join("")}
                        </ul>
                    ` : `
                        <div class="empty-tip">这条日志暂无详细内容。</div>
                    `}
                </div>
            </article>
        `;
    }

    function closeHistory(needUnlock = true) {
        if (!historyModal) {
            return;
        }

        historyModal.classList.remove("show");

        if (needUnlock) {
            unlockBodyIfNoModal();
        }
    }

    function normalizeContent(content) {
        if (typeof content === "string") {
            return content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        }

        if (Array.isArray(content)) {
            return content.map(line => String(line ?? "").trim()).filter(Boolean);
        }

        return [];
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

        return String(value ?? "")
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

window.ChangelogModule = (() => {
    let root = null;
    let modal = null;

    function init(options = {}) {
        root = document.querySelector(options.selector || "#changelogBox");

        if (!root) {
            console.error("ChangelogModule 找不到容器");
            return;
        }

        createModal();
        render();
    }

    function render() {
        const data = window.CHANGELOG_DATA || [];

        if (!data.length) {
            root.innerHTML = `<div class="empty-tip">暂无更新日志。</div>`;
            return;
        }

        root.innerHTML = `
            <div class="changelog-list">
                ${data.map((item, index) => `
                    <div class="changelog-item" data-index="${index}">
                        <div class="changelog-title-row">
                            <span class="changelog-date">${escapeHtml(item.date)}</span>
                            <strong>${escapeHtml(item.title)}</strong>
                            <button class="changelog-detail-btn" data-index="${index}">查看详情</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        root.querySelectorAll(".changelog-detail-btn").forEach(btn => {
            btn.addEventListener("click", event => {
                event.stopPropagation();
                const index = Number(btn.dataset.index);
                openDetail(data[index]);
            });
        });

        root.querySelectorAll(".changelog-item").forEach(item => {
            item.addEventListener("click", () => {
                const index = Number(item.dataset.index);
                openDetail(data[index]);
            });
        });
    }

    function createModal() {
        modal = document.createElement("div");
        modal.className = "changelog-modal-mask";
        modal.innerHTML = `
            <div class="changelog-modal">
                <div class="changelog-modal-header">
                    <div>
                        <h2 id="changelogModalTitle">更新详情</h2>
                        <p id="changelogModalDate"></p>
                    </div>
                    <button class="modal-close-btn" id="closeChangelogBtn">×</button>
                </div>

                <div class="changelog-modal-body" id="changelogModalBody"></div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#closeChangelogBtn").addEventListener("click", closeDetail);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeDetail();
            }
        });
    }

    function openDetail(item) {
        if (!item) return;

        modal.querySelector("#changelogModalTitle").textContent = item.title || "更新详情";
        modal.querySelector("#changelogModalDate").textContent = item.date || "";

        let content = item.content || [];

        if (typeof content === "string") {
            content = content.split(/\r?\n/).filter(Boolean);
        }

        if (!Array.isArray(content)) {
            content = [];
        }

        modal.querySelector("#changelogModalBody").innerHTML = `
            <ul>
                ${content.map(line => `<li>${escapeHtml(line)}</li>`).join("")}
            </ul>
        `;

        modal.classList.add("show");
        document.body.classList.add("modal-open");
    }

    function closeDetail() {
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

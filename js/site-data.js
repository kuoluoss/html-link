window.SiteData = (() => {
    async function load() {
        const baseUrl = window.SITE_CONFIG && window.SITE_CONFIG.ADMIN_API_BASE_URL;

        if (!baseUrl) {
            return false;
        }

        try {
            const apiBase = String(baseUrl).replace(/\/+$/, "");
            const version = localStorage.getItem("site_data_version") || "";
            const response = await fetch(`${apiBase}/api/public/site-data?t=${Date.now()}&v=${encodeURIComponent(version)}`, {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (!result || !result.ok || !result.data) {
                throw new Error("接口没有返回站点数据");
            }

            applyData(result.data);
            return true;
        } catch (error) {
            console.warn("SiteData 加载在线数据失败，继续使用本地静态数据：", error);
            return false;
        }
    }

    function applyData(data) {
        if (data.download && typeof data.download === "object") {
            window.DOWNLOAD_CONFIG = Object.assign({}, window.DOWNLOAD_CONFIG || {}, data.download);
        }

        if (Array.isArray(data.changelog) && data.changelog.length > 0) {
            window.CHANGELOG_DATA = data.changelog;
        }

        if (Array.isArray(data.qaCategories)) {
            window.QA_CATEGORIES = data.qaCategories
                .map(item => typeof item === "string" ? item : item && item.name)
                .filter(Boolean);
        }

        if (Array.isArray(data.qa) && data.qa.length > 0) {
            window.QA_DATA = data.qa.map(normalizeQAItem);
            window.qaData = window.QA_DATA;
        }
    }

    function normalizeQAItem(item) {
        const answer = String(item && item.answer || "");

        return Object.assign({}, item, {
            answer,
            rawAnswer: answer,
            answerHtml: linkify(answer),
            keywords: Array.isArray(item && item.keywords) ? item.keywords : []
        });
    }

    function linkify(text) {
        const escaped = escapeHtml(text);
        const urlRegex = /(https?:\/\/[^\s<]+)/g;

        return escaped.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    return {
        load,
        applyData
    };
})();

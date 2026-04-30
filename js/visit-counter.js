window.VisitCounter = (() => {
    const CONFIG = {
        apiUrl: "https://throbbing-hill-4a66.sansanjx.workers.dev/visit?site=qce-v5-faq-page",
        siteId: "qce-v5-faq-page",
        timeout: 8000
    };

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }

    function formatNumber(value) {
        const number = Number(value);

        if (Number.isNaN(number)) {
            return value;
        }

        return number.toLocaleString("zh-CN");
    }

    async function fetchWithTimeout(url, timeout) {
        const controller = new AbortController();

        const timer = setTimeout(() => {
            controller.abort();
        }, timeout);

        try {
            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal
            });

            clearTimeout(timer);
            return response;
        } catch (error) {
            clearTimeout(timer);
            throw error;
        }
    }

    async function init() {
        const totalEl = document.getElementById("totalVisitCount");
        const todayEl = document.getElementById("todayVisitCount");

        if (!totalEl && !todayEl) {
            return;
        }

        try {
            const url = `${CONFIG.apiUrl}?site=${encodeURIComponent(CONFIG.siteId)}`;

            const response = await fetchWithTimeout(url, CONFIG.timeout);

            if (!response.ok) {
                throw new Error(`访问量接口请求失败：${response.status}`);
            }

            const data = await response.json();

            setText("totalVisitCount", formatNumber(data.total || 0));
            setText("todayVisitCount", formatNumber(data.today || 0));
        } catch (error) {
            console.error("访问量统计失败：", error);

            setText("totalVisitCount", "统计失败");
            setText("todayVisitCount", "统计失败");
        }
    }

    return {
        init
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    VisitCounter.init();
});

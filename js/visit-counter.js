(function () {
    var CONFIG = {
        apiUrl: "https://throbbing-hill-4a66.sansanjx.workers.dev/visit",
        siteId: "qce-v5-faq-page",
        timeout: 8000
    };

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }

    function showFailed() {
        setText("total-visits", "统计失败");
        setText("today-visits", "统计失败");
    }

    function updateCounter(data) {
        if (!data) {
            showFailed();
            return;
        }

        if (typeof data.total !== "undefined") {
            setText("total-visits", data.total);
        }

        if (typeof data.today !== "undefined") {
            setText("today-visits", data.today);
        }
    }

    function requestByXHR(url) {
        var xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);
        xhr.timeout = CONFIG.timeout;

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        updateCounter(data);
                    } catch (e) {
                        showFailed();
                    }
                } else {
                    showFailed();
                }
            }
        };

        xhr.onerror = function () {
            showFailed();
        };

        xhr.ontimeout = function () {
            showFailed();
        };

        xhr.send(null);
    }

    function initVisitCounter() {
        var url = CONFIG.apiUrl + "?site=" + encodeURIComponent(CONFIG.siteId) + "&t=" + new Date().getTime();
        requestByXHR(url);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initVisitCounter);
    } else {
        initVisitCounter();
    }
})();
window.AppUtils = {
    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    normalizeText(value) {
        return String(value ?? "")
            .toLowerCase()
            .replace(/\s+/g, "");
    },

    formatAnswerToHtml(value) {
        const escaped = this.escapeHtml(value);
        return escaped.replace(/\r?\n/g, "<br>");
    },

    debounce(fn, delay = 150) {
        let timer = null;

        return function (...args) {
            clearTimeout(timer);

            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }
};

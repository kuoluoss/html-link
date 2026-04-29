document.addEventListener("DOMContentLoaded", () => {
    safeInit("ChangelogModule", () => {
        window.ChangelogModule.init({
            selector: "#changelogBox"
        });
    });

    safeInit("QAModule", () => {
        window.QAModule.init({
            listSelector: "#qaList",
            categorySelector: "#categoryBox",
            searchSelector: "#searchInput",
            clearSelector: "#clearSearchBtn"
        });
    });

    safeInit("ExpertModule", () => {
        window.ExpertModule.init({
            selector: "#expertSystemBox"
        });
    });

    safeInit("ChatModule", () => {
        window.ChatModule.init();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".expert-modal-mask.show, .changelog-modal-mask.show, .chat-modal-mask.show")
                .forEach(modal => {
                    modal.classList.remove("show");
                });

            document.body.classList.remove("modal-open");
        }
    });
});

function safeInit(name, fn) {
    try {
        if (!window[name]) {
            console.error(`${name} 不存在，请检查 JS 引入顺序或文件路径`);
            return;
        }

        fn();
        console.log(`${name} 初始化完成`);
    } catch (error) {
        console.error(`${name} 初始化失败：`, error);
    }
}

/*
    =========================================================
    最新版整合包下载模块
    文件位置：js/download-module.js

    这个文件负责：
    1. 点击“点击下载最新版整合包”按钮后打开下载提示弹窗
    2. 点击“V1.1.0 客户端”下载客户端文件
    3. 点击“V1.1.0 服务端”下载服务端文件
    4. 点击关闭按钮、遮罩层、ESC 键关闭弹窗

    如果以后版本更新，只需要改 DOWNLOAD_CONFIG 里的内容。
    =========================================================
*/

(function () {
    "use strict";

    /*
        =====================================================
        下载配置区

        下次更新版本时，主要改这里：

        versionText:
            弹窗里展示的版本文字。

        clientUrl:
            客户端下载地址。

        serverUrl:
            服务端下载地址。

        backupUrl:
            备用网盘地址。
        =====================================================
    */
    const DOWNLOAD_CONFIG = {
        versionText: "V1.1.0",

        /*
            GitHub Release 文件直链格式一般是：
            https://github.com/用户名/仓库名/releases/download/标签名/文件名

            你的 release 标签是“更新”，所以这里用了：
            %E6%9B%B4%E6%96%B0

            文件名根据你截图里显示的是：
            Client-V1.10.zip
            Server-V1.10.zip
        */
        clientUrl: "https://github.com/kuoluoss/html-link/releases/download/%E6%9B%B4%E6%96%B0/Client-V1.10.zip",
        serverUrl: "https://github.com/kuoluoss/html-link/releases/download/%E6%9B%B4%E6%96%B0/Server-V1.10.zip",

        backupUrl: "https://pan.quark.cn/s/2e4df37051bf"
    };

    /*
        等页面 DOM 加载完成后再绑定事件。
        因为 index.html 里 script 使用了 defer，这里正常来说也可以直接执行。
        但加 DOMContentLoaded 更稳一点。
    */
    document.addEventListener("DOMContentLoaded", function () {
        const openBtn = document.getElementById("downloadLatestBtn");
        const modalMask = document.getElementById("downloadModalMask");
        const closeBtn = document.getElementById("downloadModalCloseBtn");
        const clientBtn = document.getElementById("downloadClientBtn");
        const serverBtn = document.getElementById("downloadServerBtn");

        /*
            如果页面上没有这些元素，说明当前页面没有使用下载模块。
            这里直接 return，避免报错影响其他功能。
        */
        if (!openBtn || !modalMask || !closeBtn || !clientBtn || !serverBtn) {
            return;
        }

        /*
            打开下载弹窗
        */
        function openDownloadModal() {
            modalMask.classList.add("show");
            modalMask.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
        }

        /*
            关闭下载弹窗
        */
        function closeDownloadModal() {
            modalMask.classList.remove("show");
            modalMask.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
        }

        /*
            打开下载链接

            这里使用 window.open，而不是直接 location.href。
            好处是：
            1. 不会把当前问答页面跳走
            2. 下载失败时，用户还能回到网页看提示
        */
        function openDownloadUrl(url) {
            window.open(url, "_blank", "noopener,noreferrer");
        }

        /*
            点击公告卡片里的“点击下载最新版整合包”
        */
        openBtn.addEventListener("click", function () {
            openDownloadModal();
        });

        /*
            点击右上角关闭按钮
        */
        closeBtn.addEventListener("click", function () {
            closeDownloadModal();
        });

        /*
            点击遮罩层关闭弹窗。
            注意：只有点到黑色遮罩本身才关闭，
            点弹窗内容不会关闭。
        */
        modalMask.addEventListener("click", function (event) {
            if (event.target === modalMask) {
                closeDownloadModal();
            }
        });

        /*
            按 ESC 键关闭弹窗
        */
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && modalMask.classList.contains("show")) {
                closeDownloadModal();
            }
        });

        /*
            下载客户端
        */
        clientBtn.addEventListener("click", function () {
            openDownloadUrl(DOWNLOAD_CONFIG.clientUrl);
        });

        /*
            下载服务端
        */
        serverBtn.addEventListener("click", function () {
            openDownloadUrl(DOWNLOAD_CONFIG.serverUrl);
        });
    });
})();
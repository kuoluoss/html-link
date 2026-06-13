(() => {
    const TOKEN_KEY = "site_admin_token";
    const DEFAULT_DOWNLOAD = {
        versionText: "V1.3.0",
        quarkUrl: "https://pan.quark.cn/s/d9f87296aeaf?pwd=WZjz",
        baiduUrl: "https://pan.baidu.com/s/1pVfiKZWmPeLv_-24EWWLig?pwd=7ayt",
        notice: "点击按钮跳转网盘下载，如果夸克点进去没文件，可以使用备用的百度网盘"
    };

    let siteData = createFallbackData();
    let activeTab = "download";
    let modalApply = null;
    let modalSync = null;
    let adminToken = "";
    let qaState = {
        search: "",
        category: "全部",
        page: 1,
        pageSize: 20
    };

    const els = {};

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        bindElements();
        bindEvents();

        if (!getApiBase()) {
            setStatus(els.loginStatus, "请先在 js/config.js 里配置 ADMIN_API_BASE_URL。", true);
            return;
        }

        localStorage.removeItem(TOKEN_KEY);
        showLogin();
    }

    function bindElements() {
        Object.assign(els, {
            loginCard: document.getElementById("loginCard"),
            adminPanel: document.getElementById("adminPanel"),
            adminPassword: document.getElementById("adminPassword"),
            loginBtn: document.getElementById("loginBtn"),
            loginStatus: document.getElementById("loginStatus"),
            saveStatus: document.getElementById("saveStatus"),
            reloadBtn: document.getElementById("reloadBtn"),
            logoutBtn: document.getElementById("logoutBtn"),
            saveAllBtn: document.getElementById("saveAllBtn"),
            tabButtons: Array.from(document.querySelectorAll(".admin-tab-btn")),
            panels: Array.from(document.querySelectorAll("[data-panel]")),
            downloadVersion: document.getElementById("downloadVersion"),
            quarkUrl: document.getElementById("quarkUrl"),
            baiduUrl: document.getElementById("baiduUrl"),
            downloadNotice: document.getElementById("downloadNotice"),
            addLogBtn: document.getElementById("addLogBtn"),
            changelogEditor: document.getElementById("changelogEditor"),
            addQaBtn: document.getElementById("addQaBtn"),
            qaSearch: document.getElementById("qaSearch"),
            qaCategoryFilter: document.getElementById("qaCategoryFilter"),
            qaPageSize: document.getElementById("qaPageSize"),
            qaEditor: document.getElementById("qaEditor"),
            qaPagination: document.getElementById("qaPagination"),
            addCategoryBtn: document.getElementById("addCategoryBtn"),
            categoryEditor: document.getElementById("categoryEditor"),
            modalMask: document.getElementById("adminModalMask"),
            modalTitle: document.getElementById("adminModalTitle"),
            modalBody: document.getElementById("adminModalBody"),
            closeModalBtn: document.getElementById("closeAdminModalBtn"),
            cancelModalBtn: document.getElementById("cancelAdminModalBtn"),
            applyModalBtn: document.getElementById("applyAdminModalBtn")
        });
    }

    function bindEvents() {
        document.addEventListener("click", handleCustomSelectDocumentClick);
        els.loginBtn.addEventListener("click", login);
        els.adminPassword.addEventListener("keydown", event => {
            if (event.key === "Enter") login();
        });
        els.reloadBtn.addEventListener("click", loadData);
        els.logoutBtn.addEventListener("click", logout);
        els.saveAllBtn.addEventListener("click", saveAll);
        els.addLogBtn.addEventListener("click", addLog);
        els.addQaBtn.addEventListener("click", addQA);
        els.addCategoryBtn.addEventListener("click", addCategory);
        els.qaSearch.addEventListener("input", () => {
            qaState.search = els.qaSearch.value;
            qaState.page = 1;
            renderQA();
        });
        els.qaCategoryFilter.addEventListener("change", () => {
            qaState.category = els.qaCategoryFilter.value;
            qaState.page = 1;
            renderQA();
        });
        els.qaPageSize.addEventListener("change", () => {
            qaState.pageSize = Number(els.qaPageSize.value) || 20;
            qaState.page = 1;
            renderQA();
        });
        els.tabButtons.forEach(btn => {
            btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
        });
        els.changelogEditor.addEventListener("click", handleChangelogAction);
        els.qaEditor.addEventListener("click", handleQAAction);
        els.qaPagination.addEventListener("click", handleQAPagination);
        els.categoryEditor.addEventListener("click", handleCategoryAction);
        els.closeModalBtn.addEventListener("click", closeModal);
        els.cancelModalBtn.addEventListener("click", closeModal);
        els.applyModalBtn.addEventListener("click", () => {
            if (typeof modalApply === "function") modalApply();
        });
        els.modalMask.addEventListener("click", event => {
            if (event.target === els.modalMask) closeModal();
        });
    }

    async function login() {
        const password = els.adminPassword.value.trim();

        if (!password) {
            setStatus(els.loginStatus, "请输入后台密码。", true);
            return;
        }

        setStatus(els.loginStatus, "正在登录...");

        try {
            const result = await apiFetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ password }),
                skipAuth: true
            });

            if (!result.ok || !result.token) {
                throw new Error(result.error || "登录失败。");
            }

            adminToken = result.token;
            localStorage.removeItem(TOKEN_KEY);
            els.adminPassword.value = "";
            showPanel();
            await loadData();
        } catch (error) {
            setStatus(els.loginStatus, error.message || String(error), true);
        }
    }

    async function logout() {
        try {
            await apiFetch("/api/admin/logout", { method: "POST" });
        } catch (error) {
            console.warn(error);
        }

        adminToken = "";
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
    }

    async function checkSession() {
        try {
            const result = await apiFetch("/api/admin/session");
            return Boolean(result.ok && result.loggedIn);
        } catch (error) {
            localStorage.removeItem(TOKEN_KEY);
            return false;
        }
    }

    async function loadData() {
        setStatus(els.saveStatus, "正在加载数据...");

        try {
            const result = await apiFetch("/api/admin/site-data");

            if (!result.ok || !result.data) {
                throw new Error(result.error || "加载失败。");
            }

            siteData = applyLocalFallback(normalizeData(result.data));
            renderAll();
            setStatus(els.saveStatus, "数据已加载。首次使用时请先点击“保存全部”，把当前静态数据写入 KV。", false, true);
        } catch (error) {
            setStatus(els.saveStatus, error.message || String(error), true);
        }
    }

    async function saveAll() {
        if (!els.modalMask.hidden && typeof modalSync === "function") {
            modalSync();
        }

        collectDownloadForm();
        setStatus(els.saveStatus, "正在保存...");

        try {
            const result = await apiFetch("/api/admin/site-data", {
                method: "PUT",
                body: JSON.stringify(siteData)
            });

            if (!result.ok || !result.data) {
                throw new Error(result.error || "保存失败。");
            }

            siteData = normalizeData(result.data);
            if (result.dataVersion || siteData.dataVersion) {
                localStorage.setItem("site_data_version", result.dataVersion || siteData.dataVersion);
            }
            renderAll();
            setStatus(
                els.saveStatus,
                result.verified === false ? "保存已提交，但 KV 读取可能仍在同步，等几秒刷新首页即可。" : "保存成功，首页刷新后会读取最新数据。",
                false,
                true
            );
        } catch (error) {
            setStatus(els.saveStatus, error.message || String(error), true);
        }
    }

    function setActiveTab(tab) {
        activeTab = tab || "download";
        els.tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === activeTab));
        els.panels.forEach(panel => {
            panel.hidden = panel.dataset.panel !== activeTab;
        });
    }

    function renderAll() {
        renderDownload();
        renderCategoryFilter();
        renderChangelog();
        renderQA();
        renderCategories();
        setActiveTab(activeTab);
    }

    function renderDownload() {
        els.downloadVersion.value = siteData.download.versionText || "";
        els.quarkUrl.value = siteData.download.quarkUrl || "";
        els.baiduUrl.value = siteData.download.baiduUrl || "";
        els.downloadNotice.value = siteData.download.notice || "";
    }

    function collectDownloadForm() {
        siteData.download = {
            versionText: els.downloadVersion.value.trim(),
            quarkUrl: els.quarkUrl.value.trim(),
            baiduUrl: els.baiduUrl.value.trim(),
            notice: els.downloadNotice.value.trim()
        };
    }

    function renderChangelog() {
        if (!siteData.changelog.length) {
            els.changelogEditor.innerHTML = `<div class="admin-empty">暂无更新日志，点击“新增日志”添加。</div>`;
            return;
        }

        els.changelogEditor.innerHTML = siteData.changelog.map((item, index) => `
            <div class="admin-list-row" data-index="${index}">
                <div class="admin-row-index">#${index + 1}</div>
                <div class="admin-row-main">
                    <strong>${escapeHtml(item.title || "未命名日志")}</strong>
                    <div class="admin-row-meta">${escapeHtml(item.date || "未填写日期")}</div>
                    <div class="admin-row-preview">${escapeHtml((item.content || []).join(" / ").slice(0, 120))}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="secondary-btn" type="button" data-action="log-edit">编辑</button>
                    <button class="secondary-btn" type="button" data-action="log-move">移动到</button>
                    <button class="secondary-btn" type="button" data-action="log-delete">删除</button>
                </div>
            </div>
        `).join("");
    }

    function handleChangelogAction(event) {
        const button = event.target.closest("[data-action]");
        const row = event.target.closest("[data-index]");
        if (!button || !row) return;

        const index = Number(row.dataset.index);
        const action = button.dataset.action;

        if (action === "log-edit") editLog(index);
        if (action === "log-move") moveToPosition(siteData.changelog, index, renderChangelog, "日志");
        if (action === "log-delete") deleteItem(siteData.changelog, index, renderChangelog);
    }

    function editLog(index) {
        const item = siteData.changelog[index];
        const sync = () => {
            item.date = document.getElementById("modalLogDate").value;
            item.title = document.getElementById("modalLogTitle").value.trim();
            item.content = splitLines(document.getElementById("modalLogContent").value);
        };

        openModal("编辑更新日志", `
            <div class="admin-modal-tip">每一行会成为一条更新内容，保存全部后首页更新日志会同步显示。</div>
            <div class="admin-modal-grid">
                <div class="admin-form-row">
                    <label for="modalLogDate">日期</label>
                    <input id="modalLogDate" type="date" value="${escapeAttr(item.date)}">
                </div>
                <div class="admin-form-row">
                    <label for="modalLogTitle">标题</label>
                    <input id="modalLogTitle" type="text" value="${escapeAttr(item.title)}" placeholder="例如：客户端/服务端正式版 V1.5.0 更新">
                </div>
            </div>
            <div class="admin-form-row admin-form-row-focus">
                <label for="modalLogContent">更新内容</label>
                <textarea id="modalLogContent" placeholder="每行一条，例如：\n新增了航空学附属\n修复配方问题">${escapeHtml((item.content || []).join("\n"))}</textarea>
                <p class="admin-field-help">建议每条内容单独一行，前台会自动整理成列表。</p>
            </div>
        `, () => {
            sync();
            closeModal();
            renderChangelog();
        }, sync);
    }

    function renderCategoryFilter() {
        const current = qaState.category || "全部";
        const options = [`<option value="全部">全部分类</option>`]
            .concat(siteData.qaCategories.map(category => `<option value="${escapeAttr(category.name)}">${escapeHtml(category.name)}</option>`));

        els.qaCategoryFilter.innerHTML = options.join("");
        els.qaCategoryFilter.value = siteData.qaCategories.some(category => category.name === current) ? current : "全部";
        qaState.category = els.qaCategoryFilter.value;
    }

    function renderQA() {
        const keyword = normalizeText(qaState.search);
        const category = qaState.category || "全部";
        const filtered = siteData.qa
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => {
                const matchCategory = category === "全部" || item.category === category;
                const text = normalizeText(`${item.category} ${item.question} ${item.answer} ${(item.keywords || []).join(" ")}`);
                return matchCategory && (!keyword || text.includes(keyword));
            });
        const totalPages = Math.max(1, Math.ceil(filtered.length / qaState.pageSize));
        qaState.page = Math.min(Math.max(1, qaState.page), totalPages);
        const start = (qaState.page - 1) * qaState.pageSize;
        const pageItems = filtered.slice(start, start + qaState.pageSize);

        if (!pageItems.length) {
            els.qaEditor.innerHTML = `<div class="admin-empty">没有匹配的 QA。</div>`;
            renderQAPagination(filtered.length, totalPages);
            return;
        }

        els.qaEditor.innerHTML = pageItems.map(({ item, index }) => `
            <div class="admin-list-row" data-index="${index}">
                <div class="admin-row-index">#${index + 1}</div>
                <div class="admin-row-main">
                    <strong>${escapeHtml(item.question || "未命名问答")}</strong>
                    <div class="admin-row-meta">${escapeHtml(item.category || "未分类")}</div>
                    <div class="admin-row-preview">${escapeHtml((item.answer || "").slice(0, 120))}</div>
                    <div class="admin-row-preview">关键词：${escapeHtml((item.keywords || []).join("、") || "暂无")}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="secondary-btn" type="button" data-action="qa-edit">编辑</button>
                    <button class="secondary-btn" type="button" data-action="qa-keywords">AI生成关键词</button>
                    <button class="secondary-btn" type="button" data-action="qa-move">移动到</button>
                    <button class="secondary-btn" type="button" data-action="qa-delete">删除</button>
                </div>
            </div>
        `).join("");

        renderQAPagination(filtered.length, totalPages);
    }

    function renderQAPagination(total, totalPages) {
        els.qaPagination.innerHTML = `
            <button class="secondary-btn" type="button" data-page="prev" ${qaState.page <= 1 ? "disabled" : ""}>上一页</button>
            <span>第 ${qaState.page} / ${totalPages} 页，共 ${total} 条</span>
            <button class="secondary-btn" type="button" data-page="next" ${qaState.page >= totalPages ? "disabled" : ""}>下一页</button>
        `;
    }

    function handleQAPagination(event) {
        const button = event.target.closest("[data-page]");
        if (!button) return;

        if (button.dataset.page === "prev") qaState.page -= 1;
        if (button.dataset.page === "next") qaState.page += 1;
        renderQA();
    }

    function handleQAAction(event) {
        const button = event.target.closest("[data-action]");
        const row = event.target.closest("[data-index]");
        if (!button || !row) return;

        const index = Number(row.dataset.index);
        const action = button.dataset.action;

        if (action === "qa-edit") editQA(index);
        if (action === "qa-keywords") generateKeywordsForQA(index);
        if (action === "qa-move") moveToPosition(siteData.qa, index, () => {
            renderCategoryFilter();
            renderQA();
        }, "QA");
        if (action === "qa-delete") deleteItem(siteData.qa, index, () => {
            renderCategoryFilter();
            renderQA();
        });
    }

    function editQA(index) {
        const item = siteData.qa[index];
        const sync = () => {
            item.category = document.getElementById("modalQaCategory").value;
            item.question = document.getElementById("modalQaQuestion").value.trim();
            item.answer = document.getElementById("modalQaAnswer").value.trim();
            item.keywords = splitKeywords(document.getElementById("modalQaKeywords").value);
        };

        openModal("编辑 QA", `
            <div class="admin-modal-tip">问题和答案会用于前台搜索，也会发送给 AI 作为站内知识库参考。</div>
            <div class="admin-modal-grid">
                <div class="admin-form-row">
                    <label for="modalQaCategory">分类</label>
                    <input id="modalQaCategory" type="hidden" value="${escapeAttr(item.category)}">
                    ${renderCategorySelect(item.category)}
                </div>
                <div class="admin-form-row">
                    <label for="modalQaQuestion">问题</label>
                    <input id="modalQaQuestion" type="text" value="${escapeAttr(item.question)}" placeholder="例如：PCL2 安装失败怎么办？">
                </div>
            </div>
            <div class="admin-form-row admin-form-row-focus">
                <label for="modalQaAnswer">答案</label>
                <textarea id="modalQaAnswer" placeholder="填写可直接给玩家看的解决方法">${escapeHtml(item.answer || "")}</textarea>
            </div>
            <div class="admin-form-row admin-form-row-focus">
                <div class="admin-field-head">
                    <label for="modalQaKeywords">关键词</label>
                    <button id="modalGenerateKeywordsBtn" class="secondary-btn" type="button">AI 生成更多关键词</button>
                </div>
                <textarea id="modalQaKeywords" placeholder="例如：PCL2，安装失败，导入失败，zip，后缀">${escapeHtml((item.keywords || []).join("，"))}</textarea>
                <div class="admin-field-bottom">
                    <p class="admin-field-help">关键词用于搜索匹配。可以点 AI 生成后再手动删改。</p>
                    <span id="modalKeywordStatus" class="admin-status"></span>
                </div>
            </div>
        `, () => {
            sync();
            closeModal();
            renderCategoryFilter();
            renderQA();
        }, sync);

        document.getElementById("modalGenerateKeywordsBtn").addEventListener("click", async event => {
            await fillKeywordsFromAI({
                category: document.getElementById("modalQaCategory").value,
                question: document.getElementById("modalQaQuestion").value,
                answer: document.getElementById("modalQaAnswer").value,
                existingKeywords: splitKeywords(document.getElementById("modalQaKeywords").value),
                target: document.getElementById("modalQaKeywords"),
                status: document.getElementById("modalKeywordStatus"),
                button: event.currentTarget
            });
        });
    }

    function handleCustomSelectDocumentClick(event) {
        const toggle = event.target.closest("[data-custom-select-toggle]");
        const option = event.target.closest("[data-custom-select-option]");

        if (toggle) {
            const wrap = toggle.closest(".admin-custom-select");
            closeCustomSelects(wrap);
            wrap.classList.toggle("open");
            toggle.setAttribute("aria-expanded", wrap.classList.contains("open") ? "true" : "false");
            return;
        }

        if (option) {
            const wrap = option.closest(".admin-custom-select");
            const input = document.getElementById(wrap.dataset.target);
            const toggleBtn = wrap.querySelector("[data-custom-select-toggle]");
            const value = option.dataset.value || "";

            if (input) input.value = value;
            if (toggleBtn) {
                toggleBtn.querySelector("span").textContent = value;
                toggleBtn.setAttribute("aria-expanded", "false");
            }

            wrap.querySelectorAll("[data-custom-select-option]").forEach(btn => {
                btn.classList.toggle("active", btn === option);
            });
            wrap.classList.remove("open");
            return;
        }

        closeCustomSelects();
    }

    function closeCustomSelects(except) {
        document.querySelectorAll(".admin-custom-select.open").forEach(wrap => {
            if (wrap === except) return;
            wrap.classList.remove("open");
            const toggle = wrap.querySelector("[data-custom-select-toggle]");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    }

    async function generateKeywordsForQA(index) {
        const item = siteData.qa[index];
        const statusMessage = `正在给第 ${index + 1} 条生成关键词...`;
        setStatus(els.saveStatus, statusMessage);

        try {
            const keywords = await requestKeywords(item);
            item.keywords = keywords;
            renderQA();
            setStatus(els.saveStatus, "关键词已生成，记得保存全部。", false, true);
        } catch (error) {
            setStatus(els.saveStatus, error.message || String(error), true);
        }
    }

    async function fillKeywordsFromAI({ category, question, answer, existingKeywords, target, status, button }) {
        setStatus(status, "正在生成...");
        if (button) button.disabled = true;

        try {
            const keywords = await requestKeywords({ category, question, answer, keywords: existingKeywords });
            target.value = keywords.join("，");
            setStatus(status, "已生成，可继续手动修改。", false, true);
        } catch (error) {
            setStatus(status, error.message || String(error), true);
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function requestKeywords(item) {
        if (!String(item.question || "").trim() && !String(item.answer || "").trim()) {
            throw new Error("请先填写问题或答案。 ");
        }

        const result = await apiFetch("/api/admin/qa-keywords", {
            method: "POST",
            body: JSON.stringify({
                category: item.category || "",
                question: item.question || "",
                answer: item.answer || "",
                existingKeywords: item.keywords || [],
                referenceKeywords: collectReferenceKeywords(item.keywords || [])
            })
        });

        if (!result.ok || !Array.isArray(result.keywords)) {
            throw new Error(result.error || "AI 没有返回关键词。 ");
        }

        return result.keywords;
    }

    function collectReferenceKeywords(currentKeywords) {
        const seen = new Set();
        const result = [];
        const current = new Set((currentKeywords || []).map(keyword => String(keyword).trim().toLowerCase()).filter(Boolean));

        siteData.qa.forEach(item => {
            (item.keywords || []).forEach(keyword => {
                const value = String(keyword || "").trim();
                const key = value.toLowerCase();

                if (!value || current.has(key) || seen.has(key)) return;

                seen.add(key);
                result.push(value);
            });
        });

        return result.slice(0, 120);
    }

    function renderCategories() {
        if (!siteData.qaCategories.length) {
            els.categoryEditor.innerHTML = `<div class="admin-empty">暂无分类。</div>`;
            return;
        }

        els.categoryEditor.innerHTML = siteData.qaCategories.map((category, index) => {
            const count = siteData.qa.filter(item => item.category === category.name).length;
            return `
                <div class="admin-list-row" data-index="${index}">
                    <div class="admin-row-index">#${index + 1}</div>
                    <div class="admin-row-main">
                        <strong>${escapeHtml(category.name)}</strong>
                        <div class="admin-row-meta">${count} 条 QA 使用中</div>
                    </div>
                    <div class="admin-item-actions">
                        <button class="secondary-btn" type="button" data-action="cat-rename">重命名</button>
                        <button class="secondary-btn" type="button" data-action="cat-up">上移</button>
                        <button class="secondary-btn" type="button" data-action="cat-down">下移</button>
                        <button class="secondary-btn" type="button" data-action="cat-delete">删除</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    function handleCategoryAction(event) {
        const button = event.target.closest("[data-action]");
        const row = event.target.closest("[data-index]");
        if (!button || !row) return;

        const index = Number(row.dataset.index);
        const action = button.dataset.action;

        if (action === "cat-rename") renameCategory(index);
        if (action === "cat-up") moveItem(siteData.qaCategories, index, -1, renderCategories);
        if (action === "cat-down") moveItem(siteData.qaCategories, index, 1, renderCategories);
        if (action === "cat-delete") deleteCategory(index);
    }

    function addLog() {
        siteData.changelog.unshift({
            id: createId("log"),
            date: new Date().toISOString().slice(0, 10),
            title: "新的更新日志",
            content: ["填写更新内容"]
        });
        renderChangelog();
        editLog(0);
    }

    function addQA() {
        const category = siteData.qaCategories[0] ? siteData.qaCategories[0].name : "未分类";
        siteData.qa.unshift({
            id: createId("qa"),
            category,
            question: "新的问题",
            answer: "填写答案",
            keywords: []
        });
        qaState.search = "";
        qaState.category = "全部";
        qaState.page = 1;
        els.qaSearch.value = "";
        renderCategoryFilter();
        renderQA();
        editQA(0);
    }

    function addCategory() {
        openCategoryModal("新增分类", "", name => {
            siteData.qaCategories.push({ id: createId("cat"), name });
            renderCategoryFilter();
            renderCategories();
        });
    }

    function renameCategory(index) {
        const item = siteData.qaCategories[index];
        openCategoryModal("重命名分类", item.name, name => {
            if (name === item.name) {
                closeModal();
                return;
            }

            const oldName = item.name;
            item.name = name;
            siteData.qa.forEach(qa => {
                if (qa.category === oldName) qa.category = name;
            });
            renderCategoryFilter();
            renderQA();
            renderCategories();
        });
    }

    function openCategoryModal(title, currentName, onApply) {
        openModal(title, `
            <div class="admin-form-row admin-form-row-focus">
                <label for="modalCategoryName">分类名称</label>
                <input id="modalCategoryName" type="text" value="${escapeAttr(currentName)}" placeholder="例如：启动与崩溃">
                <p class="admin-field-help">QA 编辑时会从分类列表中选择，避免手动输入造成错别字。</p>
            </div>
            <div id="modalCategoryStatus" class="admin-status"></div>
        `, () => {
            const input = document.getElementById("modalCategoryName");
            const status = document.getElementById("modalCategoryStatus");
            const name = input.value.trim();

            if (!name) {
                setStatus(status, "请输入分类名称。", true);
                return;
            }

            if (siteData.qaCategories.some(category => category.name === name && category.name !== currentName)) {
                setStatus(status, "这个分类已经存在。", true);
                return;
            }

            onApply(name);
            closeModal();
        });

        setTimeout(() => {
            const input = document.getElementById("modalCategoryName");
            if (input) {
                input.focus();
                input.select();
            }
        }, 0);
    }

    function deleteCategory(index) {
        const item = siteData.qaCategories[index];
        const count = siteData.qa.filter(qa => qa.category === item.name).length;

        if (count > 0) {
            openNoticeModal("无法删除分类", `这个分类下还有 ${count} 条 QA，请先把它们改到其他分类。`);
            return;
        }

        openDeleteModal({
            title: "删除分类",
            message: `确定删除分类“${escapeHtml(item.name)}”吗？删除后无法恢复。`,
            onConfirm: () => {
                siteData.qaCategories.splice(index, 1);
                renderCategoryFilter();
                renderCategories();
            }
        });
    }

    function moveItem(list, index, direction, render) {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= list.length) return;
        const item = list[index];
        list.splice(index, 1);
        list.splice(nextIndex, 0, item);
        render();
    }

    function moveToPosition(list, index, render, label) {
        openModal(`移动${label}`, `
            <div class="admin-modal-tip">
                当前是第 ${index + 1} 条，共 ${list.length} 条。移动后会插入到目标位置，其他内容自动顺延，不会互换。
            </div>
            <div class="admin-move-card">
                <div>
                    <span class="admin-move-label">当前位置</span>
                    <strong>第 ${index + 1} 条</strong>
                </div>
                <div>
                    <span class="admin-move-label">可移动范围</span>
                    <strong>1 - ${list.length}</strong>
                </div>
            </div>
            <div class="admin-form-row admin-form-row-focus">
                <label for="modalMovePosition">移动到第几条</label>
                <input id="modalMovePosition" type="number" min="1" max="${list.length}" value="${index + 1}">
                <p class="admin-field-help">例如输入 3，就会把当前内容插入到第 3 条。</p>
            </div>
            <div id="modalMoveStatus" class="admin-status"></div>
        `, () => {
            const input = document.getElementById("modalMovePosition");
            const status = document.getElementById("modalMoveStatus");
            const target = Number(input.value);

            if (!Number.isInteger(target) || target < 1 || target > list.length) {
                setStatus(status, `请输入 1 到 ${list.length} 之间的整数。`, true);
                return;
            }

            const item = list[index];
            list.splice(index, 1);
            list.splice(target - 1, 0, item);
            closeModal();
            render();
        });

        setTimeout(() => {
            const input = document.getElementById("modalMovePosition");
            if (input) {
                input.focus();
                input.select();
            }
        }, 0);
    }

    function deleteItem(list, index, render) {
        openDeleteModal({
            title: "删除内容",
            message: `确定删除第 ${index + 1} 条内容吗？删除后无法恢复。`,
            onConfirm: () => {
                list.splice(index, 1);
                render();
            }
        });
    }

    function openDeleteModal({ title, message, onConfirm }) {
        openModal(title, `
            <div class="admin-delete-card">
                <div class="admin-delete-icon">!</div>
                <div>
                    <strong>请确认删除</strong>
                    <p>${message}</p>
                </div>
            </div>
        `, () => {
            onConfirm();
            closeModal();
        });
    }

    function openNoticeModal(title, message) {
        openModal(title, `
            <div class="admin-delete-card admin-notice-card">
                <div class="admin-delete-icon">i</div>
                <div>
                    <strong>无法继续操作</strong>
                    <p>${escapeHtml(message)}</p>
                </div>
            </div>
        `, closeModal);
    }

    function openModal(title, html, apply, sync) {
        modalApply = apply;
        modalSync = sync || null;
        els.modalTitle.textContent = title;
        els.modalBody.innerHTML = html;
        els.modalMask.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        els.modalMask.hidden = true;
        els.modalBody.innerHTML = "";
        modalApply = null;
        modalSync = null;
        document.body.classList.remove("modal-open");
    }

    async function apiFetch(path, options = {}) {
        const headers = Object.assign({
            "Accept": "application/json",
            "Content-Type": "application/json"
        }, options.headers || {});
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

        if (!options.skipAuth) {
            const token = getToken();
            if (token) headers.Authorization = `Bearer ${token}`;
        }

        let response;
        let text;

        try {
            response = await fetch(`${getApiBase()}${path}`, {
                method: options.method || "GET",
                headers,
                body: options.body,
                signal: controller.signal
            });
            text = await response.text();
        } catch (error) {
            if (error && error.name === "AbortError") {
                throw new Error("请求超时。请检查 Admin Worker 的 AI_API_BASE_URL / AI_ADMIN_SECRET，以及 AI Worker 是否已部署 /qa-keywords。 ");
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }

        let result = {};

        try {
            result = text ? JSON.parse(text) : {};
        } catch (error) {
            throw new Error(text || `HTTP ${response.status}`);
        }

        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
        return result;
    }

    function normalizeData(data) {
        const source = data && typeof data === "object" ? data : {};
        const qa = Array.isArray(source.qa) ? source.qa.map(normalizeQA) : [];
        const qaCategories = normalizeQACategories(source.qaCategories, qa);

        return {
            version: 2,
            updatedAt: source.updatedAt || "",
            download: Object.assign({}, DEFAULT_DOWNLOAD, source.download || {}),
            qaCategories,
            changelog: Array.isArray(source.changelog) ? source.changelog.map(normalizeLog) : [],
            qa: qa.map(item => {
                if (!qaCategories.some(category => category.name === item.category)) {
                    qaCategories.push({ id: createId("cat"), name: item.category || "未分类" });
                }
                return item;
            })
        };
    }

    function normalizeQACategories(value, qa) {
        const names = [];
        if (Array.isArray(value)) {
            value.forEach(item => {
                const name = typeof item === "string" ? item : item && item.name;
                if (name && !names.includes(name)) names.push(String(name).trim());
            });
        }
        qa.forEach(item => {
            const name = item.category || "未分类";
            if (name && !names.includes(name)) names.push(name);
        });
        if (!names.length) names.push("未分类");
        return names.map(name => ({ id: createId("cat"), name }));
    }

    function normalizeLog(item) {
        return {
            id: item.id || createId("log"),
            date: item.date || "",
            title: item.title || "",
            content: Array.isArray(item.content) ? item.content : splitLines(item.content || "")
        };
    }

    function normalizeQA(item) {
        return {
            id: item.id || createId("qa"),
            category: item.category || "未分类",
            question: item.question || "",
            answer: item.answer || item.rawAnswer || "",
            keywords: Array.isArray(item.keywords) ? item.keywords : splitKeywords(item.keywords || "")
        };
    }

    function createFallbackData() {
        return normalizeData({
            download: DEFAULT_DOWNLOAD,
            changelog: window.CHANGELOG_DATA || [],
            qa: window.QA_DATA || window.qaData || []
        });
    }

    function applyLocalFallback(data) {
        const fallback = createFallbackData();
        if (!data.changelog.length && fallback.changelog.length) data.changelog = fallback.changelog;
        if (!data.qa.length && fallback.qa.length) data.qa = fallback.qa;
        data.download = Object.assign({}, DEFAULT_DOWNLOAD, data.download || {});
        data.qaCategories = normalizeQACategories(data.qaCategories, data.qa);
        return data;
    }

    function renderCategorySelect(selected) {
        const current = siteData.qaCategories.some(category => category.name === selected)
            ? selected
            : (siteData.qaCategories[0] ? siteData.qaCategories[0].name : "未分类");
        const options = siteData.qaCategories.map(category => `
            <button class="admin-custom-select-option ${category.name === current ? "active" : ""}" type="button" data-custom-select-option data-value="${escapeAttr(category.name)}">
                ${escapeHtml(category.name)}
            </button>
        `).join("");

        return `
            <div class="admin-custom-select" data-target="modalQaCategory">
                <button class="admin-custom-select-toggle" type="button" data-custom-select-toggle aria-expanded="false">
                    <span>${escapeHtml(current)}</span>
                </button>
                <div class="admin-custom-select-menu">${options}</div>
            </div>
        `;
    }

    function getApiBase() {
        return window.SITE_CONFIG && window.SITE_CONFIG.ADMIN_API_BASE_URL;
    }

    function getToken() {
        return adminToken;
    }

    function showPanel() {
        document.body.classList.remove("admin-logged-out");
        document.body.classList.add("admin-logged-in");
        els.loginCard.hidden = true;
        els.adminPanel.hidden = false;
    }

    function showLogin() {
        document.body.classList.add("admin-logged-out");
        document.body.classList.remove("admin-logged-in");
        els.loginCard.hidden = false;
        els.adminPanel.hidden = true;
        setStatus(els.loginStatus, "");
    }

    function setStatus(node, message, isError = false, isSuccess = false) {
        if (!node) return;
        node.textContent = message || "";
        node.classList.toggle("error", Boolean(isError));
        node.classList.toggle("success", Boolean(isSuccess));
    }

    function splitLines(value) {
        return String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    }

    function splitKeywords(value) {
        return String(value || "").split(/[,，\n]/).map(keyword => keyword.trim()).filter(Boolean);
    }

    function normalizeText(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, "");
    }

    function createId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }
})();

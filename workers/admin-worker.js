const SITE_DATA_KEY = "SITE_DATA";
const SITE_DATA_VERSION_KEY = "SITE_DATA_VERSION";
const SESSION_PREFIX = "ADMIN_SESSION:";
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const MAX_BODY_SIZE = 1024 * 1024 * 2;

const DEFAULT_SITE_DATA = {
    version: 1,
    updatedAt: "",
    download: {
        versionText: "V1.3.0",
        quarkUrl: "https://pan.quark.cn/s/d9f87296aeaf?pwd=WZjz",
        baiduUrl: "https://pan.baidu.com/s/1pVfiKZWmPeLv_-24EWWLig?pwd=7ayt",
        notice: "点击按钮跳转网盘下载，如果夸克点进去没文件，可以使用备用的百度网盘"
    },
    qaCategories: [],
    changelog: [],
    qa: []
};

export default {
    async fetch(request, env) {
        const corsHeaders = getCorsHeaders(request);

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        const url = new URL(request.url);

        try {
            if (request.method === "GET" && url.pathname === "/") {
                return jsonResponse({
                    ok: true,
                    message: "Admin Worker is running"
                }, 200, corsHeaders);
            }

            if (request.method === "GET" && url.pathname === "/api/public/site-data") {
                return handlePublicSiteData(request, env, corsHeaders);
            }

            if (request.method === "POST" && url.pathname === "/api/admin/login") {
                return handleLogin(request, env, corsHeaders);
            }

            if (request.method === "POST" && url.pathname === "/api/admin/logout") {
                return handleLogout(request, env, corsHeaders);
            }

            if (request.method === "GET" && url.pathname === "/api/admin/session") {
                return handleSession(request, env, corsHeaders);
            }

            if (url.pathname === "/api/admin/site-data") {
                return handleAdminSiteData(request, env, corsHeaders);
            }

            if (request.method === "POST" && url.pathname === "/api/admin/qa-keywords") {
                return handleQAKeywords(request, env, corsHeaders);
            }

            return jsonResponse({
                ok: false,
                error: "Not found",
                path: url.pathname
            }, 404, corsHeaders);
        } catch (error) {
            return jsonResponse({
                ok: false,
                error: error && error.message ? error.message : String(error)
            }, 500, corsHeaders);
        }
    }
};

function getCorsHeaders(request) {
    const origin = request.headers.get("Origin") || "*";

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

async function handlePublicSiteData(request, env, corsHeaders) {
    const url = new URL(request.url);
    const expectedVersion = trimString(url.searchParams.get("v") || "", 40);
    let data = await getSiteData(env);

    if (expectedVersion && data.dataVersion !== expectedVersion) {
        await new Promise(resolve => setTimeout(resolve, 250));
        data = await getSiteData(env);
    }

    return jsonResponse({
        ok: true,
        data
    }, 200, {
        ...corsHeaders,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
    });
}

async function handleLogin(request, env, corsHeaders) {
    const body = await readJsonBody(request);
    const password = String(body.password || "");
    const expectedPassword = env.ADMIN_PASSWORD;

    if (!expectedPassword) {
        return jsonResponse({
            ok: false,
            error: "Admin Worker 未配置 ADMIN_PASSWORD。"
        }, 500, corsHeaders);
    }

    if (!safeEqual(password, expectedPassword)) {
        return jsonResponse({
            ok: false,
            error: "密码错误。"
        }, 401, corsHeaders);
    }

    ensureKV(env);

    const token = createToken();
    const sessionKey = await getSessionKey(token, env);

    await env.SITE_KV.put(sessionKey, JSON.stringify({
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
    }), {
        expirationTtl: SESSION_TTL_SECONDS
    });

    return jsonResponse({
        ok: true,
        token,
        expiresIn: SESSION_TTL_SECONDS
    }, 200, corsHeaders);
}

async function handleLogout(request, env, corsHeaders) {
    const token = getBearerToken(request);

    if (token && env.SITE_KV) {
        await env.SITE_KV.delete(await getSessionKey(token, env));
    }

    return jsonResponse({
        ok: true
    }, 200, corsHeaders);
}

async function handleSession(request, env, corsHeaders) {
    const session = await getSession(request, env);

    return jsonResponse({
        ok: true,
        loggedIn: Boolean(session)
    }, 200, corsHeaders);
}

async function handleAdminSiteData(request, env, corsHeaders) {
    const session = await getSession(request, env);

    if (!session) {
        return jsonResponse({
            ok: false,
            error: "未登录或登录已过期。"
        }, 401, corsHeaders);
    }

    if (request.method === "GET") {
        const data = await getSiteData(env);

        return jsonResponse({
            ok: true,
            data
        }, 200, corsHeaders);
    }

    if (request.method !== "PUT") {
        return jsonResponse({
            ok: false,
            error: "Only GET and PUT are allowed."
        }, 405, corsHeaders);
    }

    const body = await readJsonBody(request);
    const data = normalizeSiteData(body);

    ensureKV(env);
    const dataVersion = String(Date.now());
    data.dataVersion = dataVersion;
    await putSiteData(env, data, dataVersion);

    let verifiedData = await getSiteData(env);

    if (verifiedData.dataVersion !== dataVersion) {
        await new Promise(resolve => setTimeout(resolve, 250));
        await putSiteData(env, data, dataVersion);
        verifiedData = await getSiteData(env);
    }

    return jsonResponse({
        ok: true,
        data: verifiedData.dataVersion === dataVersion ? verifiedData : data,
        dataVersion,
        verified: verifiedData.dataVersion === dataVersion
    }, 200, corsHeaders);
}

async function handleQAKeywords(request, env, corsHeaders) {
    const session = await getSession(request, env);

    if (!session) {
        return jsonResponse({
            ok: false,
            error: "未登录或登录已过期。"
        }, 401, corsHeaders);
    }

    const aiBaseUrl = trimString(env.AI_API_BASE_URL || "", 500).replace(/\/+$/, "");
    const aiSecret = env.AI_ADMIN_SECRET;

    if (!aiBaseUrl || !aiSecret) {
        return jsonResponse({
            ok: false,
            error: "Admin Worker 未配置 AI_API_BASE_URL 或 AI_ADMIN_SECRET。"
        }, 500, corsHeaders);
    }

    const body = await readJsonBody(request);
    const payload = {
        category: trimString(body.category || "", 80),
        question: trimString(body.question || "", 300),
        answer: trimString(body.answer || "", 8000),
        existingKeywords: Array.isArray(body.existingKeywords) ? body.existingKeywords.slice(0, 80) : [],
        referenceKeywords: Array.isArray(body.referenceKeywords) ? body.referenceKeywords.slice(0, 120) : []
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response;
    let text;

    try {
        response = await fetch(`${aiBaseUrl}/qa-keywords`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${aiSecret}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        text = await response.text();
    } catch (error) {
        return jsonResponse({
            ok: false,
            error: error && error.name === "AbortError"
                ? "AI 关键词接口请求超时。请检查 AI Worker 是否已部署 /qa-keywords，以及 AI 模型接口是否可用。"
                : `AI 关键词接口请求失败：${error && error.message ? error.message : String(error)}`
        }, 502, corsHeaders);
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        return jsonResponse({
            ok: false,
            error: `AI 关键词接口请求失败：HTTP ${response.status} ${text.slice(0, 300)}`
        }, 502, corsHeaders);
    }

    let result;
    try {
        result = JSON.parse(text);
    } catch (error) {
        return jsonResponse({
            ok: false,
            error: "AI 关键词接口返回的不是合法 JSON。"
        }, 502, corsHeaders);
    }

    return jsonResponse({
        ok: true,
        keywords: normalizeKeywords(result.keywords)
    }, 200, corsHeaders);
}

async function putSiteData(env, data, dataVersion) {
    await env.SITE_KV.put(SITE_DATA_KEY, JSON.stringify(data));
    await env.SITE_KV.put(SITE_DATA_VERSION_KEY, dataVersion);
}

async function getSiteData(env) {
    ensureKV(env);

    const raw = await env.SITE_KV.get(SITE_DATA_KEY);

    if (!raw) {
        return normalizeSiteData(DEFAULT_SITE_DATA);
    }

    try {
        return normalizeSiteData(JSON.parse(raw));
    } catch (error) {
        return normalizeSiteData(DEFAULT_SITE_DATA);
    }
}

async function getSession(request, env) {
    ensureKV(env);

    const token = getBearerToken(request);

    if (!token) {
        return null;
    }

    const raw = await env.SITE_KV.get(await getSessionKey(token, env));

    if (!raw) {
        return null;
    }

    try {
        const session = JSON.parse(raw);
        const expiresAt = Date.parse(session.expiresAt || "");

        if (!expiresAt || expiresAt < Date.now()) {
            return null;
        }

        return session;
    } catch (error) {
        return null;
    }
}

function getBearerToken(request) {
    const authorization = request.headers.get("Authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    return match ? match[1].trim() : "";
}

async function getSessionKey(token, env) {
    const secret = env.SESSION_SECRET || "";
    const hash = await sha256(`${secret}:${token}`);

    return SESSION_PREFIX + hash;
}

function normalizeSiteData(input) {
    const source = input && typeof input === "object" ? input : {};
    const download = source.download && typeof source.download === "object" ? source.download : {};

    return {
        version: 2,
        dataVersion: trimString(source.dataVersion || "", 40),
        updatedAt: new Date().toISOString(),
        download: {
            versionText: trimString(download.versionText || DEFAULT_SITE_DATA.download.versionText, 50),
            quarkUrl: normalizeUrl(download.quarkUrl || download.kuakeUrl || DEFAULT_SITE_DATA.download.quarkUrl),
            baiduUrl: normalizeUrl(download.baiduUrl || DEFAULT_SITE_DATA.download.baiduUrl),
            notice: trimString(download.notice || DEFAULT_SITE_DATA.download.notice, 300)
        },
        qaCategories: normalizeQACategories(source.qaCategories, source.qa),
        changelog: normalizeChangelog(source.changelog),
        qa: normalizeQA(source.qa)
    };
}

function normalizeQACategories(value, qa) {
    const names = [];

    if (Array.isArray(value)) {
        value.forEach(item => {
            const name = trimString(typeof item === "string" ? item : item && item.name, 80);
            if (name && !names.includes(name)) names.push(name);
        });
    }

    if (Array.isArray(qa)) {
        qa.forEach(item => {
            const name = trimString(item && item.category || "未分类", 80);
            if (name && !names.includes(name)) names.push(name);
        });
    }

    if (!names.length) names.push("未分类");

    return names.slice(0, 100).map((name, index) => ({
        id: `cat_${index}_${name}`,
        name
    }));
}

function normalizeChangelog(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.slice(0, 200).map((item, index) => {
        const content = Array.isArray(item && item.content)
            ? item.content
            : String(item && item.content || "").split(/\r?\n/);

        return {
            id: trimString(item && item.id || `log_${Date.now()}_${index}`, 80),
            date: trimString(item && item.date || "", 20),
            title: trimString(item && item.title || "", 120),
            content: content
                .map(line => trimString(line, 500))
                .filter(Boolean)
                .slice(0, 80)
        };
    }).filter(item => item.date || item.title || item.content.length);
}

function normalizeQA(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.slice(0, 1000).map((item, index) => {
        const keywords = Array.isArray(item && item.keywords)
            ? item.keywords
            : String(item && item.keywords || "").split(/[,，\n]/);

        return {
            id: trimString(item && item.id || `qa_${Date.now()}_${index}`, 80),
            category: trimString(item && item.category || "未分类", 80),
            question: trimString(item && item.question || "", 300),
            answer: trimString(item && item.answer || item && item.rawAnswer || "", 20000),
            keywords: keywords
                .map(keyword => trimString(keyword, 60))
                .filter(Boolean)
                .slice(0, 50)
        };
    }).filter(item => item.question || item.answer);
}

function normalizeKeywords(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set();
    const result = [];

    value.forEach(item => {
        const keyword = trimString(item, 60);
        const key = keyword.toLowerCase();

        if (!keyword || seen.has(key) || /^https?:\/\//i.test(keyword)) {
            return;
        }

        seen.add(key);
        result.push(keyword);
    });

    return result.slice(0, 30);
}

function normalizeUrl(value) {
    const url = trimString(value, 1000);

    if (!url) {
        return "";
    }

    if (!/^https:\/\//i.test(url)) {
        throw new Error("下载链接必须以 https:// 开头。");
    }

    return url;
}

async function readJsonBody(request) {
    const length = Number(request.headers.get("Content-Length") || "0");

    if (length > MAX_BODY_SIZE) {
        throw new Error("请求内容太大。最多允许 2MB。注意不要一次粘贴过大的日志或文件。 ");
    }

    try {
        return await request.json();
    } catch (error) {
        throw new Error("请求内容不是合法 JSON。 ");
    }
}

function trimString(value, maxLength) {
    return String(value || "").trim().slice(0, maxLength);
}

function createToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);

    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function sha256(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

function safeEqual(a, b) {
    const left = String(a);
    const right = String(b);

    if (left.length !== right.length) {
        return false;
    }

    let result = 0;

    for (let i = 0; i < left.length; i += 1) {
        result |= left.charCodeAt(i) ^ right.charCodeAt(i);
    }

    return result === 0;
}

function ensureKV(env) {
    if (!env.SITE_KV) {
        throw new Error("Admin Worker 未绑定 KV。请绑定变量名 SITE_KV。 ");
    }
}

function jsonResponse(data, status, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...headers,
            "Content-Type": "application/json; charset=utf-8"
        }
    });
}

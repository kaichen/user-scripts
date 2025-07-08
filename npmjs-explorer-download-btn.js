// ==UserScript==
// @name         npmjs file downloader
// @namespace    kai.chatgpt.demo
// @version      0.2.0
// @description  在 npmjs.com 的 Code 页目录树中，为每个文件名旁添加「下载」按钮
// @author       Kai(kai@thekaiway.com)
// @match        https://www.npmjs.com/package/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=npmjs.com
// @grant        GM_xmlhttpRequest
// @connect      www.npmjs.com
// @run-at       document-end
// ==/UserScript==

/* -------------------------------------------------- 工具函数 */

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 从 main#main 第一个 span 拿版本号；轮询最多 2 s */
async function getDomVersion () {
    for (let i = 0; i < 20; i++) {
        const span = document.querySelector('main#main div>span');
        if (span) {
            const raw = span.textContent.trim();
            const m = raw.match(/^\d+\.\d+\.\d+(?:[-\w.]*)?/);  // ← 取首个 semver
            if (m) return m[0];
        }
        await sleep(300);
    }
    throw new Error('无法从 DOM 获取版本号');
}

/** 解析当前页面 → { pkg, ver, indexUrl } */
async function parsePage () {
    const m = location.pathname.match(/^\/package\/((?:@[^\/]+\/)?[^\/]+)(?:\/v\/([^\/]+))?/);
    if (!m) return null;

    const pkg = m[1];
    const ver = m[2] || await getDomVersion();          // ☆ DOM 拿版本号
    const base = `/package/${pkg}/v/${ver}`;

    return {
        pkg, ver,
        indexUrl: `${location.origin}${base}/index`,
        fileBase: `${location.origin}${base}/file`
  };
}

/** 拉取 index → { "/file/path": hex }   （用原生 fetch, credentials: omit） */
async function fetchFileMap (url) {
    const resp = await fetch(url, {
        credentials: 'omit',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    const map = {};
    for (const [p, meta] of Object.entries(json.files || {})) {
        if (meta.type === 'File' && meta.hex) map[p] = meta.hex;
    }
    return map;
}

let done = false;
/* -------------- **改动点：注入按钮** -------------- */
function injectButtons(fileMap, pkg) {
    if (done) return;
    if (!fileMap || !pkg) return;

    document.querySelectorAll('#tabpanel-explore ul>li').forEach(a => {
        if (a.querySelector('.tamper-dl')) return;          // 已处理
        const fileBtn = a.querySelector("button");
        if (!fileBtn) return;
        const pathPart = fileBtn.textContent;

        const relPath = '/' + decodeURIComponent(pathPart);
        const hex = fileMap[relPath];
        if (!hex) return;                                                  // 文件夹行 or 未命中

        const btn = document.createElement('a');
        btn.href = `https://www.npmjs.com/package/${pkg}/file/${hex}`;                                  // ★ 自动带版本
        btn.download = pathPart || '';
        btn.target = '_blank';
        btn.textContent = ' ⬇';
        btn.title = '下载';
        btn.style.cssText = 'margin-left:4px;font-size:90%;user-select:none;';
        fileBtn.parentElement?.appendChild(btn);
        a.className = a.className + " tamper-dl";
        done = true;
    });
}

/* -------------------------------------------------- 主逻辑 */

let current = null;           // 记录 { pkg, ver, indexUrl }
let fileMapCache = {};        // key: indexUrl → map

async function refresh() {
    const info = await parsePage();
    if (!info) return;

    // 前端路由跳转：pkg 或 ver 变了 → 重新来
    const needNew = !current || current.indexUrl !== info.indexUrl;
    current = info;

    // 若已有缓存直接用
    let fileMap = fileMapCache[info.indexUrl];
    if (!fileMap && needNew) {
        try {
            fileMap = await fetchFileMap(info.indexUrl);
            fileMapCache[info.indexUrl] = fileMap;
        } catch (e) {
            console.warn('[tamper] index 拉取失败', e);
            return;
        }
    }

    // 等目录树真正渲染出来（有时需延迟）
    for (let i = 0; i < 10; i++) {
        await sleep(500);
        if (!!info.pkg) injectButtons(fileMap, info['pkg']);
    }
}

/* ---------- 监听：首次 + DOM 变化 + 前端路由 ---------- */

// 页面初就跑
refresh();

// SPA 路由：history.pushState / replaceState
['pushState', 'replaceState'].forEach(fn => {
    const raw = history[fn];
    history[fn] = function () {
        raw.apply(this, arguments);
        setTimeout(refresh, 50);
    };
});
window.addEventListener('popstate', () => setTimeout(refresh, 50));

// DOM Mutation（目录树异步加载时触发）
const obs = new MutationObserver(() => injectButtons(fileMapCache[current?.indexUrl]));
obs.observe(document.body, { childList: true, subtree: true });
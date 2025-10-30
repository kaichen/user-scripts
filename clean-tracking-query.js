// ==UserScript==
// @name         Clean Tracking Query
// @namespace    kai.scripts
// @version      2025-07-08
// @description  自动移除 URL 中的 utm_*、gclid、fbclid 等常见追踪参数
// @author       Kai(kai@thekaiway.com)
// @match        http*://*/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=thekaiway.com
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /** 可显式列出的黑名单 */
  const BLACKLIST = [
    'gclid', 'fbclid',
    'yclid', 'mc_eid', 'mc_cid',
    'ref', 'source', // 某些站点使用的简写
    // ↓ 留空位置方便你继续追加
  ];

  /** 将 dirty URL → clean URL；若没有变化返回 null */
  function cleanURL(urlString) {
    const url = new URL(urlString);
    let changed = false;

    // 1) 精确黑名单
    for (const key of BLACKLIST) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    // 2) 正则捕获 utm_* 样式
    for (const [key] of Array.from(url.searchParams)) {
      if (/^utm_/i.test(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    return changed ? url.toString() : null;
  }

  /** 用 replaceState 更新地址栏而不触发网络请求 */
  function replaceCleanURL() {
    const clean = cleanURL(location.href);
    if (clean) history.replaceState(null, '', clean);
  }

  // —— 首次加载立即清理 ——
  replaceCleanURL();

  // —— 针对 SPA / PJAX 路由变更的 hook ——
  const rawPush   = history.pushState;
  const rawReplace = history.replaceState;

  history.pushState = function (...args) {
    rawPush.apply(this, args);
    replaceCleanURL();
  };

  history.replaceState = function (...args) {
    rawReplace.apply(this, args);
    replaceCleanURL();
  };

  window.addEventListener('popstate', replaceCleanURL, false);
})();

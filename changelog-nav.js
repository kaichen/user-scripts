// ==UserScript==
// @name         ChangeLog Navigation
// @namespace    http://tampermonkey.net/
// @version      2025-07-08
// @description  Show a titled pagination right below the changelog news email page title.
// @author       Kai(kai@thekaiway.com)
// @match        https://changelog.com/news/*/email
// @icon         https://www.google.com/s2/favicons?sz=64&domain=changelog.com
// @grant        none
// ==/UserScript==

const safeFetchText = async (url, options) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;                   // 网络级错误同样返回 null
    }
};

(async function () {
    'use strict';

    /* ---------- 工具 ---------- */
    const esc = (s = "") =>
    s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    const fetchMeta = async (n) => {
        const url = `/news/${n}/email`;
        // 提前声明 prefetch，加速真实点击
        const linkPrefetch = document.createElement("link");
        linkPrefetch.rel = "prefetch";
        linkPrefetch.href = url;
        document.head.appendChild(linkPrefetch);

        try {
            const html = await safeFetchText(url);
            if (html === null) return null;
            const doc = new DOMParser().parseFromString(html, "text/html");
            const desc = doc.querySelector('meta[name="twitter:description"]')
            ?.getAttribute("content")
            ?.trim() || "";
            return { n, desc };
        } catch (e) {
            return null;                                  // 用 null 表示该页失效
        }
    };

    /* ---------- 当前页信息 ---------- */
    const m = location.pathname.match(/\/news\/(\d+)\/email/);
    if (!m) return;
    const id = Number(m[1]);
    const prevId = id - 1;
    const nextId = id + 1;

    /* ---------- 并行抓取相邻页 meta ---------- */
    const [prevInfo, nextInfo] = await Promise.all([
        prevId > 0 ? fetchMeta(prevId) : Promise.resolve(null),
        fetchMeta(nextId),
    ]);

    /* ---------- 生成分页 HTML ---------- */
    const parts = [];

    // 上一页
    if (prevInfo) {
        parts.push(
            `<a href="/news/${prevInfo.n}/email">&lt;&lt; ${prevInfo.n}:${esc(prevInfo.desc)}</a>`
    );
  }

    // 下一页
    if (nextInfo) {
        parts.push(
            `<a href="/news/${nextInfo.n}/email">${nextInfo.n}:${esc(nextInfo.desc)} &gt;&gt;</a>`
    );
  }
    if (parts.length < 1) return;   // 无相邻页时不渲染

    const pagerHTML =
          `<div class="cn-pager" style="margin:4px 0 1em;font-size:14px;">` +
          parts.join(`<br/>`) +
          `</div>`;

    /* ---------- 注入到 DOM ---------- */
    const h1 = document.querySelector("h1");
    if (h1) h1.insertAdjacentHTML("afterend", pagerHTML);
})();
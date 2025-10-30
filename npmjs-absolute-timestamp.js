// ==UserScript==
// @name         NPMJS Absolute Timestamp
// @namespace    kai.scripts
// @version      2025-07-02
// @description  Cast <time> tag relative timestamp to absolution.
// @author       Kai(kai@thekaiway.com)
// @match        https://www.npmjs.com/package/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=npmjs.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const replaceTimes = (root = document) => {
        root.querySelectorAll("time[title]").forEach((el) => {
            const abs = el.getAttribute("title");
            if (abs && el.textContent.trim() !== abs) {
                el.textContent = abs;
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => replaceTimes());
    } else {
        replaceTimes();
    }

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.matches?.("time[title]")) {
                    replaceTimes(node);
                } else {
                    replaceTimes(node);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
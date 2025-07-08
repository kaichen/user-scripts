# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of browser user scripts (UserScripts) designed to enhance web experiences on various websites. The scripts are meant to be run through browser extensions like Tampermonkey (油猴).

## Development Commands

This repository uses no build system or package manager. Scripts are standalone JavaScript files.

### Testing Scripts
1. Install Tampermonkey browser extension
2. Click on script file in GitHub or use raw URL
3. Tampermonkey will prompt to install
4. Navigate to target website to test functionality

### Updating Scripts
- Increment version number in script metadata header (e.g., `// @version 1.0.1`)
- Update both `@updateURL` and `@downloadURL` if hosting location changes

## Code Architecture

### UserScript Structure
Each script follows the standard UserScript format:
```javascript
// ==UserScript==
// @name         Script Name
// @version      1.0.0
// @description  Description
// @match        https://example.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Script code here
})();
```

### Common Patterns

1. **DOM Manipulation**: Scripts typically wait for specific elements before modifying the page
   ```javascript
   const targetElement = document.querySelector('.selector');
   if (targetElement) {
       // Modify element
   }
   ```

2. **MutationObserver**: Used for handling dynamically loaded content (see npmjs-absolute-timestamp.js)

3. **URL Parameter Manipulation**: Scripts often work with URL query parameters (see twitter-search-timerange-button.js and clean-tracking-query.js)

4. **Event Delegation**: Click handlers attached to parent elements for dynamically added buttons

### Script-Specific Notes

- **twitter-search-timerange-button.js**: Adds date filter buttons to Twitter/X search. Uses URL parameter manipulation with `since:` and `until:` operators.

- **npmjs-absolute-timestamp.js**: Converts relative timestamps to absolute dates. Uses MutationObserver to handle React-rendered content.

- **clean-tracking-query.js**: Removes tracking parameters from URLs. Monitors both page loads and SPA navigation.

- **changelog-nav.js**: Adds navigation to Changelog.com emails. Implements pre-fetching for performance.

## Important Conventions

1. **Language**: Comments and documentation use both Chinese and English
2. **No Dependencies**: Scripts must be self-contained with no external dependencies
3. **Metadata Headers**: Always update version and URLs in UserScript metadata when making changes
4. **Compatibility**: Scripts should work with Tampermonkey and similar UserScript managers
5. **Error Handling**: Scripts should fail gracefully if target elements aren't found
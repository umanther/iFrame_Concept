/**
 * @module padlock
 * @description
 * This module asynchronously loads the padlock SVG asset once on import,
 * and provides a shared template clone with ID sanitization and cloning utility.
 *
 * Exports:
 * - `padlockTemplate`: The loaded SVGElement template for the padlock (undefined until loaded).
 * - `padlockLoaded`: A Promise that resolves when the padlock SVG has finished loading.
 *
 * Usage example:
 * ```js
 * import { padlockLoaded, padlockTemplate } from './padlock.js';
 *
 * await padlockLoaded;
 * if (padlockTemplate) {
 *   const clone = padlockTemplate.cloneWith({ className: 'icon' });
 *   document.body.appendChild(clone);
 * }
 * ```
 */

import {debugLog, setDebug} from "./debugLog.js"
import {cloneWith, sanitizeSVGIds} from "./utilities.js";

// Disable debug logging by default.
// Call setDebug(true) externally to enable.
setDebug(false);

/** Stores the padlock SVG to be duplicated where needed.
 * @type {SVGElement | undefined} */
let padlockTemplate;

/** Internal resolver for padlockLoaded.
 * @type {() => void} */
let resolvePadlockLoaded;

/** Promise that resolves when the padlock SVG has loaded.
 * Use `await padlockLoaded` anywhere in this module to wait for it.
 * @type {Promise<void>} */
const padlockLoaded = new Promise((resolve) => {
    resolvePadlockLoaded = resolve;
});

/** Loads the contents of padlock.svg into padlockTemplate.
 * Automatically runs at module load.
 * Not exported. */
async function loadPadlockSVG() {
    try {
        const svgUrl = new URL('./assets/padlock.svg', import.meta.url);
        const response = await fetch(svgUrl);
        const svgText = await response.text();

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) {
            throw new Error("SVG root <svg> not found");
        }

        padlockTemplate = svgElement;
        debugLog("Padlock SVG loaded:", padlockTemplate);

        // Add cloneWith method that returns a clone with the method bound to the clone
        padlockTemplate.cloneWith = function (changes = {}) {
            const clone = cloneWith(this, changes);
            sanitizeSVGIds(clone);
            clone.cloneWith = padlockTemplate.cloneWith;
            return clone;
        };

        resolvePadlockLoaded(); // resolve the shared Promise
    } catch (error) {
        console.error("Failed to load padlock.svg:", error);
    }
}

// ⏳ Begin loading the padlock as soon as the module runs
loadPadlockSVG();

export {padlockLoaded, padlockTemplate}
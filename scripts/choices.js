/**
 * @module choicesLoader
 * @description
 * Dynamically loads the Choices.js library from a CDN and exposes a Promise that resolves
 * once the library is available. Also provides access to the loaded `Choices` constructor.
 *
 * Includes debug logging for script loading status using `debugLog`.
 *
 * @example
 * import { choicesLoaded, Choices } from './choicesLoader.js';
 *
 * await choicesLoaded;
 * const element = document.querySelector('#my-select');
 * const choicesInstance = new Choices(element, { removeItemButton: true });
 */

import {debugLog, setDebug} from "./debugLog.js";

// Disable debug logging by default.
// Call setDebug(true) externally to enable.
setDebug(false);

/**
 * @type {?Choices}
 * Will be assigned once Choices.js is loaded and available on window.
 */
let Choices;

/**
 * A Promise that resolves when the Choices.js library is successfully loaded
 * and the `Choices` constructor is available on the global `window` object.
 *
 * @type {Promise<void>}
 *
 * @throws {Error} If the script fails to load or the `Choices` constructor is not found.
 */
const choicesLoaded = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js';

    script.onload = () => {
        Choices = window.Choices;

        if (Choices) {
            debugLog("Choices.js loaded successfully.");
            resolve();
        } else {
            debugLog("Choices.js script loaded, but 'window.Choices' is undefined.");
            reject(new Error("Choices failed to initialize."));
        }
    };

    script.onerror = () => {
        debugLog("Choices.js script failed to load.");
        reject(new Error("Failed to load Choices.js"));
    };

    document.head.appendChild(script);
    debugLog("Choices.js script tag appended to document head.");
});

export {choicesLoaded, Choices};

import {debugLog, setDebug} from "./debugLog.js";
import {padlockLoaded} from "./padlock.js";
import {choicesLoaded} from './choices.js';

import * as generators from "./controls/index.js";

setDebug(true);

/**
 * A Promise that resolves when all necessary control dependencies have loaded.
 * Use this to await before using any control-generating functions.
 *
 * @type {Promise<void>}
 */
export const controlsReady = Promise.all([
    padlockLoaded,
    choicesLoaded,
]).then(() => {
    // Ready to generate controls
});

/**
 * Registry mapping short control type names (e.g. "FontSize")
 * to their corresponding generator functions.
 *
 * @type {Object<string, Function>}
 * @private
 */
const generatorRegistry = Object.fromEntries(
    Object.entries(generators)
        .filter(([fnName, fn]) =>
            typeof fn === "function" &&
            /^generate[A-Z][a-zA-Z0-9]*Control$/.test(fnName) // stricter match
        )
        .map(([fnName, fn]) => {
            const shortName = fnName.replace(/^generate/, "").replace(/Control$/, "");
            return [shortName, fn];
        })
);

debugLog("Registered control generators:", generatorRegistry);

/**
 * An immutable enum-like object containing all valid control type strings.
 * These correspond to the available generator functions.
 *
 * Example:
 * ```js
 * import { ControlTypes } from './controls.js';
 *
 * console.log(ControlTypes.FontSize); // "FontSize"
 * ```
 *
 * @readonly
 * @enum {string}
 */
export const ControlTypes = Object.freeze(
    Object.fromEntries(
        Object.keys(generators)
            .filter(fnName => /^generate[A-Z][a-zA-Z0-9]*Control$/.test(fnName))
            .map(fnName => {
                const shortName = fnName.replace(/^generate/, '').replace(/Control$/, '');
                return [shortName, shortName];
            })
    )
);

/**
 * Generates a UI control by its control type.
 *
 * @param {string} controlType - The type of control to generate.
 *   Must be one of the keys in {@link ControlTypes}.
 * @param {...any} params - Parameters to forward to the control generator function.
 * @returns {DocumentFragment} The generated control DOM fragment.
 * @throws {Error} If the controlType is unsupported or no generator function is registered.
 *
 * @example
 * import { generateControl, ControlTypes } from './controls.js';
 *
 * // Generate a FontSize control
 * const fontSizeControl = generateControl(ControlTypes.FontSize, ".my-class", "font-size", "Font Size");
 */
export function generateControl(controlType, ...params) {
    if (!Object.values(ControlTypes).includes(controlType)) {
        throw new Error(`Unsupported control "${controlType}"`);
    }
    const fn = generatorRegistry[controlType];
    if (!fn) {
        throw new Error(`No generator function registered for control "${controlType}"`);
    }
    return fn(...params);
}

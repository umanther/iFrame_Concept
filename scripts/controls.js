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
 * Generator function type for UI controls.
 *
 * @callback ControlGenerator
 * @param {...any} params - Parameters specific to each control generator.
 * @returns {DocumentFragment} The generated control DOM fragment.
 */

/**
 * Registry mapping short control type names (e.g. "FontSize")
 * to their corresponding generator functions.
 *
 * @type {Object<string, ControlGenerator>}
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
 * Dynamically generates a UI control using a registered control generator.
 *
 * This function acts as a dispatcher that calls the appropriate generator function
 * based on the specified `controlType`. All generator functions are expected to follow
 * the naming convention `generate<ControlName>Control` and must accept the following
 * standardized parameters:
 *
 * - `cssSelector` — A CSS selector string that identifies the DOM element the control modifies.
 * - `cssParameter` — The name of the CSS property the control will manipulate (e.g. `"font-size"`).
 * - `labelText` — The display name for the control's UI label.
 *
 * Available control types are defined in the {@link ControlTypes} enum-like object, which is
 * dynamically generated at runtime based on the available generators.
 *
 * @function
 * @param {string} controlType - The name of the control to generate. Must be a valid key in {@link ControlTypes}, e.g. `"FontSize"`, `"FontFamily"`, `"Color"`.
 * @param {string} cssSelector - The CSS selector for the target element (e.g. `".preview-box"`).
 * @param {string} cssParameter - The CSS property this control modifies (e.g. `"font-size"`, `"color"`).
 * @param {string} labelText - The human-readable label to display beside the control (e.g. `"Font Size"`).
 * @returns {DocumentFragment} A fragment containing the constructed UI control, ready for insertion into the DOM.
 *
 * @throws {Error} Throws if `controlType` is not listed in {@link ControlTypes}.
 * @throws {Error} Throws if no corresponding generator function is registered for the given `controlType`.
 *
 * @example
 * import { generateControl, ControlTypes } from './controls.js';
 *
 * // Create a FontSize control for modifying the font size of .editor-text
 * const fontSizeControl = generateControl(
 *   ControlTypes.FontSize,
 *   'body',
 *   'font-size',
 *   'Font Size'
 * );
 * document.body.appendChild(fontSizeControl);
 *
 * @see {@link ControlTypes} for valid control types.
 */
export function generateControl(controlType, cssSelector, cssParameter, labelText) {
    if (!Object.values(ControlTypes).includes(controlType)) {
        throw new Error(`Unsupported control "${controlType}"`);
    }
    const fn = generatorRegistry[controlType];
    if (!fn) {
        throw new Error(`No generator function registered for control "${controlType}"`);
    }
    return fn(cssSelector, cssParameter, labelText);
}

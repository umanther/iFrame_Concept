import {debugLog, setDebug} from "./debugLog.js";
import {padlockLoaded} from "./padlock.js";
import {choicesLoaded} from './choices.js';

import * as generators from "./controls/index.js";

setDebug(false);

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
 * Generator functions must be registered in `generatorRegistry` using the keys found
 * in {@link ControlTypes}. Each generator must include a `.use` metadata property
 * that tells this dispatcher how to call it:
 *
 * - `use: "style"`  → generator signature: `(cssSelector, cssParameter, labelText)`
 * - `use: "control"` → generator signature: `(id)`
 *
 * The dispatcher is extensible: add new entries to `callPatterns` to support
 * additional `.use` types and their expected argument patterns.
 *
 * @function generateControl
 * @param {string} controlType - A key from {@link ControlTypes} naming the generator to call.
 * @param {...any} args - Arguments to pass through to the generator. The expected arguments
 *                        depend on the generator's `.use` value:
 *                        - If `.use === "style"`: `(cssSelector, cssParameter, labelText)`
 *                        - If `.use === "control"`: `(id)`
 * @returns {any} The value returned by the generator (usually a DocumentFragment).
 *
 * @throws {Error} If `controlType` is not recognized.
 * @throws {Error} If no generator is registered for `controlType`.
 * @throws {Error} If the generator is missing a `.use` property or the `.use` value is unsupported.
 * @throws {Error} If the provided arguments do not meet the simple validation rules for the chosen `.use`.
 *
 * @example
 * // Style-type generator (usual case):
 * generateControl(ControlTypes.FontSize, 'body', 'font-size', 'Font Size');
 *
 * // Control-type generator (single id argument):
 * generateControl(ControlTypes.RadioTabs, 'pageTabs');
 */
export function generateControl(controlType, ...args) {
    // basic controlType check
    if (!Object.values(ControlTypes).includes(controlType)) {
        throw new Error(`Unsupported control "${controlType}"`);
    }

    const fn = generatorRegistry[controlType];
    if (!fn) {
        throw new Error(`No generator function registered for control "${controlType}"`);
    }

    const useType = fn.use;
    if (!useType) {
        throw new Error(`Generator for "${controlType}" is missing required 'use' metadata.`);
    }

    // Centralized, extensible call patterns.
    // Add new keys here for additional .use types.
    const callPatterns = {
        style: ([cssSelector, cssParameter]) => {
            if (typeof cssSelector !== 'string' || !cssSelector.length) {
                throw new Error(`'style' generator for "${controlType}" requires a cssSelector (string) as first argument.`);
            }
            if (typeof cssParameter !== 'string' || !cssParameter.length) {
                throw new Error(`'style' generator for "${controlType}" requires a cssParameter (string) as second argument.`);
            }
            return fn(cssSelector, cssParameter);
        },

        control: ([id]) => {
            if (typeof id !== 'string' || !id.length) {
                throw new Error(`'control' generator for "${controlType}" requires an id (string) as its single argument.`);
            }
            return fn(id);
        },
    };

    const caller = callPatterns[useType];
    if (!caller) {
        throw new Error(`Unsupported 'use' type "${useType}" for control "${controlType}".`);
    }

    return caller(args);
}

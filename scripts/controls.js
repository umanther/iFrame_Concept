import {debugLog, setDebug} from "./debugLog.js";
import {padlockLoaded} from "./padlock.js";
import {choicesLoaded} from './choices.js';

import * as generators from "./controls/index.js"

setDebug(true);

/** Await controlsReady to ensure the controls.js module is ready to be used.
 * @type {Promise<void>} */
export const controlsReady = Promise.all([
    padlockLoaded,
    choicesLoaded,
]).then(() => {
});

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

export function generateControl(controlType, ...params) {
    const fn = generatorRegistry[controlType];
    if (!fn) {
        throw new Error(`Unsupported control “${controlType}”`);
    }
    return fn(...params);
}

/**
 * Used to set whether debugLog() prints to console.log() or not.
 *
 * @type {boolean}
 */
let DEBUG = true;

/**
 * Sets the DEBUG staus for debugLog().
 *
 * @param {boolean} debug - Print debugLog() messages?
 */

function setDebug(debug = true) {
    DEBUG = debug;
}

/**
 * Sends 'args' to console.log() for debugging.
 *
 * @param args - What to print to the console.
 */
function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

export {setDebug, debugLog}
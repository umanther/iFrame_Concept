/**
 * @module debugLog
 * @description
 * Provides a simple debug logging mechanism controllable via `setDebug`.
 * When enabled, `debugLog` prints messages to the console.
 *
 * Includes:
 * - `setDebug`: Enable or disable debug logging.
 * - `debugLog`: Conditionally prints messages to the console.
 */

/**
 * Whether debugLog should print messages.
 * @type {boolean}
 */
let DEBUG = true;

/**
 * Enable or disable debug logging.
 *
 * @param {boolean} [debug=true] - If true, debugLog will print messages; otherwise, it will not.
 */
function setDebug(debug = true) {
    DEBUG = debug;
}

/**
 * Prints messages to the console if debugging is enabled.
 *
 * @param {...any} args - The items to log.
 */
function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

export {setDebug, debugLog};

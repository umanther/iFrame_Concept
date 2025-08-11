/**
 * @module utilities
 * @description
 * Provides general-purpose utility functions for DOM manipulation, number formatting,
 * and string utilities. These are broadly applicable across projects, not tied to specific UI logic.
 *
 * Includes:
 * - `cloneWith`: Clones a DOM element and applies changes to its properties or attributes.
 * - `sanitizeSVGIds`: Ensures unique IDs within cloned SVGs and updates references.
 * - `roundTo`: Rounds numbers to a specified number of decimal places.
 * - `decimalPlaces`: Calculates the number of decimal places in a given number,
 *    supporting standard and exponential notation.
 * - `capitalize`: Capitalizes the first character of a string (for name normalization or labels).
 *
 * @example
 * import { cloneWith, sanitizeSVGIds, roundTo, decimalPlaces, capitalize } from './utilities.js';
 *
 * const rounded = roundTo(3.14159, 2);      // 3.14
 * const decimals = decimalPlaces(1.23e-4);  // 6
 * const clone = cloneWith(el, { id: "copy" });
 * const idMap = sanitizeSVGIds(svgEl);
 * const label = capitalize("option");       // "Option"
 */

import {setDebug, debugLog} from "./debugLog.js";

// Disable debug logging by default.
// Call setDebug(true) externally to enable.
setDebug(false);

/** Clone an element and immediately apply a set of property or attribute changes.
 *
 * @param {Element} source
 *   The element to clone.
 * @param {Object<string, any>} [changes={}]
 *   An object whose keys are properties or attributes to set on the clone.
 *   - If the key exists as a property on the element, it will be assigned.
 *   - Otherwise, it will be set as an HTML attribute.
 * @param {boolean} [deep=true]
 *   Whether to perform a deep clone or not.
 * @returns {Element|null}
 *   The modified clone, or `null` if the source does not support cloning.
 *
 * @note Does not throw; logs a warning if source is not cloneable.
 *
 * @example
 * const clone = cloneWith(element, { id: "new-id" });
 * if (!clone) {
 *   // Handle clone failure gracefully
 * }
 */
export function cloneWith(source, changes = {}, deep = true) {
    if (!source || typeof source.cloneNode !== 'function') {
        console.warn("cloneWith: source is null or does not support cloneNode, returning null");
        debugLog("cloneWith: Invalid source provided:", source);
        return null;
    }

    debugLog("cloneWith: Cloning element with changes", changes);

    const clone = source.cloneNode(deep);

    for (const [key, value] of Object.entries(changes)) {
        if (key in clone) {
            try {
                clone[key] = value;
                if (clone[key] !== value) {
                    debugLog(`cloneWith: Property assignment fallback for key '${key}'`);
                    clone.setAttribute(key, value);
                } else {
                    debugLog(`cloneWith: Property '${key}' set successfully`);
                }
            } catch (e) {
                debugLog(`cloneWith: Exception assigning property '${key}', falling back to setAttribute`, e);
                clone.setAttribute(key, value);
            }
        } else {
            debugLog(`cloneWith: Setting attribute '${key}'`);
            clone.setAttribute(key, value);
        }
    }

    debugLog("cloneWith: Clone complete", clone);
    return clone;
}

/**
 * Sanitizes all IDs within an SVG element by appending a unique random suffix,
 * and updates any references to those IDs within attributes and embedded styles.
 *
 * This prevents ID collisions when cloning or embedding SVGs multiple times in a document.
 *
 * @param {SVGElement} svg - The SVG element to sanitize.
 * @param {boolean} [verbose=false] - Whether to log warnings for invalid inputs.
 * @returns {Map<string, string> | undefined}
 *   A Map of original IDs to their new unique versions, or undefined if input was invalid.
 */
export function sanitizeSVGIds(svg, verbose = false) {
    if (!(svg instanceof SVGElement)) {
        if (verbose) {
            console.warn("sanitizeSVGIds was passed a non-SVG element:", svg);
        }
        debugLog("sanitizeSVGIds: Invalid svg element provided", svg);
        return;
    }

    debugLog("sanitizeSVGIds: Starting sanitization of SVG IDs");

    const idMap = new Map();
    const usedIds = new Set();
    const randomSuffix = () => Math.random().toString(36).slice(2, 8);

    // Step 1: Collect existing IDs
    svg.querySelectorAll('[id]').forEach(el => usedIds.add(el.id));
    debugLog("sanitizeSVGIds: Existing IDs collected", [...usedIds]);

    // Step 2: Generate new unique IDs
    svg.querySelectorAll('[id]').forEach(el => {
        const oldId = el.id;
        let newId;
        do {
            newId = `${oldId}-${randomSuffix()}`;
        } while (usedIds.has(newId));
        usedIds.add(newId);
        idMap.set(oldId, newId);
        el.id = newId;
        debugLog(`sanitizeSVGIds: ID '${oldId}' changed to '${newId}'`);
    });

    // Step 3: Update attribute references
    const attrList = [
        'href', 'xlink:href', 'filter', 'clip-path', 'mask',
        'fill', 'stroke', 'marker-start', 'marker-mid', 'marker-end'
    ];

    svg.querySelectorAll('*').forEach(el => {
        for (const attr of attrList) {
            const val = el.getAttribute(attr);
            if (!val) continue;

            const urlMatch = val.match(/^url\(#(.+)\)$/);
            const hrefMatch = val.match(/^#(.+)$/);
            if (urlMatch && idMap.has(urlMatch[1])) {
                el.setAttribute(attr, `url(#${idMap.get(urlMatch[1])})`);
                debugLog(`sanitizeSVGIds: Updated attribute '${attr}' url(#${urlMatch[1]}) to url(#${idMap.get(urlMatch[1])})`);
            } else if (hrefMatch && idMap.has(hrefMatch[1])) {
                el.setAttribute(attr, `#${idMap.get(hrefMatch[1])}`);
                debugLog(`sanitizeSVGIds: Updated attribute '${attr}' #${hrefMatch[1]} to #${idMap.get(hrefMatch[1])}`);
            }
        }
    });

    // Step 4: Update embedded CSS in <style> tags
    svg.querySelectorAll('style').forEach(styleEl => {
        let cssText = styleEl.textContent;
        if (!cssText) return;

        cssText = cssText.replace(/url\(#([^)]+)\)/g, (match, id) => {
            if (idMap.has(id)) {
                debugLog(`sanitizeSVGIds: Replacing CSS url(#${id}) with url(#${idMap.get(id)})`);
                return `url(#${idMap.get(id)})`;
            }
            return match;
        });

        styleEl.textContent = cssText;
    });

    debugLog("sanitizeSVGIds: Sanitization complete", idMap);
    return idMap;
}

/**
 * Rounds a number to given decimal precision.
 *
 * @param {number} value - The number to round.
 * @param {number} precision - Number of decimal places (0 = whole number).
 * @returns {number} The rounded number.
 */
export function roundTo(value, precision) {
    return Math.round(value * (10 ** precision)) / (10 ** precision);
}

/**
 * Returns the number of decimal places in a given number.
 *
 * Handles standard decimal notation and scientific (exponential) notation.
 *
 * @param {number} num - The number to analyze.
 * @returns {number} The count of decimal places. Zero if the number is an integer.
 *
 * @example
 * decimalPlaces(3.14159); // 5
 * decimalPlaces(10);      // 0
 * decimalPlaces(1.23e-4); // 6
 */
export function decimalPlaces(num) {
    const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) return 0;
    const frac = match[1] ? match[1].length : 0;
    const exp = match[2] ? +match[2] : 0;
    return Math.max(0, frac - exp);
}

/**
 * Capitalizes the first character of a string, leaving the rest unchanged.
 *
 * @param {string} str - The input string to capitalize.
 * @returns {string} A new string with the first character uppercased.
 *
 * @example
 * capitalize("hello");   // "Hello"
 * capitalize("World");   // "World"
 * capitalize("");        // ""
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitizes a string for use as a valid HTML id by trimming whitespace
 * and replacing all internal whitespace sequences with underscores.
 *
 * This ensures the returned string is safe to use as an HTML id attribute,
 * which must not contain spaces.
 *
 * @param {string} str - The input string to sanitize.
 * @returns {string} A sanitized string suitable for use as an HTML id.
 *
 * @example
 * sanitizeId("  My Tab 1 ") // returns "My_Tab_1"
 */
export function sanitizeId(str) {
    return str.trim().replace(/\s+/g, '_');
}

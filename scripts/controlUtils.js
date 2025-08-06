/**
 * @module controlUtils
 * @description
 * Shared utility functions and constants specifically used by control components
 * in the style editor system. These utilities are not general-purpose and are
 * designed to support control-related logic, including ID generation, DOM property
 * assignment, and padlock SVG styling.
 *
 * Exports:
 * - `generateID`: Combines a selector and parameter into a single ID string.
 * - `splitID`: Extracts selector and parameter from a compound ID.
 * - `assignProps`: Applies both properties and styles to a DOM element.
 * - `padlockStyles`: Default inline styles for padlock icons used in controls.
 *
 * @example
 * import { generateID, assignProps, padlockStyles } from './controlUtils.js';
 */


/** Default padlock styles, applied in controls */
const padlockStyles = {
    display: 'inline-block',
    width: '1.5em',
    marginRight: '.25em',
    marginBottom: '-.25em',
    userSelect: 'none'
};

/** Delimiter used in generateID and splitID */
const delimiter = '-_-';

/**
 * Returns a joined string of a CSS selector and parameter.
 *
 * @param {string} selector - A valid CSS selector.
 * @param {string} parameter - A valid CSS parameter.
 * @returns {string}
 */
function generateID(selector, parameter) {
    return selector + delimiter + parameter;

}

/**
 * Splits a delimited string into selector and parameter parts.
 *
 * @param {string} ID - The combined ID string to split.
 * @returns {{selector: string, parameter: string}}
 */
function splitID(ID) {
    const split = ID.split(delimiter);
    return {
        selector: split[0],
        parameter: split[1]
    };
}

/**
 * Assign properties and CSS styles to a DOM element.
 *
 * @param {Element} element - The target DOM element to modify.
 * @param {Object} [props={}] - Key-value pairs to assign as properties.
 * @param {Object} [styles={}] - CSS property-value pairs to assign to element.style.
 */
function assignProps(element, props = {}, styles = {}) {
    // Assign properties to the element directly
    for (const [key, value] of Object.entries(props)) {
        try {
            element[key] = value;
        } catch {
            // Fallback to attribute if property assignment fails
            element.setAttribute(key, value);
        }

    }
    // Assign styles
    for (const [key, value] of Object.entries(styles)) {
        try {
            element.style[key] = value;
        } catch {
            element.style.setProperty(key, value);
        }
    }

}

export {
    generateID,
    splitID,
    assignProps,
    padlockStyles,
};

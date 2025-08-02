import {debugLog, setDebug} from "./debugLog.js";

setDebug(true);

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
        const response = await fetch('assets/padlock.svg');
        const svgText = await response.text();

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) {
            throw new Error("SVG root <svg> not found");
        }

        padlockTemplate = svgElement;
        debugLog("Padlock SVG loaded:", padlockTemplate);

        resolvePadlockLoaded(); // resolve the shared Promise
    } catch (error) {
        console.error("Failed to load padlock.svg:", error);
    }
}

// ⏳ Begin loading the padlock as soon as the module runs
loadPadlockSVG();

/** Delimiter used in generateID and splitID. @type {string} */
const delimiter = '-_-';

/**
 * Returns a joined string of a CSS selector and parameter.
 * @param {string} selector - A valid CSS selector.
 * @param {string} parameter - A valid CSS parameter.
 * @returns {string}
 */
function generateID(selector, parameter) {
    return selector + delimiter + parameter;
}

/**
 * Splits a delimited string into selector and parameter parts.
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

/** Clamps the value between min and max.
 *
 * @param {number} min - Minium value allowed.
 * @param {number} max - Maximum value allowed.
 * @param {number} value - Value to clamped.
 * @returns {number}
 */
function clamp(min, max, value) {
    return Math.min(Math.max(value, min), max);
}

/** Generates a size control set.
 *
 * @param {string} cssSelector - String denoting the CSS Selector this control sets.
 * @param {string} cssParameter - String denoting the CSS Parameter this control sets.
 * @param {string} labelText - Text to use for the label.
 * @returns {DocumentFragment}
 */
function generateFontSizeControl(cssSelector, cssParameter, labelText) {
    if (!padlockTemplate) {
        throw new Error("Padlock SVG not loaded yet — wait for controlsReady before calling.");
    }
    let defaultPxSize = 16;

    /** Converts px to em using default font size
     *
     * @param pxSize
     * @returns {number}
     */
    function pxToEm(pxSize) {
        return roundTo(pxSize / defaultPxSize, 1);
    }

    /** Converts em to px using default font size
     *
     * @param emSize
     * @returns {number}
     */
    function emToPx(emSize) {
        return roundTo(emSize * defaultPxSize, 0);
    }

    /** Rounds a number to given decimal precision.
     *
     * @param {number} value - The number to round.
     * @param {number} precision - How many decimal places to keep (e.g., 0 = whole number, 1 = tenths, 2 = hundredths).
     * @returns {number} The rounded number.
     */
    function roundTo(value, precision) {
        return Math.round(value * (10 ** precision)) / (10 ** precision);
    }

    let setID = generateID(cssSelector, cssParameter);

    const breakEl = document.createElement("br");
    const padlock = padlockTemplate.cloneNode(true);
    padlock.id = setID + '-padlock';
    padlock.style.width = '1.5em';
    padlock.style.marginRight = '.25em';
    padlock.style.marginBottom = '-.25em';
    padlock.style.userSelect = 'none';
    padlock.setAttribute('data-locked', 'false');

    const label = document.createElement("label");
    label.id = setID;
    label.textContent = labelText;
    label.setAttribute("for", setID + "-input");

    const sizeInput = document.createElement("input");
    sizeInput.setAttribute("id", setID + "-input");
    sizeInput.type = "number";
    sizeInput.id = setID + '-input';
    sizeInput.style.width = "2.5em";

    const unitSpan = document.createElement('span');
    unitSpan.id = setID + "-span";
    unitSpan.textContent = "em";
    unitSpan.style.padding = '.25em';
    unitSpan.style.userSelect = 'none';

    const sizeSlider = document.createElement("input");
    sizeSlider.id = setID + "-slider";
    sizeSlider.type = "range";

    Object.defineProperty(label, 'min', {
        get() {
            // Return the current max from one of the inputs (assuming they're synced)
            return Number(sizeInput.min);
        },
        set(value) {
            const stringVal = value.toString();
            sizeInput.min = stringVal;
            sizeSlider.min = stringVal;
        }
    });
    Object.defineProperty(label, 'max', {
        get() {
            // Return the current max from one of the inputs (assuming they're synced)
            return Number(sizeInput.max);
        },
        set(value) {
            const stringVal = value.toString();
            sizeInput.max = stringVal;
            sizeSlider.max = stringVal;
        }
    });
    Object.defineProperty(label, 'step', {
        /** Get step value of control set
         * @returns {number} */
        get() {
            // Return the current max from one of the inputs (assuming they're synced)
            return Number(sizeInput.step);
        },
        /** Set step value for control set
         * @param {number} value */
        set(value) {
            const stringVal = value.toString();
            sizeInput.step = stringVal;
            sizeSlider.step = stringVal;
        }
    });
    /** Sets all control parameters
     * @param {number} max - Maximum font size
     * @param {number} min - Minimum font size
     * @param {number} step - Font size step value */
    label.setParams = (min, max, step) => {
        label.min = min;
        label.max = max;
        label.step = step;
    }

    Object.defineProperty(label, 'value', {
        /** Get value of control set
         * @returns {number} */
        get() {
            // Return the current max from one of the inputs (assuming they're synced)
            return Number(sizeInput.value);
        },
        /** Set value for control set
         * @param {number} value */
        set(value) {
            value = clamp(label.min, label.max, value);

            const stringVal = value.toString();
            sizeInput.value = stringVal;
            sizeSlider.value = stringVal;
            label.dispatchEvent(new Event('change'));
        }
    });
    Object.defineProperty(label, 'valueToString', {
        /** Get value of control set
         * @returns {string} */
        get() {
            // Return the current max from one of the inputs (assuming they're synced)
            return sizeInput.value.toString() + unitSpan.textContent;
        }
    });
    Object.defineProperty(label, 'property', {
        /** Get value of control set
         * @returns {string} */
        get() {
            // Return the current max from one of the inputs (assuming they're synced)
            return `${cssParameter}: ${sizeInput.value.toString()}${unitSpan.textContent}`;
        }
    });
    Object.defineProperty(label, 'locked', {
        /** Get lock state of control set
         * @returns {boolean} */
        get() {
            return padlock.getAttribute('data-locked') === 'true';
        },
        /** Set lock state for control set
         * @param {boolean} value */
        set(value) {
            padlock.setAttribute('data-locked', value.toString());
        }
    });

    padlock.addEventListener("click", () => {
        const currentState = label.locked;
        label.locked = !currentState;

        //TODO: disable controls, visually and functionally
    });

    sizeInput.addEventListener("input", () => {
        label.value = sizeInput.value;
    });

    sizeSlider.addEventListener("input", () => {
        label.value = sizeSlider.value;
    });

    unitSpan.addEventListener("click", () => {
        if (unitSpan.textContent === 'em') {
            unitSpan.textContent = 'px';
            label.setParams(emToPx(label.min), emToPx(label.max), emToPx(label.step))
            label.value = emToPx(label.value);
        } else if (unitSpan.textContent === 'px') {
            unitSpan.textContent = 'em';
            label.setParams(pxToEm(label.min), pxToEm(label.max), pxToEm(label.step))
            label.value = pxToEm(label.value);
        }
    });

    label.setParams(0, 5, 0.1);
    label.value = 1;

    label.appendChild(sizeInput);
    label.appendChild(unitSpan);
    label.appendChild(breakEl.cloneNode());
    label.appendChild(sizeSlider);

    let result = new DocumentFragment();

    result.append(padlock);
    result.append(label);

    return result;
}

/*********************************TEST AREA*********************************/
/***/


/***************************************************************************/

/** Await controlsReady to ensure the controls.js module is ready to be used.
 * @type {Promise<void>} */
const controlsReady = Promise.all([
    padlockLoaded
]).then(() => {
});

export {controlsReady, generateID, generateFontSizeControl};

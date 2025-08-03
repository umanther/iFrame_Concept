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

    //-------------------------------------UTILITY FUNCTION-------------------------------------

    const defaultPxSize = 16;
    // These are in em.  Min and max px would be appropriately converted
    const minimumMin = 0;
    const maximumMax = 10;

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

    /**
     * Creates an <option> element with the given value.
     *
     * @param {string|number} value - The value to assign to the option.
     * @returns {HTMLOptionElement} The created option element.
     */
    function createOption(value) {
        const option = document.createElement('option');
        option.value = value.toString();
        return option;
    }

    let setID = generateID(cssSelector, cssParameter);

    //-------------------------------------DEFINE COMPONENTS-------------------------------------

    const breakEl = document.createElement("br");

    const div = document.createElement("div");
    div.id = setID;
    div.style.display = "inline-block";

    const padlock = padlockTemplate.cloneNode(true);
    padlock.id = setID + '-padlock';
    padlock.style.width = '1.5em';
    padlock.style.marginRight = '.25em';
    padlock.style.marginBottom = '-.25em';
    padlock.style.userSelect = 'none';
    padlock.setAttribute('data-locked', 'false');

    const label = document.createElement("label");
    label.id = setID + '-label';
    label.textContent = labelText;
    label.setAttribute("for", setID + "-input");
    label.style.userSelect = 'none';

    const sizeInput = document.createElement("input");
    sizeInput.id = setID + '-input';
    sizeInput.type = "number";
    sizeInput.style.width = "2.5em";

    const unitSpan = document.createElement('span');
    unitSpan.id = setID + "-span";
    unitSpan.textContent = "em";
    unitSpan.style.display = "inline-block";
    unitSpan.style.padding = '.25em';
    unitSpan.style.width = '1em';
    unitSpan.style.userSelect = 'none';

    const dataList = document.createElement("datalist");
    dataList.id = setID + '-dataList';

    const sizeSlider = document.createElement("input");
    sizeSlider.id = setID + "-slider";
    sizeSlider.type = "range";
    sizeSlider.style.width = "100%";
    sizeSlider.setAttribute('list', dataList.id);

    //-------------------------------------ADD PROPERTIES-------------------------------------

    Object.defineProperty(div, 'min', {
        get() {
            return Number(sizeInput.min);
        },
        set(value) {
            // Convert minimumMin to current unit
            let unitMin = unitSpan.textContent === 'px' ? emToPx(minimumMin) : minimumMin;

            let clamped = Math.max(unitMin, Number(value));

            // Clamp to max as well
            if (clamped > div.max) {
                clamped = div.max;
            }

            sizeInput.min = clamped.toString();
            sizeSlider.min = clamped.toString();

            div.refreshOptions();
        }
    });
    Object.defineProperty(div, 'max', {
        get() {
            return Number(sizeInput.max);
        },
        set(value) {
            // Convert maximumMax to current unit
            let unitMax = unitSpan.textContent === 'px' ? emToPx(maximumMax) : maximumMax;

            let clamped = Math.min(unitMax, Number(value));

            if (clamped < div.min) {
                clamped = div.min;
            }

            sizeInput.max = clamped.toString();
            sizeSlider.max = clamped.toString();

            div.refreshOptions();
        }
    });
    Object.defineProperty(div, 'step', {
        /** Get step value of control set
         * @returns {number} */
        get() {
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
    div.setParams = (min, max, step) => {
        // Convert minimumMin and maximumMax to current unit
        const unitMin = unitSpan.textContent === 'px' ? emToPx(minimumMin) : minimumMin;
        const unitMax = unitSpan.textContent === 'px' ? emToPx(maximumMax) : maximumMax;

        min = Math.max(unitMin, min);
        max = Math.min(unitMax, max);
        if (min > max) max = min;

        div.min = min;
        div.max = max;
        div.step = step;
    };

    Object.defineProperty(div, 'value', {
        /** Get value of control set
         * @returns {number} */
        get() {
            return Number(sizeInput.value);
        },
        /** Set value for control set
         * @param {number} value */
        set(value) {
            value = Math.min(Math.max(value, div.min), div.max)

            const stringVal = value.toString();
            sizeInput.value = stringVal;
            sizeSlider.value = stringVal;
            div.dispatchEvent(new Event('change'));
        }
    });
    Object.defineProperty(div, 'valueToString', {
        /** Get value of control set
         * @returns {string} */
        get() {
            return sizeInput.value.toString() + unitSpan.textContent;
        }
    });
    Object.defineProperty(div, 'cssPair', {
        /** Get Object containing CSS selector and parameter
         * @returns {{selector: string, parameter: string}} */
        get() {
            return splitID(div.id);
        }
    });
    Object.defineProperty(div, 'cssSelector', {
        /** Get CSS Selector value
         * @returns {string} */
        get() {
            return div.cssPair.selector;
        }
    });
    Object.defineProperty(div, 'cssParameter', {
        /** Get CSS Parameter value
         * @returns {string} */
        get() {
            return div.cssPair.parameter;
        }
    });
    Object.defineProperty(div, 'cssDeclaration', {
        /** Get CSS Declaration value
         * @returns {string} */
        get() {
            return `${div.cssPair.parameter}: ${div.valueToString}`;
        }
    });
    Object.defineProperty(div, 'locked', {
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

    /**
     * Adds a single <option> element to the datalist.
     *
     * @param {string|number} value - The value to assign to the option.
     */
    div.addOption = (value) => {
        dataList.appendChild(createOption(value));
    };
    /**
     * Adds multiple <option> elements to the datalist from any iterable source.
     *
     * The function extracts a value from each item using the following rules:
     * - If the item is a primitive, it is used directly.
     * - If the item is an array, the first element is used.
     * - If the item is an object with a `value` key, that value is used.
     * - Otherwise, the first key of the object is used as the value.
     *
     * @param {Iterable<any>} values - An iterable collection of values or value-containing items.
     */
    div.addOptions = (values) => {
        const frag = new DocumentFragment();

        for (const item of values) {
            let value;

            if (typeof item === 'object' && item !== null) {
                if (Array.isArray(item)) {
                    value = item[0];
                } else if ('value' in item) {
                    value = item.value;
                } else {
                    const keys = Object.keys(item);
                    value = keys.length > 0 ? keys[0] : '';
                    // Optionally: console.warn('Item has no keys:', item);
                }
            } else {
                value = item;
            }

            frag.appendChild(createOption(value));
        }

        dataList.appendChild(frag);
    };


    /** Clears all Options from the dataList */
    div.clearOptions = () => {
        dataList.innerHTML = '';
    };
    /** Repopulates datalist based on current min, max, and unit.
     * Converts values to em when unit is px. */
    div.refreshOptions = () => {
        div.clearOptions();

        const step = 1;

        // Convert min and max to em as base unit for generating options
        let minEm = unitSpan.textContent === 'px' ? pxToEm(div.min) : div.min;
        let maxEm = unitSpan.textContent === 'px' ? pxToEm(div.max) : div.max;

        // Normalize minEm and maxEm so minEm <= maxEm
        if (minEm > maxEm) [minEm, maxEm] = [maxEm, minEm];

        // Number of steps (inclusive)
        const count = Math.floor((maxEm - minEm) / step) + 1;

        // Generate array in em
        const emValues = Array.from({length: count}, (_, i) => minEm + i * step);

        // Convert back to px if unit is px; otherwise keep em
        const values = emValues.map(v =>
            unitSpan.textContent === 'px' ? emToPx(v) : v
        ).map(v => roundTo(v, 1));

        div.addOptions(values);
    };


    //-------------------------------------EVENT LISTENERS-------------------------------------

    padlock.addEventListener("click", () => {
        const currentState = div.locked;
        const flippedState = !currentState;
        div.locked = flippedState;

        sizeInput.disabled = flippedState;
        sizeSlider.disabled = flippedState;
        label.style.opacity = flippedState ? '0.5' : '1'
        label.style.pointerEvents = flippedState ? 'none' : 'auto';
    });

    sizeInput.addEventListener("input", () => {
        div.value = sizeInput.value;
    });

    sizeSlider.addEventListener("input", () => {
        div.value = sizeSlider.value;
    });

    unitSpan.addEventListener("click", () => {
        if (unitSpan.textContent === 'em') {
            unitSpan.textContent = 'px';
            div.setParams(emToPx(div.min), emToPx(div.max), emToPx(div.step))
            div.value = emToPx(div.value);
        } else if (unitSpan.textContent === 'px') {
            unitSpan.textContent = 'em';
            div.setParams(pxToEm(div.min), pxToEm(div.max), pxToEm(div.step))
            div.value = pxToEm(div.value);
        }
    });

    //-------------------------------------SET DEFAULTS-------------------------------------

    div.setParams(0, 5, 0.1);
    div.value = 1;

    //-------------------------------------ASSEMBLE CONTROL-------------------------------------

    label.appendChild(sizeInput);
    label.appendChild(unitSpan);
    label.appendChild(breakEl.cloneNode());
    label.appendChild(sizeSlider);
    label.appendChild(dataList);

    div.append(padlock);
    div.append(label);

    let result = new DocumentFragment();

    result.append(div);

    return result;
}


/** Await controlsReady to ensure the controls.js module is ready to be used.
 * @type {Promise<void>} */
const controlsReady = Promise.all([
    padlockLoaded
]).then(() => {
});

export {controlsReady, generateID, generateFontSizeControl};

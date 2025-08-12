import {padlockTemplate} from "../padlock.js";
import {assignProps, generateID, padlockStyles, splitID} from "../controlUtils.js";
import {roundTo} from "../utilities.js";

const mkErr = (msg) => {
    throw new Error(`[FontSize Control] ${msg}`);
};

export const generateFontSizeControl = Object.assign(
    /** Generates a FontSize control set.
     *
     * @param {string} cssSelector - String denoting the CSS Selector this control sets.
     * @param {string} cssParameter - String denoting the CSS Parameter this control sets.
     * @param {string} labelText - Text to use for the label.
     * @returns {HTMLDivElement}
     */
    function generateFontSizeControl(cssSelector, cssParameter) {
        if (!padlockTemplate) {
            throw new Error("Padlock SVG not loaded yet — wait for controlsReady before calling.");
        }

        //-------------------------------------UTILITY FUNCTION-------------------------------------

        const defaultUnitSize = 16;
        const defaultUnitType = 'px';  // Update typedef below if changing
        /** The allowed unit types for size values.
         * Currently, supports:
         * - 'px' (pixels)
         * - 'em' (ems)
         *
         * @typedef {'px'|'em'} allowedUnits
         */

            // These are in pt.  Min and max pt would be appropriately converted
        const minimumMin = roundTo(0 * defaultUnitSize, 0);
        const maximumMax = roundTo(7 * defaultUnitSize, 0);

        // Back-end storage
        let _min = 0,
            _max = 0,
            _value = 0

        // Defaults to reset to
        let _defaultMin = 0,
            _defaultMax = 0,
            _defaultValue = 0,
            _defaultUnits = defaultUnitType

        /** Converts to em using default font size
         *
         * @param ptSize
         * @returns {number}
         */
        function ptToEm(ptSize) {
            return ptSize / defaultUnitSize;
        }

        /** Converts em to pt using default font size
         *
         * @param emSize
         * @returns {number}
         */
        function emToPt(emSize) {
            return emSize * defaultUnitSize;
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

        const setID = generateID(cssSelector, cssParameter);

        const updateControls = (withEvent = false) => {
            const normValue = div.units === defaultUnitType ? roundTo(_value, 0) : roundTo(ptToEm(_value), 1);
            const normMin = div.units === defaultUnitType ? roundTo(_min, 0) : roundTo(ptToEm(_min), 1);
            const normMax = div.units === defaultUnitType ? roundTo(_max, 0) : roundTo(ptToEm(_max), 1);
            const normStep = div.units === defaultUnitType ? 1 : 0.1;

            Object.assign(sizeInput, {
                min: normMin.toString(),
                max: normMax.toString(),
                step: normStep.toString(),
                value: normValue.toString()
            });

            Object.assign(sizeSlider, {
                min: normMin.toString(),
                max: normMax.toString(),
                step: normStep.toString(),
                value: normValue.toString()
            });

            div.refreshOptions();

            if (withEvent) div.dispatchEvent(new Event('change'));
        };

        //-------------------------------------DEFINE COMPONENTS-------------------------------------

        const div = document.createElement("div");
        assignProps(div, {
            id: setID, 'data-control': 'FontSize',
        }, {
            display: "inline-block", margin: '.25em',
        });

        const padlock = padlockTemplate.cloneWith({
            id: `${setID}-padlock`, 'data-locked': 'false'
        });
        Object.assign(padlock.style, padlockStyles);

        const label = document.createElement("label");
        assignProps(label, {
            id: `${setID}-label`,
            textContent: 'Font Size',
            for: `${setID}-input`
        }, {
            userSelect: 'none'
        });

        const sizeInput = document.createElement("input");
        assignProps(sizeInput, {
            id: `${setID}-input`, type: "number"
        }, {
            width: "3em"
        });

        const unitSpan = document.createElement('span');
        assignProps(unitSpan, {

            id: `${setID}-span`, textContent: "pt"
        }, {
            display: "inline-block",
            padding: '.25em',
            width: '1em',
            userSelect: 'none',
            cursor: 'pointer',
            textDecoration: 'underline'
        });

        const dataList = document.createElement("datalist");
        assignProps(dataList, {
            id: `${setID}-dataList`
        }, {});

        const sizeSlider = document.createElement("input");
        assignProps(sizeSlider, {
            id: setID + "-slider", type: "range", 'list': dataList.id
        }, {
            width: "100%"
        });

        //-------------------------------------ADD PROPERTIES-------------------------------------

        Object.defineProperty(div, 'value', {
            get() {
                return div.units === defaultUnitType ? roundTo(_value, 0) : roundTo(ptToEm(_value), 1);
            },
            set(val) {
                // Parse input to number explicitly
                const numVal = typeof val === 'number' ? val : parseFloat(val);
                if (!Number.isFinite(numVal)) {
                    console.warn(`[FontSizeControl] Invalid value set: ${val}. Ignoring.`);
                    return; // Ignore invalid input without throwing error
                }

                let normValue = div.units === defaultUnitType ? roundTo(numVal, 0) : emToPt(roundTo(numVal, 1));
                normValue = Math.max(Math.min(normValue, _max), _min);

                _value = normValue;
                updateControls(true);
            }
        });

        Object.defineProperty(div, 'label', {
            get() {
                if (label.firstChild && label.firstChild.nodeType === Node.TEXT_NODE) {
                    return label.firstChild.textContent;
                }
                return '';
            },
            set(text) {
                let textNode = undefined;
                if (label.firstChild) {
                    textNode = label.firstChild.nodeType === Node.TEXT_NODE ? label.firstChild : null
                }
                if (textNode) {
                    textNode.textContent = text;
                } else {
                    label.insertBefore(document.createTextNode(text), label.firstChild);
                }
            }
        });

        Object.defineProperty(div, 'min', {
            get() {
                return div.units === defaultUnitType ? roundTo(_min, 0) : roundTo(ptToEm(_min), 1);
            },
            set(val) {
                _min = div.units === defaultUnitType ? roundTo(val, 0) : emToPt(roundTo(val, 1));

                _min = Math.max(_min, minimumMin);

                _value = Math.max(_min, _value);
                updateControls();
            }
        });

        Object.defineProperty(div, 'max', {
            get() {
                return div.units === defaultUnitType ? roundTo(_max, 0) : roundTo(ptToEm(_max), 1);
            },
            set(val) {
                _max = div.units === defaultUnitType ? roundTo(val, 0) : emToPt(roundTo(val, 1));

                _max = Math.min(_max, maximumMax);

                _value = Math.min(_max, _value);
                updateControls();
            }
        });

        Object.defineProperty(div, 'units', {
            get() {
                return unitSpan.textContent;
            },
            set(newUnit) {
                if (newUnit === 'em' || newUnit === defaultUnitType) {
                    unitSpan.textContent = newUnit;
                    updateControls(true);
                } else {
                    console.warn(`Unsupported unit: ${newUnit}`);
                }
            }
        });

        Object.defineProperty(div, 'asString', {
            /** Get value of control set
             * @returns {string} */
            get() {
                return `${div.value}${div.units}`;
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
                return `${div.cssPair.parameter}: ${div.asString}`;
            }
        });

        Object.defineProperty(div, 'locked', {
            /** Get lock state of control set
             * @returns {boolean} */
            get() {
                return padlock.getAttribute('data-locked') === 'true';
            }, /** Set lock state for control set
             * @param {boolean} value */
            set(value) {
                padlock.setAttribute('data-locked', value.toString());

                sizeInput.disabled = div.locked;
                sizeSlider.disabled = div.locked;
                label.style.opacity = div.locked ? '0.5' : '1'
                label.style.pointerEvents = div.locked ? 'none' : 'auto';
            }
        });

        div.reset = () => {

            Object.assign(div, {
                units: _defaultUnits,
                min: _defaultMin,
                max: _defaultMax,
                value: _defaultValue
            })

            // Refresh the options
            div.refreshOptions();
        };

        /**
         * Save the default configuration for this control.
         *
         * This function:
         *  - Requires *all* four main parameters in the first argument object: `units`, `min`, `max`, and `value`.
         *  - Rejects missing or `undefined` values for any of the above (all-or-nothing requirement).
         *  - Validates units against allowed types (`defaultUnitType` or `'em'`).
         *  - Converts numeric values to points for validation.
         *  - Enforces absolute bounds (`minimumMin` / `maximumMax`) and logical constraints:
         *      - `min` ≤ `max`
         *      - `value` within the `[min, max]` range
         *  - Stores defaults in the given display units, rounded appropriately:
         *      - Whole number rounding for `defaultUnitType`
         *      - One decimal place for `em`
         *  - Optionally calls `div.reset()` if `withReset` is `true`.
         *
         * @function setDefaults
         * @param {Object} params - Configuration object containing:
         * @param {allowedUnits} params.units - Unit type for the defaults (`defaultUnitType` or `'em'`).
         * @param {number|string} params.min - Default minimum value in specified units.
         * @param {number|string} params.max - Default maximum value in specified units.
         * @param {number|string} params.value - Default starting value in specified units.
         * @param {boolean} [withReset=false] - If true, immediately applies defaults by calling `div.reset()`.
         * @throws {Error} If any required parameter is missing, invalid, or violates bounds/logic.
         * @returns {void} Does not return anything.
         */
        div.setDefaults = ({units, min, max, value}, withReset = false) => {
            const mkErrSD = (msg) => {
                mkErr(`[setDefaults] ${msg}`);
            };
            // All-or-nothing: every property must be present and not undefined
            if ([units, min, max, value].some(v => v === undefined)) {
                mkErrSD(`All parameters { units, min, max, value } must be provided.`);
            }

            // Validate units
            if (units !== defaultUnitType && units !== 'em') {
                mkErrSD(`Invalid units "${units}". Allowed: ${defaultUnitType} or 'em'.`);
            }

            // Parse numbers strictly
            const toNumberStrict = (raw, name) => {
                const n = (typeof raw === 'number') ? raw : parseFloat(raw);
                if (!Number.isFinite(n)) mkErrSD(`[setDefaults] ${name} must be a finite number (got: ${String(raw)}).`);
                return n;
            };

            const nMin = toNumberStrict(min, 'min');
            const nMax = toNumberStrict(max, 'max');
            const nValue = toNumberStrict(value, 'value');

            // Convert to pt for validation
            const toPt = (num, unit) => unit === defaultUnitType ? num : emToPt(num);
            const minPt = toPt(nMin, units);
            const maxPt = toPt(nMax, units);
            const valuePt = toPt(nValue, units);

            // Absolute bounds checks
            if (minPt < minimumMin) mkErrSD(`min (${minPt}pt) is below absolute minimum (${minimumMin}pt).`);
            if (maxPt > maximumMax) mkErrSD(`max (${maxPt}pt) exceeds absolute maximum (${maximumMax}pt).`);

            // Logical ordering checks
            if (minPt > maxPt) mkErrSD(`min (${minPt}pt) is greater than max (${maxPt}pt).`);
            if (valuePt < minPt || valuePt > maxPt) {
                mkErrSD(`value (${valuePt}pt) is outside the range [${minPt}pt, ${maxPt}pt].`);
            }

            // Store defaults in given display units (rounded appropriately)
            _defaultUnits = units;
            _defaultMin = (units === defaultUnitType) ? roundTo(nMin, 0) : roundTo(nMin, 1);
            _defaultMax = (units === defaultUnitType) ? roundTo(nMax, 0) : roundTo(nMax, 1);
            _defaultValue = (units === defaultUnitType) ? roundTo(nValue, 0) : roundTo(nValue, 1);

            if (withReset) div.reset();
        };

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
         * Converts values to pt when unit is em. */
        div.refreshOptions = () => {
            div.clearOptions();

            const step = 1;

            // Internal _min/_max are stored in pt.
            // Convert to em for generating options if current unit is 'em', else keep pt.
            let minUnitValue = ptToEm(_min);
            let maxUnitValue = ptToEm(_max);

            // Ensure min <= max
            if (minUnitValue > maxUnitValue) [minUnitValue, maxUnitValue] = [maxUnitValue, minUnitValue];

            minUnitValue = Math.floor(minUnitValue);
            maxUnitValue = Math.ceil(maxUnitValue);

            const count = Math.floor((maxUnitValue - minUnitValue) / step) + 1;

            let points = Array.from({length: count}, (_, i) => minUnitValue + i * step);

            if (div.units === defaultUnitType) points = points.map(val => val * defaultUnitSize);

            div.addOptions(points);
        };

        //-------------------------------------EVENT LISTENERS-------------------------------------

        padlock.addEventListener("click", () => {
            div.locked = !div.locked;
        });

        sizeInput.addEventListener("input", () => {
            div.value = parseFloat(sizeInput.value);
        });

        sizeSlider.addEventListener("input", () => {
            div.value = parseFloat(sizeSlider.value);
        });

        unitSpan.addEventListener("click", () => {
            div.units = div.units === 'em' ? defaultUnitType : 'em';
        });

        //-------------------------------------SET DEFAULTS-------------------------------------

        div.setDefaults({units: defaultUnitType, min: 0, max: 7 * defaultUnitSize, value: defaultUnitSize}, true);

        //-------------------------------------ASSEMBLE CONTROL-------------------------------------

        label.append(sizeInput, unitSpan, document.createElement('br'), sizeSlider, dataList);

        div.append(padlock, label);

        return div;
    },
    {use: 'style'}
);

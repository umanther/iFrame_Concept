import {padlockTemplate} from "../padlock.js";
import {generateID, splitID, assignProps, padlockStyles} from "../controlUtils.js";

export function generateColorControl(cssSelector, cssParameter, labelText) {
    if (!padlockTemplate) {
        throw new Error("Padlock SVG not loaded yet — wait for controlsReady before calling.");
    }

    //-------------------------------------UTILITY FUNCTION-------------------------------------

    let _defaultColor = '#000000'

    let setID = generateID(cssSelector, cssParameter);

    //-------------------------------------DEFINE COMPONENTS-------------------------------------

    const div = document.createElement("div");
    assignProps(div, {
        id: setID,
        'data-control': 'Color'
    }, {
        display: 'inline-block',
        margin: '.25em'
    });

    const padlock = padlockTemplate.cloneWith({
        id: `${setID}-padlock`,
        'data-locked': 'false'
    });
    Object.assign(padlock.style, padlockStyles);

    const label = document.createElement("label");
    assignProps(label, {
        id: `${setID}-label`,
        textContent: labelText,
        for: `${setID}-input`
    }, {
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',
    });

    const colorSel = document.createElement("input");
    assignProps(colorSel, {
        id: `${setID}-input`,
        type: 'color',
        value: '#000000'
    });

    //-------------------------------------ADD PROPERTIES-------------------------------------

    Object.defineProperty(div, 'value', {
        get() {
            return colorSel.value;
        },
        set(newVal) {
            colorSel.value = newVal;
            div.dispatchEvent(new Event('change', {bubbles: true}));
        }
    });

    Object.defineProperty(div, 'asString', {
        get() {
            return colorSel.value;
        }
    });

    Object.defineProperty(div, 'cssPair', {
        get() {
            return splitID(div.id);
        }
    });

    Object.defineProperty(div, 'cssSelector', {
        get() {
            return div.cssPair.selector;
        }
    });

    Object.defineProperty(div, 'cssParameter', {
        get() {
            return div.cssPair.parameter;
        }
    });

    Object.defineProperty(div, 'cssDeclaration', {
        get() {
            return `${div.cssPair.parameter}: ${div.asString}`;
        }
    });

    Object.defineProperty(div, 'locked', {
        get() {
            return padlock.getAttribute('data-locked') === 'true';
        },
        set(value) {
            padlock.setAttribute('data-locked', value.toString());

            colorSel.disabled = div.locked;
            label.style.opacity = div.locked ? '0.5' : '1';
            label.style.pointerEvents = div.locked ? 'none' : 'auto';
        }
    });

    div.reset = () => {
        div.value = _defaultColor;
    };

    /**
     * Save the default color configuration for this Color type control.
     *
     * This function:
     *  - Requires a valid CSS color string (named color, hex, rgb/rgba, hsl/hsla, etc.).
     *  - Throws an error if the color is invalid.
     *  - Stores the color as the default.
     *  - Optionally calls div.reset() if withReset is true.
     *
     * @function setDefaults
     * @param {Object} params - The configuration object.
     * @param {string} params.value - A valid CSS color string.
     * @param {boolean} [withReset=false] - If true, immediately applies defaults by calling div.reset().
     * @throws {Error} If `color` is missing or not a valid CSS color.
     * @returns {void} This function does not return anything.
     */
    div.setDefaults = ({value}, withReset = false) => {
        const mkErr = (msg) => {
            throw new Error(`[Color Control][setDefaults] ${msg}`);
        };

        // Ensure it's a string and check validity
        if (typeof value !== "string" || !value.trim()) {
            mkErr(`Value must be a non-empty string.`);
        }

        const s = new Option().style;
        s.color = value;
        if (s.color === "") {
            mkErr(`Invalid CSS color: "${value}"`);
        }

        _defaultColor = value;

        if (withReset) div.reset();
    };


    //-------------------------------------EVENT LISTENERS-------------------------------------

    padlock.addEventListener("click", () => {
        div.locked = !div.locked;
    });

    colorSel.addEventListener("input", () => {
        div.value = colorSel.value;
    });

    //-------------------------------------ASSEMBLE CONTROL-------------------------------------

    label.appendChild(colorSel);

    div.append(padlock, label);

    const result = new DocumentFragment();
    result.appendChild(div);

    return result;
}

import {padlockTemplate} from "../padlock.js";
import {Choices} from "../choices.js";
import {assignProps, generateID, padlockStyles, splitID} from "../controlUtils.js";


const defaultFonts = Object.fromEntries(
    Object.entries({
        Sans: "sans-serif",
        Serif: "serif",
        'Times New Roman': "'Times New Roman', serif",
        Monospace: "monospace",
        Roboto: "'Roboto', sans-serif",
        'Open Sans': "'Open Sans', sans-serif",
        Merriweather: "'Merriweather', serif",
        Inconsolata: "'Inconsolata', monospace",
        Lora: "'Lora', serif",
        Domine: "'Domine', serif",
    }).sort(([a], [b]) => a.localeCompare(b))
);

export function generateFontFamilyControl(cssSelector, cssParameter, labelText) {
    if (!padlockTemplate || typeof Choices !== 'function') {
        throw new Error("FontFamily control cannot render — required assets not ready. Await controlsReady first.");
    }

    //-------------------------------------UTILITY FUNCTION-------------------------------------

    let _defaultFont = 'sans-serif';

    let setID = generateID(cssSelector, cssParameter);

    //-------------------------------------DEFINE COMPONENTS-------------------------------------

    const div = document.createElement("div");
    assignProps(div, {
        id: setID,
        'data-control': 'FontFamily'
    }, {
        display: 'flex',
        margin: '.25em',
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
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        userSelect: 'none'
    });

    const fontSel = document.createElement("select");
    assignProps(fontSel, {
        id: `${setID}-input`,
    }, {
        flexGrow: '1',
        minWidth: '0'
    });

    Object.entries(defaultFonts).forEach(([fontName, fontType]) => {
        const option = document.createElement('option');
        option.value = fontType;
        option.textContent = fontName;
        fontSel.appendChild(option);
    });

    if (!document.getElementById('choicesStylesheet')) {
        const link = document.createElement('link');
        assignProps(link, {
            id: 'choicesStylesheet',
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css'
        });
        document.head.appendChild(link);
    }

    if (!document.getElementById('customChoicesStylesheet')) {
        const style = document.createElement('style');
        assignProps(style, {
            textContent: `
            .choices {
                flex-grow: 1;
                min-width: 0;
                width: 100%;
                }
               
            .choices__inner {
                width: 100% !important;
                box-sizing: border-box;
                }`
        });
        document.head.appendChild(style);
    }

    //-------------------------------------ADD PROPERTIES-------------------------------------

    Object.defineProperty(div, 'value', {
        get() {
            return fontSel.value;
        },
        set(newVal) {
            fontSelChoices.setChoiceByValue(newVal);
            fontSel.dispatchEvent(new Event("change", {bubbles: true}));
        }
    });

    Object.defineProperty(div, 'asString', {
        get() {
            return `${fontSel.value}`;
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
        },
        /** Set lock state for control set
         * @param {boolean} value */
        set(value) {
            padlock.setAttribute('data-locked', value.toString());

            fontSel.disabled = div.locked;
            label.style.opacity = div.locked ? '0.5' : '1';
            label.style.pointerEvents = div.locked ? 'none' : 'auto';
        }
    });

    div.reset = () => {
        div.value = _defaultFont;
    };

    /**
     * Save the default font configuration for this Font type control.
     *
     * This function:
     *  - Requires a valid font-family string or comma-separated list of font-family names.
     *  - Validates the general structure of the font-family string (letters, digits, spaces,
     *    commas, dashes, optional paired quotes).
     *  - Throws an error if the font-family string is missing or malformed.
     *  - Stores the font-family string as the default.
     *  - Optionally calls div.reset() if withReset is true.
     *
     * @function setDefaults
     * @param {Object} params - The configuration object.
     * @param {string} params.value - The font-family string.
     * @param {boolean} [withReset=false] - If true, immediately applies defaults by calling div.reset().
     * @throws {Error} If `value` is missing or not a valid font-family string.
     * @returns {void} This function does not return anything.
     */
    div.setDefaults = ({value}, withReset = false) => {
        const mkErr = (msg) => {
            throw new Error(`[Font Control][setDefaults] ${msg}`);
        };

        const isValidFontFamily = (val) => {
            if (typeof val !== "string" || !val.trim()) return false;

            // Regex explanation:
            // - Matches one or more font names separated by commas
            // - Each font name optionally wrapped in single or double quotes (paired)
            // - Font names contain letters, digits, spaces, dash, underscore
            const fontFamilyPattern = /^(\s*(['"]?)[\w\s\-]+?\2\s*,)*\s*(['"]?)[\w\s\-]+?\3\s*$/;
            return fontFamilyPattern.test(val);
        };

        if (!isValidFontFamily(value)) {
            mkErr(`Invalid font-family string: "${value}"`);
        }

        _defaultFont = value;

        if (withReset) div.reset();
    };

    //-------------------------------------EVENT LISTENERS-------------------------------------

    padlock.addEventListener("click", () => {
        div.locked = !div.locked;
    });

    //-------------------------------------SET DEFAULTS-------------------------------------


    //-------------------------------------ASSEMBLE CONTROL-------------------------------------

    label.appendChild(fontSel);

    const fontSelChoices = new Choices(fontSel, {
        searchEnabled: true,
        itemSelectText: '',
        shouldSort: true
    });

    div.append(padlock, label);

    const result = new DocumentFragment();

    result.appendChild(div);

    return result;
}
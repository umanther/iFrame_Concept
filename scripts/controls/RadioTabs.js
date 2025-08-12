import {assignProps} from "../controlUtils.js";
import {sanitizeId} from "../utilities.js";
import {debugLog} from "../debugLog.js";

const mkErr = (msg) => {
    throw new Error(`[RadioTabs Control] ${msg}`);
};

export const generateRadioTabsControl = Object.assign(
    /** Generates a RadioTabs control set.
     *
     * @param {string} id - String denoting ID this control sets.
     * @returns {HTMLDivElement}
     */
    function generateRadioTabsControl(id) {
        //-------------------------------------UTILITY FUNCTION-------------------------------------

        let _tabs = [];

        // Initial styles object
        let _tabStyles = {
            height: '110px',
            activeIndicatorHeight: '10px',
            unselectedColor: '#ddd',
            selectedColor: '#f8f8f8',
            borderColor: '#999',
            hoverColor: '#ccc',
            labelPadding: '8px 0.25em',
            borderRadius: '6px',
            transitionDuration: '.18s',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 'normal',
            cursor: 'pointer',
            tabSpacing: '0',
            displayBottomEdge: false,
        };

        function validateText(text) {
            if (typeof text !== "string" || !text.trim()) {
                console.warn('Text must not be an empty or zero-length string')
                return false
            }

            if (/[<>]/.test(text)) {
                console.warn("Text must be plain text without HTML tags or angle brackets.");
                return false;
            }
            return true;
        }

        function generateTab(labelText = "Tab") {
            const frag = document.createDocumentFragment();

            const tab = document.createElement("input");
            assignProps(tab, {
                type: "radio",
                name: `radioTabs-${sanitizeId(id)}`,
                id: `${sanitizeId(labelText)}-${sanitizeId(id)}`,
            });

            const label = document.createElement("label");
            assignProps(label, {
                htmlFor: `${sanitizeId(labelText)}-${sanitizeId(id)}`,
                textContent: labelText,
            });

            frag.appendChild(tab);
            frag.appendChild(label);

            tab.addEventListener('change', () => {
                if (tab.checked) {
                    div.dispatchEvent(new Event('change', {bubbles: true}));
                    debugLog(`Tab changed to: ${tab.id}`);
                }
            });

            return frag;
        }

        function populateTabs() {
            clearTabs();
            for (const tab of _tabs) {
                tabContainer.appendChild(generateTab(tab));
            }
            if (_tabs.length > 0) {
                if (!shadowRoot.querySelector(`.tabControl input[type="radio"]:checked`)) {
                    const firstTab = shadowRoot.querySelector(`.tabControl input[type="radio"]`)
                    if (firstTab) {
                        firstTab.checked = true;
                        firstTab.dispatchEvent(new Event('change', {bubbles: true}))
                    }
                }
            }
        }

        function clearTabs() {
            tabContainer.innerHTML = '';
        }

        //-------------------------------------DEFINE COMPONENTS-------------------------------------

        const div = document.createElement('div');
        assignProps(div, {
            id: id,
            'data-control': 'RadioTabs'
        });

        const shadowRoot = div.attachShadow({mode: "open"});

        //-------------------------------------STYLE ELEMENT AND UPDATER-------------------------------------

        const style = document.createElement('style');
        style.id = 'RadioTabsControlStylesheet';

        // Function to generate stylesheet text based on current _tabStyles
        function updateStyleSheet() {
            let borderBottom = _tabStyles.displayBottomEdge ? 'solid' : 'none'
            style.textContent = `
/*! Tabs container */
.tabControl {
  display: flex;
  align-items: flex-end;
  height: ${_tabStyles.height};
  margin-top: calc(${_tabStyles.activeIndicatorHeight} + ${_tabStyles.borderRadius} + 1px);
  gap: ${_tabStyles.tabSpacing};
  user-select: none;
  font-family: ${_tabStyles.fontFamily};
  font-size: ${_tabStyles.fontSize};
  font-weight: ${_tabStyles.fontWeight};
  cursor: ${_tabStyles.cursor};
}

.tabControl input[type="radio"] {
  display: none;
}

.tabControl label,
.tabControl label::before {
  background: ${_tabStyles.unselectedColor};
  border-left: 1px solid ${_tabStyles.borderColor};
  border-right: 1px solid ${_tabStyles.borderColor};
  transition: height ${_tabStyles.transitionDuration} ease, background ${_tabStyles.transitionDuration} ease;
  padding: ${_tabStyles.labelPadding};
  margin-right: ${_tabStyles.tabSpacing};

}

.tabControl label {
  position: relative;
  writing-mode: sideways-lr;
  text-orientation: mixed;
  text-align: center;
  height: calc(${_tabStyles.height} - ${_tabStyles.activeIndicatorHeight});
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px ${borderBottom} ${_tabStyles.borderColor};
  padding-top: 0;
}

.tabControl label::before {
  content: "";
  position: absolute;
  left: -1px;
  right: -1px;
  bottom: calc(100% - 1px);
  height: 0;
  border-top: 1px solid ${_tabStyles.borderColor};
  border-top-left-radius: ${_tabStyles.borderRadius};
  border-top-right-radius: ${_tabStyles.borderRadius};
  pointer-events: none;
}

.tabControl label:hover,
.tabControl label:hover::before {
  background: ${_tabStyles.hoverColor};
}

/*! Active tab */
.tabControl input[type="radio"]:checked + label,
.tabControl input[type="radio"]:checked + label::before {
  background: ${_tabStyles.selectedColor};
}

.tabControl input[type="radio"]:checked + label::before {
  height: ${_tabStyles.activeIndicatorHeight};
}
      `;
        }

        updateStyleSheet();

        //-------------------------------------ADD tabStyles PROPERTY WITH LIVE UPDATE-------------------------------------

        /**
         * Proxy object representing live-updatable style properties.
         * Updating any property immediately refreshes the control's stylesheet.
         * @type {Object}
         * @property {string} height - Height of the tabs container.
         * @property {string} activeIndicatorHeight - Height of the active tab indicator bar.
         * @property {string} unselectedColor - Background color of unselected tabs.
         * @property {string} selectedColor - Background color of the selected tab.
         * @property {string} borderColor - Border color of tabs.
         * @property {string} hoverColor - Background color on tab hover.
         * @property {string} labelPadding - Padding inside tab labels.
         * @property {string} borderRadius - Border radius of tabs.
         * @property {string} transitionDuration - Duration for CSS transitions.
         * @property {string} fontFamily - Font family used for tab labels.
         * @property {string} fontSize - Font size used for tab labels.
         * @property {string} fontWeight - Font weight of tab labels.
         * @property {string} cursor - Cursor style on hover.
         * @property {string} tabSpacing - Space between tabs.
         * @property {boolean} displayBottomEdge - Whether to show a bottom border on tabs.
         */
        div.tabStyles = new Proxy(_tabStyles, {
            set(target, prop, value) {
                if (prop in target) {
                    target[prop] = value;
                    updateStyleSheet();
                    return true;
                }
                return false;
            },
            get(target, prop) {
                if (prop in target) {
                    return target[prop];
                }
                return undefined;
            }
        });

        //-------------------------------------value PROPERTY-------------------------------------

        /**
         * The currently selected tab's label text.
         * Returns null if no tab is selected.
         * Setting this property selects the matching tab by sanitized label.
         * @type {string|null}
         */
        Object.defineProperty(div, 'value', {
            get() {
                const checked = shadowRoot.querySelector(`input[name="radioTabs-${sanitizeId(id)}"]:checked`);
                if (!checked) return null;

                const inputId = checked.id;
                const label = shadowRoot.querySelector(`label[for="${inputId}"]`);
                return label ? label.textContent.trim() : null;
            },
            set(newValue) {
                const sanitized = sanitizeId(newValue);
                const radios = shadowRoot.querySelectorAll(`input[name="radioTabs-${sanitizeId(id)}"]`);
                let matched = false;
                for (const radio of radios) {
                    if (radio.id === `${sanitized}-${sanitizeId(id)}`) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', {bubbles: true}));
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    console.warn(`No radio tab found matching value: "${newValue}"`);
                } else {
                    div.dispatchEvent(new Event('change', {bubbles: true}));
                }
            }
        });

        //-------------------------------------appendTab METHOD-------------------------------------

        /**
         * Append a new tab to the control.
         * If `afterTab` is specified and exists, inserts the new tab after it.
         * Otherwise, adds the tab at the end.
         * Duplicate tab labels are not allowed.
         * @param {string} tabText - The label text of the new tab.
         * @param {string|null} [afterTab=null] - The label of an existing tab to insert after.
         * @returns {boolean} True if tab was added successfully, false otherwise.
         */
        div.appendTab = (tabText, afterTab = null) => {
            if (!validateText(tabText)) return false;

            if (_tabs.includes(tabText)) {
                console.warn(`Tab "${tabText}" already exists. Aborting.`);
                return false;
            }

            if (afterTab && _tabs.includes(afterTab)) {
                const insertIndex = _tabs.indexOf(afterTab) + 1;
                _tabs.splice(insertIndex, 0, tabText);
            } else {
                _tabs.push(tabText);
            }

            populateTabs();
            return true;
        };

        //-------------------------------------prependTab METHOD-------------------------------------

        /**
         * Prepend a new tab to the control.
         * If `beforeTab` is specified and exists, inserts the new tab before it.
         * Otherwise, adds the tab at the beginning.
         * Duplicate tab labels are not allowed.
         * @param {string} tabText - The label text of the new tab.
         * @param {string|null} [beforeTab=null] - The label of an existing tab to insert before.
         * @returns {boolean} True if tab was added successfully, false otherwise.
         */
        div.prependTab = (tabText, beforeTab = null) => {
            if (!validateText(tabText)) return false;

            if (_tabs.includes(tabText)) {
                console.warn(`Tab "${tabText}" already exists. Aborting.`);
                return false;
            }

            if (beforeTab && _tabs.includes(beforeTab)) {
                const insertIndex = _tabs.indexOf(beforeTab);
                _tabs.splice(insertIndex, 0, tabText);
            } else {
                _tabs.unshift(tabText);
            }

            populateTabs();
            return true;
        };

        //-------------------------------------deleteTab METHOD-------------------------------------

        /**
         * Delete an existing tab by its label text.
         * If the tab does not exist, this function does nothing.
         * @param {string} tabText - The label text of the tab to remove.
         * @returns {void}
         */
        div.deleteTab = (tabText) => {
            const index = _tabs.indexOf(tabText);
            if (index !== -1) {
                _tabs.splice(index, 1);
                populateTabs();
            }
        };

        //-------------------------------------count METHOD-------------------------------------

        /**
         * Returns the current number of tabs in the control.
         * @returns {number}
         */
        div.count = () => {
            return _tabs.length;
        }

        //-------------------------------------OTHER COMPONENTS-------------------------------------

        const tabContainer = document.createElement("div");
        tabContainer.classList.add("tabControl");


        //-------------------------------------ASSEMBLE CONTROL-------------------------------------

        shadowRoot.appendChild(style);
        shadowRoot.appendChild(tabContainer);

        populateTabs();

        return div;
    },
    {use: 'control'}
);

const SELECTOR_NATIVE_SELECT = 'select.ds-cpc-control-select__tpl';
/*
Do not delete the following comment. It is essential for tracking purposes.
#Merc2021DoNotDelete
*/

/**
 * initialize all select elements who has class name of 'ds-cpc-control-select__tpl'
 */
function DSCpcSelects() {
    const cpcSelects = {};
    const nativeSelectElms = document.querySelectorAll(SELECTOR_NATIVE_SELECT);
    for (let i = 0; i < nativeSelectElms.length; i += 1) {
        const cpcSelect = new DSCpcSelect(nativeSelectElms[i]);
        const extraClassNames = nativeSelectElms[i].className.replace('ds-cpc-control-select__tpl', '').trim();
        let extraAttributes = [];
        if (nativeSelectElms[i].getAttribute('aria-invalid')) {
            extraAttributes['aria-invalid'] = nativeSelectElms[i].getAttribute('aria-invalid');
        }
        if (nativeSelectElms[i].getAttribute('aria-described-by')) {
            extraAttributes['aria-described-by'] = nativeSelectElms[i].getAttribute('aria-described-by');
        }
        /* if (nativeSelectElms[i].getAttribute('id')) {
            extraAttributes['id'] = nativeSelectElms[i].getAttribute('id');
        } */
        if (nativeSelectElms[i].getAttribute('aria-labelledby')) {
            extraAttributes['aria-labelledby'] = nativeSelectElms[i].getAttribute('aria-labelledby');
        }


        cpcSelect.init(extraClassNames, extraAttributes);

        const id = nativeSelectElms[i].id || `cpc-select-id_${i}`;
        cpcSelects[id] = cpcSelect;
        cpcSelect.createObserver();
    }

    return cpcSelects;
}

const CLASS_OPEN = 'cpc-control-select--open';

/**
 * CPC customized select component
 */
function DSCpcSelect(selectElm) {
    // The original native select element
    const nativeSelectElm = selectElm;

    // The in-house made drop down element
    let cpcSelectElm;

    // The toggle object which trigger open of close drop down
    let toggle;

    // The in-house made drop down combobox element
    let comboElm;

    // The ul list
    let comboListElm;

    // All the options
    const options = [];

    // statues to track whether drop down is opened or closed
    let opened = false;

    // Track the current selected option
    let selected;

    // how many option rows to be displayed in the drop down
    let rowsToDisplay;

    let oldSelectedValue;


    // iPhone fix
    let onFirstOpen = true;

    return {
        init,
        open,
        close,
        toggle: doToggle,
        disable,
        enable,
        createObserver,
        reset
    };

    function init(extraClassNames, extraAttributes) {
        cpcSelectElm = document.createElement('div');

        cpcSelectElm.className = 'cpc-control-select';

        // creating toggle button
        toggle = new CpcSelectToggle(extraClassNames, extraAttributes);
        cpcSelectElm.appendChild(toggle.element);

        // creating the comboBox
        comboElm = document.createElement('div');
        comboElm.className = 'cpc-control-select__combo';
        // comboElm.setAttribute('role', 'combobox');
        cpcSelectElm.appendChild(comboElm);

        // creating the ul
        comboListElm = document.createElement('ul');
        comboListElm.className = 'cpc-control-select__combo--list';
        comboListElm.setAttribute('aria-expanded', false);
        comboListElm.setAttribute('role', 'listbox');
        if (extraAttributes["id"]) {
            comboListElm.setAttribute('id', 'ac_' + extraAttributes["id"]);
        }

        comboListElm.setAttribute('aria-labelledby', 'custom-dropdown-label');

        comboElm.appendChild(comboListElm);

        // create options and link together
        const optionElms = nativeSelectElm.querySelectorAll('option');
        for (let i = 0; i < optionElms.length; i += 1) {
            const option = new CpcSelectOption(optionElms[i], i, nativeSelectElm.id);
            options[i] = option;
            if (i > 0) {
                // chain together
                option.prev(options[i - 1]);
                options[i - 1].next(option);
            }

            if (option.isSelected()) {
                selected = option;
                toggle.setText(option.textContent);
            }
            comboListElm.appendChild(option.element);
        }
        nativeSelectElm.parentNode.insertBefore(cpcSelectElm, nativeSelectElm);
        nativeSelectElm.style.display = 'none';

        if (nativeSelectElm.disabled) disable();
        else enable();

        document.getElementById(nativeSelectElm.id).dispatchEvent(new Event('change'));

        oldSelectedValue = selected.value;
    }

    function disable() {
        unRegisterEventListener();
        cpcSelectElm.classList.add('disabled');
        toggle.element.setAttribute('aria-disabled', true);
    }

    function enable() {
        registerEventListener();
        cpcSelectElm.classList.remove('disabled');
        toggle.element.removeAttribute('aria-disabled');
    }

    // observer  for disabled attributes
    function mutate(mutations) {
        mutations.forEach((mutation) => {
            if (mutation.target.className === 'cpc-control-select disabled' || mutation.target.disabled) {
                unRegisterEventListener();
            } else if (mutation.target.className === 'cpc-control-select') {
                registerEventListener();
            }
        });
    }

    function createObserver() {
        const observer = new MutationObserver(mutate);
        const config = { attributes: true, childList: true, subtree: true };
        observer.observe(cpcSelectElm, config);
    }

    // resets value(s) of options to idx 0
    function reset(e) {
        e.preventDefault();
        chooseOption(options[0]);
        close();
    }

    function registerEventListener() {
        cpcSelectElm.addEventListener('keydown', onKeydown);
        
        toggle.element.addEventListener('click', onClickToggle);
        toggle.element.addEventListener('keyup', onKeyUpToggle);

        comboElm.addEventListener('click', onClickCombo);

        document.addEventListener('click', onClickDocumentCpcSelect);
        document.addEventListener('keyup', onKeyupDocumentCpcSelect);

        // disable focus ring if mouse click
        // new FocusRingHandler('.cpc-control-select__toggle').initialize();
    }

    function unRegisterEventListener() {
        cpcSelectElm.removeEventListener('keydown', onKeydown);

        toggle.element.removeEventListener('click', onClickToggle);
        toggle.element.removeEventListener('keyup', onKeyUpToggle);

        comboElm.removeEventListener('click', onClickCombo);

        document.removeEventListener('click', onClickDocumentCpcSelect);
        document.removeEventListener('keyup', onKeyupDocumentCpcSelect);
    }

    /**
     * For mouse click outside the select list
     */
    function onClickDocumentCpcSelect(e) {
        if (!cpcSelectElm.contains(e.target)) close();
    }

    /**
     * For escape key, close the drop down anyway
     */
    function onKeyupDocumentCpcSelect(e) {
        const key = e.which || e.keyCode;
        if (key !== 27) return;
        close();
    }

    /**
     * Select the option which gets clicked
     */
    function onClickCombo(e) {
        e.preventDefault();
        const target = e.target;
        const idx = target.getAttribute('data-index') || target.parentElement.getAttribute('data-index');
        chooseOption(options[idx]);
        close();
    }

    /**
     * When the toggle clicked, open or close the drop down depends whether it's opened already
     */
    function onClickToggle(e) {
        e.preventDefault();
        doToggle(e);
    }

    function onKeyUpToggle(e) {
        const key = e.which || e.keyCode;
        e.preventDefault();
        if (key === 32 && !opened) { // Spacebar if opened dont close
            doToggle(e);
        }
    }

    /**
     * When ArrowUp or ArrowDown pressed on the toggle, change the selected option
     */
    function onKeydown(e) {

        const key = e.which || e.keyCode;
        if (key !== 38
            && key !== 40
            && key !== 18
            && key !== 9
            && key !== 35
            && key !== 36
            && key !== 27
            && key !== 32
            && key !== 13) return;
        
        if (key === 9 || key === 27) {
            // TAB and Escape. If drop down opened, then close it.
            // Otherwise, do it's default
            if (opened) close();
            return;
        }

        e.preventDefault();
        if (key === 13 || (e.altKey && key === 40)) {
            // Enter key or ALT + Down Arrow key
            doToggle(e);
            return;
        }

        if (key === 35) { // END KEY{
            chooseOption(options[options.length - 1]);
        }
        else if (key === 36) { // HOME KEY
            chooseOption(options[0]);
        }
        else if (key === 38) {
            // ArrowUp
            chooseOption(selected ? selected.prev() : options[0]);

            // eslint-disable-next-line max-len
            if (comboElm.getBoundingClientRect().top > selected.element.getBoundingClientRect().top - 1) {
                // There is 1px border for the comboElm
                comboElm.scrollTop -= CpcSelectOption.HEIGHT;
            }
        } else if (key === 40) {

            // ArrowDown
            chooseOption(selected ? selected.next() : options[0]);

            // eslint-disable-next-line max-len
            if (selected.element.getBoundingClientRect().bottom - 1 > comboElm.getBoundingClientRect().bottom) {
                // There is 1px border for the comboElm
                comboElm.scrollTop += CpcSelectOption.HEIGHT;
            }
        }
        selected.element.focus();
    }


    /**
     * Choose the selected option and unselected the previous selected option
     *
     * @param opt - The one to be selected
     */
    function chooseOption(opt) {
        if (!opt) return;

        if (selected) selected.unSelect();
        selected = opt;
        selected.select();
        toggle.setText(opt.textContent);
    }

    function open() {
        cpcSelectElm.classList.add(CLASS_OPEN);
        toggle.element.setAttribute('aria-expanded', true);
        comboListElm.setAttribute('aria-expanded', true);

        // iPhone fix for filter not scrolling
        if (onFirstOpen) {
            onFirstOpen = false;
            // disable and re-enable scrolling
            comboElm.style.overflow = 'hidden';
            setTimeout(() => {
                comboElm.style.overflow = 'auto';
            }, 50);
        }

        rePosition();
        if (selected) scrollToSelected();
        opened = true;
    }

    function scrollToSelected() {
        comboElm.scrollTop = 0;
        const diff = (selected.index + 1) - rowsToDisplay;
        if (diff > 0) {
            // the selected option is outside the drop down, so scroll it in view
            comboElm.scrollTop += CpcSelectOption.HEIGHT * diff;
        }
    }

    /**
     * Determine open direction
     */
    function rePosition() {
        const toggleRect = toggle.element.getBoundingClientRect();
        const spaceBelow = window.innerHeight - toggleRect.bottom;
        // const spaceAbove = toggleRect.top;

        if (window === window.top) {
            // give it a max-height
            const optionHeight = CpcSelectOption.HEIGHT;
            // rowsToDisplay = Math.floor(availableSpace / optionHeight);
            rowsToDisplay = 6;

            // const openBelow = (spaceBelow - spaceAbove) >= 0;
            // const availableSpace = openBelow ? spaceBelow : spaceAbove;          
            const openBelow = (spaceBelow > ((optionHeight * rowsToDisplay)));

            toggle.element.classList.remove('openBelow');
            comboElm.classList.remove('openBelow');
            toggle.element.classList.remove('openUp');
            comboElm.classList.remove('openUp');

            if (openBelow) {
                toggle.element.classList.add('openBelow');
                comboElm.classList.add('openBelow');
            } else {
                toggle.element.classList.add('openUp');
                comboElm.classList.add('openUp');
            }

            const maxHeight = rowsToDisplay * optionHeight;
            comboElm.style.maxHeight = `${maxHeight}px`;

            /* comboElm.style.top = openBelow ? 'auto' : `-${comboElm.getBoundingClientRect().height}px`; */

            /* Pagination Change */
            comboElm.style.top = openBelow ? '31px' : `-${comboElm.getBoundingClientRect().height + 13}px`;
        }
    }

    function close() {
        cpcSelectElm.classList.remove(CLASS_OPEN);
        toggle.element.setAttribute('aria-expanded', false);
        // Focus only if the current active element is the current select or any of its options
        // Fix for this element being focused when other elements were interacted with
        if (isDescendant(cpcSelectElm, document.activeElement)) {
            toggle.element.focus();
        }
        comboListElm.setAttribute('aria-expanded', false);
        opened = false;

        var x = document.getElementById(nativeSelectElm.id);
        for (i = 0; i < x.options.length; i++) { // To prevent the document click close div
            if (x.options[i].value == selected.value && selected.value != oldSelectedValue) {
                x.options[i].setAttribute('selected', 'true');
                document.getElementById(nativeSelectElm.id).dispatchEvent(new Event('change'));
                oldSelectedValue = selected.value;
            }
            else {
                x.options[i].removeAttribute('selected');
            }
        }
    }

    function isDescendant(parent, child) {
        let node = child.parentNode;
        while (node != null) {
            if (node === parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    function doToggle(e) {
        if (opened) {
            close();
        } else {
            open();
        }
    }
}

/**
 * The toggle to open/close the select drop down list
 */
function CpcSelectToggle(extraClassNames, extraAttributes) {
    const toggleElm = document.createElement('button');
    toggleElm.className = 'cpc-control-select__toggle';
    if (extraClassNames) {
        toggleElm.classList.add(extraClassNames);
    }
    if (extraAttributes) {
        for (var key in extraAttributes) {
            toggleElm.setAttribute(key, extraAttributes[key])
        }
    }
    toggleElm.setAttribute('tabindex', 0);
    toggleElm.setAttribute('aria-expanded', false);
    if (extraAttributes && extraAttributes["id"]) {
        toggleElm.setAttribute('aria-controls', 'ac_' + extraAttributes["id"]);
    }
    toggleElm.setAttribute('aria-haspopup', 'listbox');
    toggleElm.setAttribute('role', 'combobox');





    const toggleTextElm = document.createElement('span');
    toggleElm.appendChild(toggleTextElm);
    const indicator = document.createElement('span');
    indicator.className = 'cpc-control-select__toggle-indicator';
    toggleElm.appendChild(indicator);

    return {
        element: toggleElm,
        setText
    };

    function setText(text) {
        toggleTextElm.innerText = text;
        toggleElm.title = text;
    }
}

/**
 * Select option
 */
function CpcSelectOption(optSrcElm, i, id) {
    // The original native select option element
    const optionSourceElm = optSrcElm;

    // our option element
    let optionElm;

    // The previous option in the drop down list
    let prevOpt;

    // The next option in the drop down list
    let nextOpt;

    // The position where the option in the drop down list
    const index = i;

    // The option text
    let spanElm;

    let nativeElementID = id;

    const textContent = optionSourceElm.textContent;
    const value = optionSourceElm.value;

    init();

    return {
        element: optionElm,
        index,
        value,
        textContent,
        next,
        prev,
        unSelect,
        select,
        isSelected
    };

    function init() {
        optionElm = document.createElement('li');
        optionElm.className = 'cpc-control-select__combo--list-option';

        // spanElm = document.createElement('span');
        // spanElm.setAttribute('aria-selected', 'false');
        // optionElm.appendChild(spanElm);

        optionElm.innerText = textContent;
        optionElm.setAttribute('role', 'option');
        optionElm.setAttribute('data-value', value);
        optionElm.setAttribute('data-index', i);
        optionElm.setAttribute('tabindex', 0);

        if (optionSourceElm.getAttribute('selected') !== null) select();
    }

    function next(val) {
        if (val) nextOpt = val;
        return nextOpt;
    }

    function prev(val) {
        if (val) prevOpt = val;
        return prevOpt;
    }

    function select() {
        optionElm.classList.add('selected');
        optionElm.setAttribute('aria-selected', 'true');
    }

    function unSelect() {
        optionElm.classList.remove('selected');
        optionElm.removeAttribute('aria-selected', 'false');
    }

    function isSelected() {
        return optionSourceElm.getAttribute('selected') !== null;
    }
}

// 40px here, see '_select.scss' --> ul li{height:40px}
//
CpcSelectOption.HEIGHT = 40;

/**
 * Initialize all CpcSelect elements on the page. Return a map
 * of the initialized CpcSelect object, keyed with the native
 * select element's id, or an auto generated id if the native
 * select element missing the id attribute.
 */

DSCpcSelects.init = function init() {
    return DSCpcSelects();
};


setTimeout(() => {
    DSCpcSelects.init();
}, 100);


// export default DSCpcSelects;

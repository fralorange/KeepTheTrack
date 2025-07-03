const DEFAULT_PREFERENCES = {
    sleepOverlayDelay: 5,
    sleepOverlayOpacity: 0.8,
    sleepOverlayColor: '#000000',
};

/**
 * Updates a user preference in Chrome's storage.
 * @param {*} key - The key for the preference to update.
 * @param {*} value - The value to set for the preference.
 */
function updatePreference(key, value) {
    chrome.storage.sync.get(['preferences'], (data) => {
        const preferences = data.preferences || {};
        preferences[key] = value;
        chrome.storage.sync.set({ preferences });
    });
}

/**
 * Initializes the tab functionality by setting up event listeners
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tabs-container .tab');
    const contents = document.querySelectorAll('.tabs-container .content');

    const removeActiveClasses = () => {
        tabs.forEach((tab) => {
            tab.classList.remove('active');
        });

        contents.forEach((content) => {
            content.classList.remove('active');
        });
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
            removeActiveClasses();
            contents[i].classList.add('active');
            tab.classList.add('active');
        });
    });
}

/**
 * Sets up a slider input element with a corresponding value display.
 * @param {*} sliderId - The ID of the slider input element.
 * @param {*} valueId - The ID of the value display element.
 * @param {*} prefKey - The key for the preference to update in Chrome's storage.
 */
function setupSlider(sliderId, valueId, prefKey) {
    const slider = document.getElementById(sliderId);
    const sliderValue = document.getElementById(valueId);

    chrome.storage.sync.get(['preferences'], (data) => {
        const preferences = data.preferences || {};
        if (preferences[prefKey] !== undefined) {
            slider.value = preferences[prefKey];
            sliderValue.value = preferences[prefKey];
        }
    });

    slider.addEventListener('input', () => {
        sliderValue.value = slider.value;
        updatePreference(prefKey, slider.value);
    });

    sliderValue.addEventListener('input', () => {
        let value = Number(sliderValue.value);
        if (value < slider.min) value = slider.min;
        if (value > slider.max) value = slider.max;
        slider.value = value;
        updatePreference(prefKey, value);
    });
}

/**
 * Sets up a color picker input element with a corresponding value display.
 * @param {*} pickerId - The ID of the color picker input element.
 * @param {*} valueId - The ID of the value display element.
 * @param {*} prefKey - The key for the preference to update in Chrome's storage.
 */
function setupColorPicker(pickerId, prefKey) {
    const colorPicker = document.getElementById(pickerId);

    chrome.storage.sync.get(['preferences'], (data) => {
        const preferences = data.preferences || {};
        if (preferences[prefKey]) {
            colorPicker.value = preferences[prefKey];
        }
    });

    colorPicker.addEventListener('change', () => {
        updatePreference(prefKey, colorPicker.value);
    });
}

/**
 * Sets up the reset button to restore default preferences.
 */
function setupResetButton() {
    const resetButton = document.getElementsByClassName('reset-button')[0];
    resetButton.addEventListener('click', () => {
        chrome.storage.sync.set({ preferences: DEFAULT_PREFERENCES }, () => {
            setupSlider(
                'slider-delay',
                'slider-delay-value',
                'sleepOverlayDelay'
            );
            setupSlider(
                'slider-opacity',
                'slider-opacity-value',
                'sleepOverlayOpacity'
            );
            setupColorPicker('color-picker', 'sleepOverlayColor');
        });
    });
}

/**
 * Initializes the preferences in Chrome's storage if they do not exist.
 */
function initPreferences() {
    chrome.storage.sync.get(['preferences'], (data) => {
        if (!data.preferences) {
            chrome.storage.sync.set({ preferences: DEFAULT_PREFERENCES });
        }
    });
}

initPreferences();
setupTabs();
setupSlider('slider-delay', 'slider-delay-value', 'sleepOverlayDelay');
setupSlider('slider-opacity', 'slider-opacity-value', 'sleepOverlayOpacity');
setupColorPicker('color-picker', 'sleepOverlayColor');
setupResetButton();

const nextVideoFieldset = document.getElementById('next-video-fieldset');
const videoHolder = document.querySelector('div#video-holder.container');
const sleepCheckBox = document.getElementById('sleep-box');
const authorCheckBox = document.getElementById('author-box');
const nameCheckBox = document.getElementById('name-box');
const nameTextBox = document.getElementById('name-text-box');
let nameTextBoxDebounce;
let nextVideoHTML;

/**
 * Toggles the visibility of an element and executes a callback if provided.
 * @param {*} element - The DOM element to toggle visibility for.
 * @param {*} visible - A boolean indicating whether the element should be visible or not.
 * @param {*} callback - An optional callback function to execute when the element is hidden.
 */
function toggleVisibility(element, visible, callback) {
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
        if (typeof callback == 'function') {
            callback();
        }
    }
}

/**
 * Normalizes the YouTube card href by ensuring it points to the full URL.
 */
function normalizeYTCardHref() {
    const link = videoHolder.querySelector('a[href^="/watch"]');
    if (!link) return;

    const thumbVM = link.querySelector('yt-thumbnail-view-model');
    if (thumbVM) {
        Array.from(thumbVM.children).forEach((child) => {
            if (!child.querySelector('img')) {
                child.remove();
            }
        });
    }

    const relHref = link.getAttribute('href');
    if (relHref.startsWith('/watch')) {
        link.setAttribute('href', 'https://www.youtube.com' + relHref);
        link.setAttribute('target', '_blank');
    }
}

/**
 * Pastes the next video HTML into the video holder and updates the visibility of the next video fieldset.
 */
function pasteNextVideo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
            return;
        }
        const tabId = tabs[0].id;

        chrome.tabs.sendMessage(
            tabId,
            { action: 'requestNextVideo' },
            (response) => {
                if (
                    chrome.runtime.lastError ||
                    nextVideoHTML === response?.data
                ) {
                    return;
                }
                nextVideoHTML = response?.data;
                toggleVisibility(nextVideoFieldset, nextVideoHTML);
                if (nextVideoHTML) {
                    videoHolder.innerHTML = nextVideoHTML;
                    normalizeYTCardHref();
                } else {
                    videoHolder.innerHTML = '';
                }
            }
        );
    });
}

/**
 * Sets up a message listener to handle incoming messages from the content script.
 */
function setupMessagesHandler() {
    chrome.runtime.onMessage.addListener((message, _sender, _response) => {
        if (message.action === 'nextVideoUpdated') {
            pasteNextVideo(message.nextVideoHTML);
        }
    });
}

/**
 * Sets up listeners for filter checkboxes and text input.
 */
function setupFilterListeners() {
    authorCheckBox.addEventListener('change', (e) => {
        const isChecked = e.currentTarget.checked;
        chrome.storage.sync.get('filters', (data) => {
            const filters = data.filters;
            filters.byAuthor = isChecked;
            chrome.storage.sync.set({ filters });
        });
    });

    nameCheckBox.addEventListener('change', (e) => {
        const isChecked = e.currentTarget.checked;
        // Visual
        toggleVisibility(nameTextBox, isChecked, () => {
            nameTextBox.value = '';
            nameTextBox.dispatchEvent(new Event('input', { bubbles: true }));
        });
        // Logic
        chrome.storage.sync.get('filters', (data) => {
            const filters = data.filters;
            filters.byName.enabled = isChecked;
            chrome.storage.sync.set({ filters });
        });
    });

    nameTextBox.addEventListener('input', (e) => {
        clearTimeout(nameTextBoxDebounce);

        const targetValue = e.currentTarget.value;

        nameTextBoxDebounce = setTimeout(() => {
            chrome.storage.sync.get('filters', (data) => {
                const filters = data.filters;
                filters.byName.value = targetValue;
                chrome.storage.sync.set({ filters });
            });
        }, 300);
    });
}

/**
 * Sets up listeners for mode checkboxes.
 */
function setupModeListeners() {
    sleepCheckBox.addEventListener('change', (e) => {
        const isChecked = e.currentTarget.checked;
        chrome.storage.sync.get('modes', (data) => {
            const modes = data.modes;
            modes.sleep = isChecked;
            chrome.storage.sync.set({ modes });
        });
    });
}

/**
 * Sets up a listener for the options button to open the options page.
 */
function setupButtonListener() {
    document.getElementById('options-btn')?.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
}

document.addEventListener('DOMContentLoaded', async (_e) => {
    await new Promise((resolve) => {
        chrome.storage.sync.get(['filters', 'modes'], (data) => {
            if (!data.filters) {
                chrome.storage.sync.set({
                    filters: {
                        byAuthor: false,
                        byName: {
                            enabled: false,
                            value: '',
                        },
                    },
                });
            } else {
                const filters = data.filters;
                authorCheckBox.checked = filters.byAuthor;
                nameCheckBox.checked = filters.byName.enabled;
                nameTextBox.value = filters.byName.value;
                toggleVisibility(nameTextBox, nameCheckBox.checked);
            }

            if (!data.modes) {
                chrome.storage.sync.set({
                    modes: {
                        sleep: true,
                    },
                });
            } else {
                const modes = data.modes;
                sleepCheckBox.checked = modes.sleep;
            }

            resolve();
        });
    });

    await new Promise((resolve) => {
        pasteNextVideo();
        resolve();
    });

    requestAnimationFrame(() => {
        setTimeout(() => {
            document.body.classList.remove('loading');
        }, 20);
    });
});

setupMessagesHandler();
setupFilterListeners();
setupModeListeners();
setupButtonListener();

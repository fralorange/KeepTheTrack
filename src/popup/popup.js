const nextVideoFieldset = document.getElementById('next-video-fieldset');
const videoHolder = document.querySelector('div#video-holder.container');
const sleepCheckBox = document.getElementById('sleep-box');
const authorCheckBox = document.getElementById('author-box');
const nameCheckBox = document.getElementById('name-box');
const nameTextBox = document.getElementById('name-text-box');
let nameTextBoxDebounce;
let nextVideoHTML;

function toggleVisibility(element, visible, callback) {
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
        if (typeof callback == "function") {
            callback();
        }
    }
}

function normalizeYTCardHref() {
    const link = videoHolder.querySelector('a#thumbnail');
    if (link) {
        const relHref = link.getAttribute('href');
        if (relHref.startsWith('/watch')) {
            const fullUrl = 'https://www.youtube.com' + relHref;
            
            link.setAttribute('href', fullUrl);
            link.setAttribute('target', '_blank');
        }
    }
}

function pasteNextVideo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
            return;
        }
        const tabId = tabs[0].id;

        chrome.tabs.sendMessage(tabId, { action: 'requestNextVideo' }, (response) => {
            if (chrome.runtime.lastError || nextVideoHTML === response?.data) {
                return;
            }
            nextVideoHTML = response?.data;
            toggleVisibility(nextVideoFieldset, nextVideoHTML);
            if (nextVideoHTML) {
                videoHolder.innerHTML = nextVideoHTML;
                normalizeYTCardHref();
            } else {
                videoHolder.innerHTML = "";
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async (_e) => {
    const body = document.body;

    await new Promise((resolve) => {
        chrome.storage.sync.get(['filters', 'modes'], (data) => {
            if (!data.filters) {
                chrome.storage.sync.set({
                    filters: {
                        byAuthor: false,
                        byName: {
                            enabled: false,
                            value: ""
                        }
                    }
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
                    }
                });
            } else {
                const modes = data.modes;
                sleepCheckBox.checked = modes.sleep;
            }
        });
        resolve();
    });

    await new Promise((resolve) => {
        pasteNextVideo();
        resolve();
    });

    body.classList.remove('loading');
    body.classList.add('loaded');
});

chrome.runtime.onMessage.addListener((message, _sender, _response) => {
    if (message.action === 'nextVideoUpdated') {
        pasteNextVideo(message.nextVideoHTML);
    }
});

// Filters

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
        nameTextBox.value = "";
        nameTextBox.dispatchEvent(new Event('input', { bubbles: true}));
    })
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
        })
    }, 300);
});

// Modes

sleepCheckBox.addEventListener('change', (e) => {
    const isChecked = e.currentTarget.checked;
    chrome.storage.sync.get('modes', (data) => {
        const modes = data.modes;
        modes.sleep = isChecked;
        chrome.storage.sync.set({ modes });
    })
});
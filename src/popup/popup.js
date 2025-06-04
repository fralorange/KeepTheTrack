const authorCheckBox = document.getElementById('author-box');
const gameCheckBox = document.getElementById('game-box');
const nameCheckBox = document.getElementById('name-box');
const nameTextBox = document.getElementById('name-text-box');
let nameTextBoxDebounce;

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

document.addEventListener('DOMContentLoaded', (_e) => {
    chrome.storage.sync.get('filters', (data) => {
        if (!data.filters) {
            chrome.storage.sync.set({
                filters: {
                    byAuthor: false,
                    byGame: false,
                    byName: {
                        enabled: false,
                        value: ""
                    }
                }
            });
        } else {
            const filters = data.filters;
            authorCheckBox.checked = filters.byAuthor;
            gameCheckBox.checked = filters.byGame;
            nameCheckBox.checked = filters.byName.enabled;
            nameTextBox.value = filters.byName.value;
            toggleVisibility(nameTextBox, nameCheckBox.checked);
            chrome.storage.sync.set({ filters });
        }
    });
});

authorCheckBox.addEventListener('change', (e) => {
    const isChecked = e.currentTarget.checked;
    chrome.storage.sync.get('filters', (data) => {
        const filters = data.filters;
        filters.byAuthor = isChecked;
        chrome.storage.sync.set({ filters });
    });
});

gameCheckBox.addEventListener('change', (e) => {
    const isChecked = e.currentTarget.checked;
    chrome.storage.sync.get('filters', (data) => {
        const filters = data.filters;
        filters.byGame = isChecked;
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
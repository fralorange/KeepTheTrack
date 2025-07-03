document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            el.textContent = message;
        }
    });

    const titleTag = document.querySelector('title');
    if (titleTag && titleTag.hasAttribute('data-i18n')) {
        titleTag.textContent = chrome.i18n.getMessage(
            titleTag.getAttribute('data-i18n')
        );
    }
});

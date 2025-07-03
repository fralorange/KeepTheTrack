/**
 * Waits for an element to be present in the DOM.
 * @param {*} selector - The CSS selector for the element to wait for.
 * * @returns {Promise} - A promise that resolves with the element when it is found.
 */
function waitForElement(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

/**
 * Waits for elements to be present in the DOM, with debouncing and a maximum wait time.
 * @param {*} selector - The CSS selector for the elements to wait for.
 * @param {*} debounceTime - The time in milliseconds to debounce the checks.
 * @param {*} maxWait - The maximum time in milliseconds to wait for the elements to appear.
 * @returns {Promise} - A promise that resolves with an array of elements when they are found.
 */
function waitForElements(selector, debounceTime = 200, maxWait = 5000) {
    return new Promise((resolve) => {
        let lastCount = 0;
        let debounceTimer = null;
        let maxWaitTimer = null;

        const check = () => {
            const elements = document.querySelectorAll(selector);
            const currentCount = elements.length;

            if (currentCount !== lastCount) {
                lastCount = currentCount;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    observer.disconnect();
                    clearTimeout(debounceTimer);
                    resolve(Array.from(document.querySelectorAll(selector)));
                }, debounceTime);
            }
        };

        check();

        const observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });

        maxWaitTimer = setTimeout(() => {
            observer.disconnect();
            clearTimeout(debounceTimer);
            resolve(Array.from(document.querySelectorAll(selector)));
        }, maxWait);
    });
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((x) => x + x)
            .join('');
    }
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

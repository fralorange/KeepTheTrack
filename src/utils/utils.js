function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function waitForElements(selector, debounceTime = 200, maxWait = 5000) {
    return new Promise(resolve => {
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


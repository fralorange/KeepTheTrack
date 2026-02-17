/**
 * Applies localization to a specific element
 * @param el Element that being localized.
 * @returns {void}
 */
export function applyLocale<T extends HTMLElement>(el: T): void {
	const key = el.getAttribute("data-i18n");
	if (!key) return;

	const message = chrome.i18n.getMessage(key);
	if (!message) return;

	el.textContent = message;
	if (el.hasAttribute("title")) {
		el.title = message;
	}

	if (el instanceof HTMLInputElement && el.hasAttribute("placeholder")) {
		el.placeholder = message;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");
	elements.forEach((el) => {
		applyLocale(el);
	});

	const titleTag = document.querySelector("title");
	if (titleTag && titleTag.hasAttribute("data-i18n")) {
		titleTag.textContent = chrome.i18n.getMessage(titleTag.getAttribute("data-i18n")!);
	}
});

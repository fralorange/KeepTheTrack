import { PopupVideoStructure } from "../types/video";

/**
 * Waits for an element to be present in the DOM.
 * @param {*} selector The CSS selector for the element to wait for.
 * @returns {Promise} A promise that resolves with the element when it is found.
 */
export function waitForElement<T extends HTMLElement>(selector: string): Promise<T | null> {
	return new Promise((resolve) => {
		if (document.querySelector(selector)) {
			return resolve(document.querySelector<T>(selector));
		}

		const observer = new MutationObserver(() => {
			if (document.querySelector<T>(selector)) {
				observer.disconnect();
				resolve(document.querySelector<T>(selector));
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
 * @param {*} selector The CSS selector for the elements to wait for.
 * @param {*} debounceTime The time in milliseconds to debounce the checks.
 * @param {*} maxWait The maximum time in milliseconds to wait for the elements to appear.
 * @returns {Promise} A promise that resolves with an array of elements when they are found.
 */
export function waitForElements(
	selector: string,
	debounceTime: number = 200,
	maxWait: number = 5000,
): Promise<Element[]> {
	return new Promise((resolve) => {
		let lastCount = 0;
		let debounceId: number | undefined = undefined;
		let maxWaitId: number | undefined = undefined;

		const cleanup = () => {
			observer.disconnect();
			clearTimeout(debounceId);
			clearTimeout(maxWaitId);
		};

		const finish = () => {
			cleanup();
			resolve(Array.from(document.querySelectorAll(selector)));
		};

		const check = () => {
			const elements = document.querySelectorAll(selector);
			const currentCount = elements.length;

			if (currentCount !== lastCount) {
				lastCount = currentCount;

				clearTimeout(debounceId);
				debounceId = window.setTimeout(() => {
					finish();
				}, debounceTime);
			}
		};

		maxWait = window.setTimeout(() => {
			finish();
		}, maxWait);

		check();

		const observer = new MutationObserver(check);
		observer.observe(document.body, { childList: true, subtree: true });
	});
}

/**
 * Gets an element by its ID and throws an error if it is not found.
 * @param id The ID of the element to retrieve.
 * @returns The element with the specified ID.
 * @throws An error if the element with the specified ID is not found.
 */
export function getElement<T extends HTMLElement>(id: string): T {
	const el = document.getElementById(id);
	if (!el) {
		throw new Error(`Element with id ${id} not found`);
	}
	return el as T;
}

/**
 * Gets an element by a CSS selector and throws an error if it is not found.
 * @param selector The CSS selector of the element to retrieve.
 * @returns The element that matches the specified CSS selector.
 * @throws An error if the element that matches the specified CSS selector is not found.
 */
export function getSelector<T extends HTMLElement>(selector: string): T {
	const el = document.querySelector(selector);
	if (!el) {
		throw new Error(`Element with selector ${selector} not found`);
	}
	return el as T;
}

/**
 * Toggles the visibility of an element and executes a callback if provided.
 * @param {*} element - The DOM element to toggle visibility for.
 * @param {*} visible - A boolean indicating whether the element should be visible or not.
 * @param {*} callback - An optional callback function to execute when the element is hidden.
 */
export function toggleVisibility(
	element: HTMLElement,
	visible: boolean,
	callback: (() => void) | undefined = undefined,
) {
	if (visible) {
		element.classList.remove("hidden");
	} else {
		element.classList.add("hidden");
		if (typeof callback == "function") {
			callback();
		}
	}
}

/**
 * Decomposes video card into popup video structure.
 * @param element The DOM element that being decomposed.
 * @returns {PopupVideoStructure | null}
 */
export function decomposeVideo(element: HTMLElement | null): PopupVideoStructure {
	const link = element?.querySelector("a");
	const href = link?.href ?? null;

	const img = link?.querySelector("img");
	let src = img?.src ?? null;

	if (!src && href) {
		const url = new URL(href);
		const videoId = url.searchParams.get("v");
		src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
	}

	const heading = element?.querySelector("h3");
	const title = heading?.title ?? null;

	const span = element?.querySelector("div > span");
	const author = span?.textContent ?? null;

	return {
		videoHref: href,
		videoSrc: src,
		videoTitle: title,
		videoAuthor: author,
	};
}

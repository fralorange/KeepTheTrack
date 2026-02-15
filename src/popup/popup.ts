import "./popup.css";
import "../utils/i18n";
import Data from "../types/data";
import { Message, ResponseMessage } from "../types/messages";
import { getElement, getSelector, toggleVisibility } from "../utils/elements";
import { DEFAULT_FILTERS } from "../types/filters";

const nextVideoFieldset = getElement("next-video-fieldset");
const videoHolder = getSelector("div#video-holder.container");
const sleepCheckBox = getElement<HTMLInputElement>("sleep-box");
const authorCheckBox = getElement<HTMLInputElement>("author-box");
const nameCheckBox = getElement<HTMLInputElement>("name-box");
const nameTextBox = getElement<HTMLInputElement>("name-text-box");

let nameTextBoxDebounceId: number | undefined = undefined;
let nextVideoHTML: string | null = null;

/**
 * Normalizes the YouTube card href by ensuring it points to the full URL.
 */
function normalizeYTCardHref() {
	const link = videoHolder?.querySelector('a[href^="/watch"]');
	if (!link) return;

	const thumbVM = link.querySelector("yt-thumbnail-view-model");
	if (thumbVM) {
		Array.from(thumbVM.children).forEach((child) => {
			if (!child.querySelector("img")) {
				child.remove();
			}
		});
	}

	const relHref = link.getAttribute("href");
	if (relHref?.startsWith("/watch")) {
		link.setAttribute("href", "https://www.youtube.com" + relHref);
		link.setAttribute("target", "_blank");
	}
}

/**
 * Pastes the next video HTML into the video holder and updates the visibility of the next video fieldset.
 */
function pasteNextVideo(nextVideoHTMLParam: string | null) {
	if (nextVideoHTML === nextVideoHTMLParam) return;

	nextVideoHTML = nextVideoHTMLParam;
	toggleVisibility(nextVideoFieldset, !!nextVideoHTML);
	if (nextVideoHTML) {
		videoHolder.innerHTML = nextVideoHTML;
		normalizeYTCardHref();
	} else {
		videoHolder.innerHTML = "";
	}
}

/**
 * Requests next video from the current active tab.
 */
function requestNextVideo() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		console.log(tabs);
		if (!tabs || !tabs[0] || !tabs[0].id) {
			return;
		}
		const tabId = tabs[0].id;

		const message: Message = { action: "requestNextVideo" };

		chrome.tabs.sendMessage(tabId, message, (response: ResponseMessage) => {
			if (chrome.runtime.lastError) {
				return;
			}
			pasteNextVideo(response.nextVideoHTML);
		});
	});
}

/**
 * Sets up a message listener to handle incoming messages from the content script.
 */
function setupMessagesHandler() {
	chrome.runtime.onMessage.addListener((message: Message, sender) => {
		if (message.action === "updateNextVideo") {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs?.[0]?.id;

				if (sender.tab?.id !== activeTabId) {
					return;
				}

				pasteNextVideo(message.nextVideoHTML);
			});
		}
	});
}

/**
 * Sets up listeners for filter checkboxes and text input.
 */
function setupFilterListeners() {
	authorCheckBox?.addEventListener("change", (e) => {
		const isChecked = (e.currentTarget as HTMLInputElement).checked;
		chrome.storage.sync.get("filters", (data: Data) => {
			const filters = data.filters;
			filters.byAuthor = isChecked;
			chrome.storage.sync.set({ filters });
		});
	});

	nameCheckBox?.addEventListener("change", (e) => {
		const isChecked = (e.currentTarget as HTMLInputElement).checked;
		// Visual
		toggleVisibility(nameTextBox, isChecked, () => {
			nameTextBox.value = "";
			nameTextBox.dispatchEvent(new Event("input", { bubbles: true }));
		});
		// Logic
		chrome.storage.sync.get("filters", (data: Data) => {
			const filters = data.filters;
			filters.byName.enabled = isChecked;
			chrome.storage.sync.set({ filters });
		});
	});

	nameTextBox.addEventListener("input", (e) => {
		clearTimeout(nameTextBoxDebounceId);

		const targetValue = (e.currentTarget as HTMLInputElement).value;

		nameTextBoxDebounceId = setTimeout(() => {
			chrome.storage.sync.get("filters", (data: Data) => {
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
	sleepCheckBox.addEventListener("change", (e) => {
		const isChecked = (e.currentTarget as HTMLInputElement).checked;
		chrome.storage.sync.get("modes", (data: Data) => {
			const modes = data.modes;
			modes.sleepMode = isChecked;
			chrome.storage.sync.set({ modes });
		});
	});
}

/**
 * Sets up a listener for the options button to open the options page.
 */
function setupButtonListener() {
	document.getElementById("options-btn")?.addEventListener("click", () => {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL("options.html"));
		}
	});
}

document.addEventListener("DOMContentLoaded", async (_e) => {
	await new Promise<void>((resolve) => {
		chrome.storage.sync.get(["filters", "modes"], (data: Data) => {
			if (!data.filters) {
				chrome.storage.sync.set({
					filters: DEFAULT_FILTERS,
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
						sleepMode: false,
					},
				});
			} else {
				const modes = data.modes;
				sleepCheckBox.checked = modes.sleepMode;
			}

			resolve();
		});
	});

	await new Promise<void>((resolve) => {
		requestNextVideo();
		resolve();
	});

	requestAnimationFrame(() => {
		setTimeout(() => {
			document.body.classList.remove("loading");
		}, 20);
	});
});

setupMessagesHandler();
setupFilterListeners();
setupModeListeners();
setupButtonListener();

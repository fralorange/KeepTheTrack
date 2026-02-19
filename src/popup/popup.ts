import "./popup.css";
import "../utils/i18n";
import Data from "../types/data";
import { Message, ResponseMessage } from "../types/messages";
import { getElement, toggleVisibility } from "../utils/elements";
import { DEFAULT_FILTERS } from "../types/filters";
import { PopupVideoStructure } from "../types/video";
import { applyLocale } from "../utils/i18n";
import { DEFAULT_MODES } from "../types/modes";

const nextVideoTitle = getElement<HTMLElement>("next-video-title");
const nextVideoAuthor = getElement<HTMLElement>("next-video-author");
const thumbnailHolder = getElement<HTMLAnchorElement>("next-video-thumb");
const sleepCheckBox = getElement<HTMLInputElement>("sleep-box");
const authorCheckBox = getElement<HTMLInputElement>("author-box");
const nameCheckBox = getElement<HTMLInputElement>("name-box");
const nameTextBox = getElement<HTMLInputElement>("name-text-box");
const shuffleCheckBox = getElement<HTMLInputElement>("shuffle-box");
const focusCheckBox = getElement<HTMLInputElement>("focus-box");
const cinemaCheckBox = getElement<HTMLInputElement>("cinema-box");

let nameTextBoxDebounceId: number | undefined = undefined;
let nextVideo: PopupVideoStructure;

/**
 * Sets the thumbnail image and link for the next video block.
 * @param url  The thumbnail image URL. Pass null to reset to placeholder.
 * @param link The URL to open when the thumbnail is clicked. Pass null to disable the link.
 */
function setThumbnail(url: string | null, link: string | null) {
	if (url) {
		thumbnailHolder.style.backgroundImage = `
			url(${url}),
			linear-gradient(135deg, #343434, #1a1a1a)
		`;

		thumbnailHolder.classList.add("has-image");
	} else {
		thumbnailHolder.style.backgroundImage = "";
		thumbnailHolder.classList.remove("has-image");
	}

	thumbnailHolder.href = link ?? "#";
}

/**
 * Sets the metadata for the next video block (e.g. title and author).
 * @param title The title of the video.
 * @param author The author of the video.
 */
function setMetadata(title: string | null, author: string | null) {
	if (title && nextVideoTitle.hasAttribute("data-i18n")) {
		nextVideoTitle.setAttribute("data-i18n", "");
		nextVideoTitle.innerHTML = title;
		nextVideoTitle.title = title;
	} else {
		nextVideoTitle.setAttribute("data-i18n", "extensionNextVideoTitle");
		applyLocale(nextVideoTitle);
	}

	if (author && nextVideoAuthor.hasAttribute("data-i18n")) {
		nextVideoAuthor.setAttribute("data-i18n", "");
		nextVideoAuthor.innerHTML = author;
		nextVideoAuthor.title = author;
	} else {
		nextVideoAuthor.setAttribute("data-i18n", "extensionNextVideoAuthor");
		applyLocale(nextVideoAuthor);
	}
}

/**
 * Pastes the next video HTML into the video holder and updates the visibility of the next video fieldset.
 */
function pasteNextVideo(nextVideoParam: PopupVideoStructure) {
	if (nextVideo === nextVideoParam) return;
	nextVideo = nextVideoParam;

	const { videoAuthor, videoTitle, videoHref, videoSrc } = nextVideoParam;

	if (nextVideo) {
		setThumbnail(videoSrc, videoHref);
		setMetadata(videoTitle, videoAuthor);
	} else {
		setThumbnail(null, null);
		setMetadata(null, null);
	}
}

/**
 * Requests next video from the current active tab.
 */
function requestNextVideo() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (!tabs || !tabs[0] || !tabs[0].id) {
			return;
		}

		if (!tabs[0].url?.includes("/watch")) {
			return;
		}

		const tabId = tabs[0].id;

		const message: Message = { action: "requestNextVideo" };

		chrome.tabs.sendMessage(tabId, message, (response: ResponseMessage) => {
			if (chrome.runtime.lastError) return;
			pasteNextVideo(response);
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

				const { action, ...cleanVideo } = message;

				pasteNextVideo(cleanVideo);
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

	shuffleCheckBox.addEventListener("change", (e) => {
		const isChecked = (e.currentTarget as HTMLInputElement).checked;
		chrome.storage.sync.get("filters", (data: Data) => {
			const filters = data.filters;
			filters.shuffle = isChecked;
			chrome.storage.sync.set({ filters });
		});
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

	focusCheckBox.addEventListener("change", (e) => {
		const isChecked = (e.currentTarget as HTMLInputElement).checked;
		chrome.storage.sync.get("modes", (data: Data) => {
			const modes = data.modes;
			modes.focusMode = isChecked;
			chrome.storage.sync.set({ modes });
		});
	});

	cinemaCheckBox.addEventListener("change", (e) => {
		const isChecked = (e.currentTarget as HTMLInputElement).checked;
		chrome.storage.sync.get("modes", (data: Data) => {
			const modes = data.modes;
			modes.cinemaMode = isChecked;
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
				shuffleCheckBox.checked = filters.shuffle;
				toggleVisibility(nameTextBox, nameCheckBox.checked);
			}

			if (!data.modes) {
				chrome.storage.sync.set({
					modes: DEFAULT_MODES,
				});
			} else {
				const modes = data.modes;
				sleepCheckBox.checked = modes.sleepMode;
				cinemaCheckBox.checked = modes.cinemaMode;
				focusCheckBox.checked = modes.focusMode;
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

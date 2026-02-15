import { Message, ResponseMessage } from "../types/messages";
import { createStore } from "../types/store";
import {
	startPlaylistObserver,
	startRecommendationsObserver,
} from "../utils/observers";
import {
	AutoplayOverride,
	createAutoplayOverride,
} from "./features/autoplayOverride";
import { createSleepOverlay, SleepOverlay } from "./features/sleepOverlay";

(() => {
	const store = createStore();

	let autoplayOverride: AutoplayOverride | null = null;
	let sleepOverlay: SleepOverlay | null = null;

	let playlistObserver: MutationObserver | null = null;
	let recommendationsObserver: MutationObserver | null = null;
	let isInitializing = false;

	/**
	 * Sets up all the features of the extension.
	 * @returns {Promise<void>}
	 */
	const setupFeatures = async (): Promise<void> => {
		autoplayOverride = await createAutoplayOverride(store);
		sleepOverlay = await createSleepOverlay();
	};

	/**
	 * Sets up a listener for changes in the storage area.
	 * @returns {void}
	 */
	const setupChangesHandler = (): void => {
		chrome.storage.onChanged.addListener(async (changes, area) => {
			if (area === "sync" && changes.filters) {
				await autoplayOverride?.applyFilters();
			} else if (area === "sync" && (changes.modes || changes.preferences)) {
				await sleepOverlay?.applyOverlay();
			}
		});
	};

	/**
	 * Sets up a message listener to handle requests from different sources.
	 */
	const setupMessagesHandler = () => {
		chrome.runtime.onMessage.addListener((message: Message) => {
			if (message.action === "requestTabUpdate") {
				setupFeatures();
			}
		});

		chrome.runtime.onMessage.addListener(
			(
				message: Message,
				_sender,
				sendResponse: (response: ResponseMessage) => void,
			) => {
				if (message.action === "requestNextVideo") {
					let response: ResponseMessage = {
						nextVideoHTML: store.getNextVideo()?.outerHTML ?? null,
					};
					sendResponse(response);
				}
			},
		);
	};

	/**
	 * Initializes the content script by setting up observers and handlers.
	 */
	const init = async () => {
		if (isInitializing) return;
		isInitializing = true;

		try {
			playlistObserver?.disconnect();
			recommendationsObserver?.disconnect();

			await setupFeatures();

			playlistObserver = startPlaylistObserver(async () => {
				await autoplayOverride?.applyFilters();
			});
			recommendationsObserver = await startRecommendationsObserver(async () => {
				await autoplayOverride?.applyFilters();
			});
		} finally {
			isInitializing = false;
		}
	};

	/**
	 * Sets up the initial event handler for DOMContentLoaded and yt-navigate-finish.
	 */
	const setupInitHandler = () => {
		if (document.readyState == "loading") {
			document.addEventListener("DOMContentLoaded", init);
		} else {
			init();
		}
		document.addEventListener("yt-navigate-finish", init);
	};

	setupInitHandler();
	setupChangesHandler();
	setupMessagesHandler();
})();

import { Message, ResponseMessage } from "../types/messages";
import Modes from "../types/modes";
import { createStore } from "../types/store";
import { decomposeVideo } from "../utils/elements";
import { RecommendationsObserver, startPlaylistObserver, startRecommendationsObserver } from "../utils/observers";
import { AutoplayOverride, createAutoplayOverride } from "./features/autoplayOverride";
import { createFocusOverlay, FocusOverlay } from "./features/focusOverlay";
import { createSleepOverlay, SleepOverlay } from "./features/sleepOverlay";

(() => {
	const store = createStore();

	let autoplayOverride: AutoplayOverride | null = null;
	let sleepOverlay: SleepOverlay | null = null;
	let focusOverlay: FocusOverlay | null = null;

	let playlistObserver: MutationObserver | null = null;
	let recommendationsObserver: RecommendationsObserver | null = null;

	let initPromise: Promise<void> | null = null; // Mutex for initialization

	/**
	 * Sets up all the features of the extension.
	 * @returns {Promise<void>}
	 */
	const setupFeatures = async (): Promise<void> => {
		autoplayOverride?.destroy();
		sleepOverlay?.destroy();
		focusOverlay?.destroy();

		autoplayOverride = await createAutoplayOverride(store);
		sleepOverlay = await createSleepOverlay();
		focusOverlay = await createFocusOverlay();
	};

	/**
	 * Sets up a listener for changes in the storage area.
	 * @returns {void}
	 */
	const setupChangesHandler = (): void => {
		chrome.storage.onChanged.addListener(async (changes, area) => {
			if (area !== "sync") return;

			if (changes.filters) {
				await autoplayOverride?.applyFilters();
			} else if (changes.preferences) {
				await sleepOverlay?.applyOverlay();
				await focusOverlay?.applyOverlay();
			} else if (changes.modes) {
				const oldModes = changes.modes.oldValue as Modes;
				const newModes = changes.modes.newValue as Modes;
				if (!oldModes || !newModes) return;

				if (oldModes.focusMode !== newModes.focusMode) {
					await focusOverlay?.applyOverlay();
				}

				if (oldModes.sleepMode !== newModes.sleepMode) {
					await sleepOverlay?.applyOverlay();
				}
			}
		});
	};

	/**
	 * Sets up a message listener to handle requests from different sources.
	 */
	const setupMessagesHandler = () => {
		chrome.runtime.onMessage.addListener((message: Message) => {
			if (message.action === "requestTabUpdate") {
				init();
			}
		});

		chrome.runtime.onMessage.addListener(
			(message: Message, _sender, sendResponse: (response: ResponseMessage) => void) => {
				if (message.action === "requestNextVideo") {
					let nextVideo = store.getNextVideo();

					let popupVideo = decomposeVideo(nextVideo);

					sendResponse(popupVideo);
				}
			},
		);
	};

	/**
	 * Initializes the content script by setting up observers and features.
	 * Uses a mutex to prevent concurrent initializations.
	 * @returns {Promise<void>}
	 */
	const init = async (): Promise<void> => {
		if (initPromise) return initPromise;

		initPromise = (async () => {
			playlistObserver?.disconnect();
			recommendationsObserver?.destroy();

			await setupFeatures();

			playlistObserver = startPlaylistObserver(async () => {
				await autoplayOverride?.applyFilters();
			});

			recommendationsObserver = await startRecommendationsObserver(async () => {
				await autoplayOverride?.applyFilters();
			});
		})();

		await initPromise;
		initPromise = null;
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

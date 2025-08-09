(() => {
	let playlistObserver = null;
	let recommendationsObserver = null;

	/**
	 * Handles the autoplay override by fetching video cards and setting up event listeners.
	 * @returns {Promise<void>}
	 */
	const handleVideo = async () => {
		await initAutoplayOverride();
		await applySleepOverlay();
	};

	/**
	 * Sets up a listener for changes in the storage area to apply filters or modes.
	 * @returns {Promise<void>}
	 */
	const setupChangesHandler = () => {
		chrome.storage.onChanged.addListener(async (changes, area) => {
			if (area === "sync" && changes.filters) {
				await applyOverrideFilters();
			} else if (area === "sync" && (changes.modes || changes.preferences)) {
				await applySleepOverlay();
			}
		});
	};

	/**
	 * Sets up a message listener to handle requests from the background script.
	 */
	const setupMessagesHandler = () => {
		chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
			if (message.action === "requestNextVideo") {
				sendResponse({ data: nextVideo?.outerHTML });
			} else if (message.action === "requestTabUpdate") {
				handleVideo();
			}
		});
	};

	/**
	 * Initializes the content script by setting up observers and handlers.
	 */
	const init = async () => {
		playlistObserver?.disconnect();
		recommendationsObserver?.disconnect();

		await handleVideo();

		playlistObserver = startPlaylistObserver(async () => {
			await applyOverrideFilters();
		});
		recommendationsObserver = await startRecommendationsObserver(handleVideo);
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

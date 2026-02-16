import { waitForElement } from "./elements";

/**
 * Defines the structure of the recommendations observer, which includes the MutationObserver instance and a destroy function to clean up the observer when it's no longer needed.
 */
export type RecommendationsObserver = {
	observer: MutationObserver;
	destroy: () => void;
};

/**
 * Starts an observer for the playlist panel to detect when it becomes visible.
 * @param {*} onPlaylistVisible - Callback function to execute when the playlist panel becomes visible.
 * @returns {MutationObserver|null} - The MutationObserver instance or null if the playlist panel is not found.
 */
export function startPlaylistObserver(
	onPlaylistVisible: () => void,
): MutationObserver | null {
	let playlistObserver = new MutationObserver((mutations) => {
		for (let mut of mutations) {
			if (
				mut.type === "attributes" &&
				mut.target.nodeType === Node.ELEMENT_NODE &&
				mut.target instanceof Element &&
				mut.target.tagName.toLowerCase() === "ytd-playlist-panel-renderer"
			) {
				onPlaylistVisible();
			}
		}
	});

	const flexy = document.querySelector("ytd-watch-flexy");
	if (!flexy) return null;

	playlistObserver.observe(flexy, {
		subtree: true,
		attributes: true,
		attributeFilter: ["hidden"],
	});

	return playlistObserver;
}

/**
 * Starts an observer for the recommendations section to detect changes in video cards.
 * @param {*} onRecommendationsChanged - Callback function to execute when recommendations change.
 * @returns {Promise<RecommendationsObserver|null>} - A promise that resolves to an object containing the MutationObserver instance and a destroy function, or null if the recommendations container is not found.
 */
export async function startRecommendationsObserver(
	onRecommendationsChanged: () => void,
): Promise<RecommendationsObserver | null> {
	let debounceId: number | undefined = undefined;

	let cardName = "yt-lockup-view-model";
	let recommendationsObserver = new MutationObserver((mutations) => {
		let changed = false;
		for (let mut of mutations) {
			if (mut.addedNodes.length || mut.removedNodes.length) {
				mut.addedNodes.forEach((node) => {
					if (
						node.nodeType === Node.ELEMENT_NODE &&
						node instanceof Element &&
						(node.tagName.toLowerCase() === cardName ||
							node.querySelector(cardName))
					) {
						changed = true;
					}
				});
				mut.removedNodes.forEach((node) => {
					if (
						node.nodeType === Node.ELEMENT_NODE &&
						node instanceof Element &&
						(node.tagName.toLowerCase() === cardName ||
							node.querySelector(cardName))
					) {
						changed = true;
					}
				});
			}
		}

		if (changed) {
			clearTimeout(debounceId);
			debounceId = setTimeout(() => {
				onRecommendationsChanged();
			}, 200);
		}
	});

	const parent =
		"ytd-item-section-renderer.style-scope.ytd-watch-next-secondary-results-renderer";
	const child = "div#contents.style-scope.ytd-item-section-renderer";
	const container = await waitForElement(`${parent} ${child}`);
	if (!container) return null;

	recommendationsObserver.observe(container, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["src"],
	});

	return {
		observer: recommendationsObserver,
		destroy: () => {
			recommendationsObserver.disconnect();
			clearTimeout(debounceId);
		},
	};
}

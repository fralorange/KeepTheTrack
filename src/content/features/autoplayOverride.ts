import Data from "../../types/data";
import { DEFAULT_FILTERS } from "../../types/filters";
import { Message } from "../../types/messages";
import { Store } from "../../types/store";
import { waitForElement, waitForElements } from "../../utils/elements";

/**
 * Defines the structure of YouTube video content information.
 */
interface YouTubeContent {
	title: string | null;
	author: string | null;
	urlEl: HTMLElement | null;
}

/**
 * Defines the structure of the autoplay override feature.
 */
export interface AutoplayOverride {
	applyFilters: () => Promise<void>;
}

/**
 * Creates an autoplay override feature that allows filtering the next video based on various criteria (e.g. author, title).
 * @param store The store instance to manage the state of the next video.
 */
export async function createAutoplayOverride(
	store: Store,
): Promise<AutoplayOverride> {
	const youtubePlayer = document.getElementsByClassName("video-stream")[0];
	const cards = await waitForElements("yt-lockup-view-model");

	const onYouTubeEnded = () => {
		const next = store.getNextVideo();
		if (next) {
			next.click();
		}
	};

	let currentAuthor: string = (await waitForElement("#upload-info a"))
		.innerText;
	let youtubeContents: YouTubeContent[] = Array.from(cards).map<YouTubeContent>(
		(card) => {
			const titleEl = card.querySelector(
				"a.yt-lockup-metadata-view-model__title",
			);
			const title = titleEl?.textContent.trim() || null;

			const urlEl =
				Array.from(
					card.querySelectorAll<HTMLAnchorElement>('a[href^="/watch"]'),
				).find((a) => a.querySelector("img")) ?? null;

			const authorEl = card.querySelector(
				".yt-content-metadata-view-model__metadata-row > span.yt-core-attributed-string",
			);
			const author = authorEl?.textContent?.trim() || null;

			return { title, author, urlEl };
		},
	);

	if (youtubePlayer) {
		youtubePlayer.removeEventListener("ended", onYouTubeEnded);
		youtubePlayer.addEventListener("ended", onYouTubeEnded);
	}

	/**
	 * Applies the override filters to the video list and updates the next video element.
	 * @returns {Promise<void>}
	 */
	async function applyFilters(): Promise<void> {
		const updateNextVideo = (value: HTMLElement | null) => {
			store.setNextVideo(value);

			const message: Message = {
				action: "updateNextVideo",
				nextVideoHTML: value?.outerHTML || null,
			};
			chrome.runtime.sendMessage(message);
		};

		return new Promise<void>((resolve) => {
			const playlistPanel = document.querySelector(
				".ytd-watch-flexy ytd-playlist-panel-renderer",
			);

			if (playlistPanel && !playlistPanel.hasAttribute("hidden")) {
				updateNextVideo(null);
				return resolve();
			}

			chrome.storage.sync.get("filters", (data: Data) => {
				const filters = data.filters || DEFAULT_FILTERS;

				const predicates: Array<(item: YouTubeContent) => boolean> = [];

				if (filters.byAuthor) {
					predicates.push((item) => item.author === currentAuthor);
				}

				if (
					filters.byName.enabled &&
					filters.byName.value.trim().toLowerCase() !== ""
				) {
					const pattern = filters.byName.value.trim().toLowerCase();

					predicates.push(
						(item) => item.title?.toLowerCase().includes(pattern) ?? false,
					);
				}

				const filteredContents =
					predicates.length === 0
						? []
						: youtubeContents.filter((content) =>
								predicates.every((predicate) => predicate(content)),
							);

				updateNextVideo(
					filteredContents.length > 0 ? filteredContents[0].urlEl : null,
				);

				resolve();
			});
		});
	}

	await applyFilters();

	return {
		applyFilters,
	};
}

import Data from "../../types/data";
import { DEFAULT_FILTERS } from "../../types/filters";
import { Message } from "../../types/messages";
import { Store } from "../../types/store";
import { decomposeVideo, waitForElement, waitForElements } from "../../utils/elements";

/**
 * Defines the structure of YouTube video content information.
 */
interface YouTubeContent {
	title: string | null;
	author: string | null;
	card: HTMLElement | null;
}

/**
 * Defines the structure of the YouTube information that being used for filtering the next video.
 */
interface YouTubeInfo {
	author: string;
	youtubeContents: YouTubeContent[];
}

/**
 * Defines the structure of the autoplay override feature.
 */
export interface AutoplayOverride {
	applyFilters: () => Promise<void>;
	destroy: () => void;
}

/**
 * Creates an autoplay override feature that allows filtering the next video based on various criteria (e.g. author, title).
 * @param store The store instance to manage the state of the next video.
 */
export async function createAutoplayOverride(store: Store): Promise<AutoplayOverride> {
	const youtubePlayer = document.getElementsByClassName("video-stream")[0];

	/**
	 * Handles the "ended" event of the YouTube player by clicking the next video if it exists.
	 */
	const onYouTubeEnded = () => {
		const next = store.getNextVideo();
		const link = next?.querySelector("a");
		if (next) {
			link?.click();
		}
	};

	if (youtubePlayer) {
		youtubePlayer.removeEventListener("ended", onYouTubeEnded);
		youtubePlayer.addEventListener("ended", onYouTubeEnded);
	}

	const getYouTubeInfo = async (): Promise<YouTubeInfo> => {
		const youtubeCards = await waitForElements("yt-lockup-view-model");
		let youtubeContents: YouTubeContent[] = Array.from(youtubeCards).map<YouTubeContent>((card) => {
			const titleEl = card.querySelector("a.yt-lockup-metadata-view-model__title");
			const title = titleEl?.textContent.trim() || null;

			const authorEl = card.querySelector(
				".yt-content-metadata-view-model__metadata-row > span.yt-core-attributed-string",
			);
			const author = authorEl?.textContent?.trim() || null;

			return { title, author, card: card instanceof HTMLElement ? card : null };
		});

		let author: string = (await waitForElement("#upload-info a"))?.innerText ?? "";

		return { author, youtubeContents };
	};

	/**
	 * Applies the override filters to the video list and updates the next video element.
	 * @returns {Promise<void>}
	 */
	const applyFilters = async (): Promise<void> => {
		const updateNextVideo = (value: HTMLElement | null) => {
			store.setNextVideo(value);

			const popupVideo = decomposeVideo(value);

			const message: Message = {
				action: "updateNextVideo",
				...popupVideo,
			};
			chrome.runtime.sendMessage(message);
		};

		const getFilters = (): Promise<Data["filters"]> =>
			new Promise((resolve) => {
				chrome.storage.sync.get("filters", (data: Data) => {
					resolve(data.filters || DEFAULT_FILTERS);
				});
			});

		const playlistPanel = document.querySelector(".ytd-watch-flexy ytd-playlist-panel-renderer");

		if (playlistPanel && !playlistPanel.hasAttribute("hidden")) {
			updateNextVideo(null);
			return;
		}

		const filters = await getFilters();
		const { author, youtubeContents } = await getYouTubeInfo();

		const predicates: Array<(item: YouTubeContent) => boolean> = [];

		if (filters.byAuthor) {
			predicates.push((item) => item.author === author);
		}

		if (filters.byName.enabled && filters.byName.value.trim().toLowerCase() !== "") {
			const pattern = filters.byName.value.trim().toLowerCase();

			predicates.push((item) => item.title?.toLowerCase().includes(pattern) ?? false);
		}

		const filteredContents =
			predicates.length === 0
				? []
				: youtubeContents.filter((content) => predicates.every((predicate) => predicate(content)));

		if (filters.shuffle) {
			const index = Math.floor(Math.random() * filteredContents.length);
			updateNextVideo(filteredContents[index]?.card || null);
		} else {
			updateNextVideo(filteredContents[0]?.card || null);
		}
	};

	await applyFilters();

	return {
		applyFilters,
		destroy: () => youtubePlayer.removeEventListener("ended", onYouTubeEnded),
	};
}

import Data from "../../types/data";
import { DEFAULT_PREFERENCES, Preferences } from "../../types/preferences";

/**
 * Defines the interface for the cinema overlay feature.
 */
export interface CinemaOverlay {
	applyOverlay: () => Promise<void>;
	destroy: () => void;
}

/**
 * Creates a cinema overlay state that applies a visual overlay to all besides player elements.
 * @returns {CinemaOverlay} An object with methods to apply and destroy the cinema overlay.
 */
export async function createCinemaOverlay(): Promise<CinemaOverlay> {
	let preferences: Preferences | null = null;

	const oldPositions = new Map<string, string>();
	const oldZIndexes = new Map<string, string>();

	const overlayId = "keep-the-track-cinema-overlay";

	let cinema = false;

	/**
	 * Appends overlay and adds video-player as an exclusion to it.
	 */
	const appendOverlay = (): void => {
		if (cinema) {
			removeOverlay();
		}
		cinema = true;

		const overlay = document.createElement("div");

		overlay.id = overlayId;
		overlay.style.position = "fixed";
		overlay.style.inset = "0";
		overlay.style.background = `rgba(0, 0, 0, ${preferences?.cinemaOverlayOpacity ?? DEFAULT_PREFERENCES.cinemaOverlayOpacity})`;
		overlay.style.zIndex = "9999";
		overlay.style.pointerEvents = "none";

		document.body.appendChild(overlay);

		const targetSelectors = ["#player", "#full-bleed-container"];
		targetSelectors.forEach((selector) => {
			const el = document.querySelector<HTMLElement>(selector);
			if (el) {
				oldPositions.set(selector, el.style.position);
				oldZIndexes.set(selector, el.style.zIndex);

				el.style.position = "relative";
				el.style.zIndex = "10000";
			}
		});
	};

	/**
	 * Removes overlay and exclusion styles from video-player.
	 * @returns
	 */
	const removeOverlay = (): void => {
		if (!cinema) return;
		cinema = false;

		const overlay = document.querySelector<HTMLElement>(`#${overlayId}`);
		overlay?.remove();

		oldPositions.forEach((position, selector) => {
			const zIndex = oldZIndexes.get(selector);
			const el = document.querySelector<HTMLElement>(selector);
			if (el && typeof zIndex === "string") {
				el.style.position = position;
				el.style.zIndex = zIndex;
			}
		});

		oldPositions.clear();
		oldZIndexes.clear();
	};

	/**
	 * Applies overlay setting based on the current mode.
	 * @returns {Promise<void>}
	 */
	const applyOverlay = async (): Promise<void> => {
		return new Promise<void>((resolve) => {
			chrome.storage.sync.get(["modes", "preferences"], (data: Data) => {
				preferences = data.preferences || DEFAULT_PREFERENCES;
				if (data.modes?.cinemaMode) {
					appendOverlay();
				} else {
					removeOverlay();
				}
				resolve();
			});
		});
	};

	await applyOverlay();

	return {
		applyOverlay,
		destroy: removeOverlay,
	};
}

import Data from "../../types/data";
import { DEFAULT_PREFERENCES, Preferences } from "../../types/preferences";
import { hexToRgb } from "../../utils/colors";

/**
 * Defines the interface for the focus overlay feature, which provides a visual overlay.
 */
export interface FocusOverlay {
	applyOverlay: () => Promise<void>;
	destroy: () => void;
}

/**
 * Creates a focus overlay state that applies a visual overlay to the screen.
 * @returns {FocusOverlay} An object with methods to apply and destroy the focus overlay.
 */
export async function createFocusOverlay(): Promise<FocusOverlay> {
	let preferences: Preferences | null = null;
	let blured: boolean = false;

	const oldFilters = new Map<string, string>();
	const oldBackgrounds = new Map<string, string>();

	/**
	 * Applies the focus overlay by blurring specific elements on the page.
	 */
	const appendBlur = (): void => {
		if (blured) {
			removeBlur();
		}
		blured = true;

		const [r, g, b] = hexToRgb(preferences?.focusOverlayColor || DEFAULT_PREFERENCES.focusOverlayColor);
		const a = preferences?.focusOverlayOpacity || DEFAULT_PREFERENCES.focusOverlayOpacity;

		const intensity = (preferences?.focusOverlayIntensity || DEFAULT_PREFERENCES.focusOverlayIntensity) / 100;

		const selectorsToBlur = ["#below", "#secondary", "#meta-contents", "#secondary-inner", "#masthead"];
		selectorsToBlur.forEach((selector) => {
			const element = document.querySelector<HTMLElement>(selector);
			if (element) {
				oldFilters.set(selector, element.style.filter);
				oldBackgrounds.set(selector, element.style.backgroundColor);

				element.style.filter = `blur(${16 * intensity}px)`;
				element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
			}
		});
	};

	/**
	 * Removes the focus overlay by restoring the original styles of the blurred elements.
	 */
	const removeBlur = (): void => {
		if (!blured) return;
		blured = false;

		oldFilters.forEach((filter, selector) => {
			const element = document.querySelector<HTMLElement>(selector);
			if (element) {
				element.style.filter = filter;
			}
		});
		oldFilters.clear();

		oldBackgrounds.forEach((background, selector) => {
			const element = document.querySelector<HTMLElement>(selector);
			if (element) {
				element.style.backgroundColor = background;
			}
		});
		oldBackgrounds.clear();
	};

	const applyOverlay = async (): Promise<void> => {
		return new Promise<void>((resolve) => {
			chrome.storage.sync.get(["modes", "preferences"], (data: Data) => {
				preferences = data.preferences || DEFAULT_PREFERENCES;
				if (data.modes?.focusMode) {
					appendBlur();
				} else {
					removeBlur();
				}
				resolve();
			});
		});
	};

	await applyOverlay();

	return {
		applyOverlay,
		destroy: removeBlur,
	};
}

import Data from "../../types/data";
import { DEFAULT_PREFERENCES, Preferences } from "../../types/preferences";
import { hexToRgb } from "../../utils/colors";

/**
 * Defines the structure of the visual overlay, which applies an isolated behavivior after a period of inactivity in fullscreen mode.
 */
interface VisualOverlay {
	getOverlay: () => HTMLElement;
	showOverlay: () => void;
	hideOverlay: () => void;
	startTrackingInactivity: () => void;
	stopTrackingInactivity: () => void;
	destroyOverlay: () => void;
}

/**
 * Defines the structure of the sleep overlay feature, which applies a visual overlay after a period of inactivity in fullscreen mode.
 */
export interface SleepOverlay {
	applyOverlay: () => Promise<void>;
	destroy: () => void;
}

/**
 * Creates a sleep overlay that appears after a period of inactivity in fullscreen mode.
 */
export async function createSleepOverlay(): Promise<SleepOverlay> {
	let preferences: Preferences | null = null;
	let inactivityId: number | undefined = undefined;
	let visualOverlay: VisualOverlay | null = null;

	/**
	 * Creates a sleep overlay element with the appropriate styles.
	 * @returns {VisualOverlay} The created sleep overlay element.
	 */
	const createVisualOverlay = (): VisualOverlay => {
		const [r, g, b] = hexToRgb(preferences?.sleepOverlayColor || "#000000");
		const a = preferences?.sleepOverlayOpacity || 0.8;

		const overlay = document.createElement("div");

		overlay.className = "sleep-overlay";
		overlay.style.position = "absolute";
		overlay.style.top = "0";
		overlay.style.left = "0";
		overlay.style.width = "100%";
		overlay.style.height = "100%";
		overlay.style.pointerEvents = "none";
		overlay.style.opacity = "0";
		overlay.style.transition = "opacity 0.5s ease";
		overlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;

		const onFullscreenChange = () => {
			if (document.fullscreenElement) {
				startTrackingInactivity();
			} else {
				stopTrackingInactivity();
			}
		};

		const showOverlay = () => {
			overlay.style.opacity = "1";
		};

		const hideOverlay = () => {
			overlay.style.opacity = "0";
		};

		const resetInactivityTimer = () => {
			hideOverlay();
			clearTimeout(inactivityId);
			inactivityId = setTimeout(showOverlay, (preferences?.sleepOverlayDelay || 5) * 1000);
		};

		const startTrackingInactivity = () => {
			window.addEventListener("mousemove", resetInactivityTimer);
			resetInactivityTimer();
		};

		const stopTrackingInactivity = () => {
			window.removeEventListener("mousemove", resetInactivityTimer);
			clearTimeout(inactivityId);
			hideOverlay();
		};

		const destroyOverlay = () => {
			stopTrackingInactivity();
			document.removeEventListener("fullscreenchange", onFullscreenChange);
			overlay.remove();
			visualOverlay = null;
		};

		document.addEventListener("fullscreenchange", onFullscreenChange);
		if (document.fullscreenElement) {
			startTrackingInactivity();
		}

		return {
			getOverlay: () => overlay,
			showOverlay,
			hideOverlay,
			startTrackingInactivity,
			stopTrackingInactivity,
			destroyOverlay,
		};
	};

	const appendVisualOverlay = (): void => {
		const playerContent = document.querySelector<HTMLElement>('#player-container[role="complementary"]');
		if (!playerContent) return;

		if (visualOverlay) {
			visualOverlay.destroyOverlay();
			visualOverlay = null;
		}

		playerContent.style.position = "absolute";

		visualOverlay = createVisualOverlay();
		playerContent.appendChild(visualOverlay.getOverlay());
	};

	/**
	 * Removes the sleep overlay element.
	 */
	const removeVisualOverlay = (): void => {
		if (visualOverlay) {
			visualOverlay.destroyOverlay();
			visualOverlay = null;
		}
	};

	/**
	 * Applies the sleep overlay based on the current mode settings.
	 * @returns {Promise<void>}
	 */
	const applyOverlay = (): Promise<void> => {
		return new Promise<void>((resolve) => {
			chrome.storage.sync.get(["modes", "preferences"], (data: Data) => {
				preferences = data.preferences || DEFAULT_PREFERENCES;
				if (data.modes?.sleepMode) {
					appendVisualOverlay();
				} else {
					removeVisualOverlay();
				}
				resolve();
			});
		});
	};

	await applyOverlay();

	return {
		applyOverlay,
		destroy: removeVisualOverlay,
	};
}

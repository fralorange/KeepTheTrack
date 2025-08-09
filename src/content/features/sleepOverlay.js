let preferences = {};
let inactivityTimeout;
let currentInstance;

/**
 * Applies the sleep overlay style based on user preferences.
 * @param {HTMLElement} overlay - The overlay element to apply styles to.
 */
function applyOverlayStyle(overlay) {
	const [r, g, b] = hexToRgb(preferences.sleepOverlayColor || "#000000");
	const a = parseFloat(preferences.sleepOverlayOpacity) || 0.8;
	overlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Creates a sleep overlay that appears after a period of inactivity in fullscreen mode.
 * @returns {Object|null} Returns the current sleep overlay instance or null if it doesn't exist.
 */
function createSleepOverlay() {
	if (document.fullscreenElement && currentInstance) {
		return currentInstance;
	}

	if (currentInstance) {
		currentInstance.destroy();
		currentInstance = null;
	}

	const playerContent = document.querySelector(
		'#player-container[role="complementary"]'
	);
	if (!playerContent) return;

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

	applyOverlayStyle(overlay);

	playerContent.style.position = "absolute";
	playerContent.appendChild(overlay);

	const showOverlay = () => {
		overlay.style.opacity = "1";
	};

	const hideOverlay = () => {
		overlay.style.opacity = "0";
	};

	const resetInactivityTimer = () => {
		hideOverlay();
		clearTimeout(inactivityTimeout);
		inactivityTimeout = setTimeout(
			showOverlay,
			(preferences.sleepOverlayDelay || 5) * 1000
		);
	};

	const startTrackingInactivity = () => {
		document.addEventListener("mousemove", resetInactivityTimer);
		resetInactivityTimer();
	};

	const stopTrackingInactivity = () => {
		document.removeEventListener("mousemove", resetInactivityTimer);
		clearTimeout(inactivityTimeout);
		hideOverlay();
	};

	const onFullscreenChange = () => {
		if (document.fullscreenElement) {
			startTrackingInactivity();
		} else {
			stopTrackingInactivity();
		}
	};

	document.addEventListener("fullscreenchange", onFullscreenChange);
	if (document.fullscreenElement) {
		startTrackingInactivity();
	}

	hideOverlay();

	currentInstance = {
		destroy: () => {
			stopTrackingInactivity();
			document.removeEventListener("fullscreenchange", onFullscreenChange);
			overlay.remove();
			currentInstance = null;
		},
	};

	return currentInstance;
}

/**
 * Destroys the current sleep overlay instance if it exists.
 */
function destroySleepOverlay() {
	if (currentInstance) {
		currentInstance.destroy();
		currentInstance = null;
	}
}

/**
 * Applies the sleep overlay based on the current mode settings.
 * @returns {Promise<void>}
 */
async function applySleepOverlay() {
	return new Promise((resolve) => {
		chrome.storage.sync.get(["modes", "preferences"], (data) => {
			preferences = data.preferences || {};
			if (data.modes?.sleep) {
				createSleepOverlay();
			} else {
				destroySleepOverlay();
			}
			resolve();
		});
	});
}

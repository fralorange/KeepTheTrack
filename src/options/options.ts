import "./options.css";
import "../utils/i18n";
import Data from "../types/data";
import { DEFAULT_PREFERENCES, Preferences } from "../types/preferences";
import { getElement } from "../utils/elements";

/**
 * Updates a specific preference in storage.
 * @param key - The key of the preference to update.
 * @param value - The new value for the preference.
 */
function updatePreference<K extends keyof Preferences>(
	key: K,
	value: Preferences[K],
) {
	chrome.storage.sync.get(["preferences"], (data: Data) => {
		const preferences: Preferences = data.preferences || DEFAULT_PREFERENCES;
		preferences[key] = value;
		chrome.storage.sync.set({ preferences });
	});
}

/**
 * Initializes the tab functionality by setting up event listeners
 */
function setupTabs() {
	const tabs = document.querySelectorAll(".tabs-container .tab");
	const contents = document.querySelectorAll(".tabs-container .content");

	const removeActiveClasses = () => {
		tabs.forEach((tab) => {
			tab.classList.remove("active");
		});

		contents.forEach((content) => {
			content.classList.remove("active");
		});
	};

	tabs.forEach((tab, i) => {
		tab.addEventListener("click", () => {
			removeActiveClasses();
			contents[i].classList.add("active");
			tab.classList.add("active");
		});
	});
}

/**
 * Sets up a slider input element with a corresponding value display.
 * @param {*} sliderId - The ID of the slider input element.
 * @param {*} valueId - The ID of the value display element.
 * @param {*} prefKey - The key for the preference to update in Chrome's storage.
 */
function setupSlider(
	sliderId: string,
	valueId: string,
	prefKey: keyof Preferences,
) {
	const slider = document.getElementById(sliderId) as HTMLInputElement;
	const sliderValue = document.getElementById(valueId) as HTMLInputElement;

	chrome.storage.sync.get(["preferences"], (data: Data) => {
		const preferences = data.preferences || {};
		if (preferences[prefKey] !== undefined) {
			slider.value = preferences[prefKey].toString();
			sliderValue.value = preferences[prefKey].toString();
		}
	});

	slider?.addEventListener("input", () => {
		if (sliderValue) {
			sliderValue.value = slider.value;
			updatePreference(prefKey, slider.value);
		}
	});

	sliderValue.addEventListener("input", () => {
		let value = Number(sliderValue.value);
		let min = Number(slider.min);
		let max = Number(slider.max);

		if (value < min) value = min;
		if (value > max) value = max;

		slider.value = value.toString();
		updatePreference(prefKey, value);
	});
}

/**
 * Sets up a color picker input element with a corresponding value display.
 * @param {*} pickerId - The ID of the color picker input element.
 * @param {*} prefKey - The key for the preference to update in Chrome's storage.
 */
function setupColorPicker(pickerId: string, prefKey: keyof Preferences) {
	const colorPicker = document.getElementById(pickerId) as HTMLInputElement;

	chrome.storage.sync.get(["preferences"], (data: Data) => {
		const preferences = data.preferences || {};
		if (preferences[prefKey] && colorPicker) {
			colorPicker.value = preferences[prefKey].toString();
		}
	});

	colorPicker.addEventListener("change", () => {
		updatePreference(prefKey, colorPicker.value);
	});
}

/**
 * Sets up the reset button to restore default preferences.
 */
function setupResetButton() {
	const resetButton = document.getElementsByClassName("reset-button")[0];
	resetButton.addEventListener("click", () => {
		if (!confirm(chrome.i18n.getMessage("extensionResetWarning"))) {
			return;
		}
		chrome.storage.sync.set({ preferences: DEFAULT_PREFERENCES }, () => {
			setupSlider("slider-delay", "slider-delay-value", "sleepOverlayDelay");
			setupSlider(
				"slider-opacity",
				"slider-opacity-value",
				"sleepOverlayOpacity",
			);
			setupColorPicker("color-picker", "sleepOverlayColor");
		});
	});
}

/**
 * Sets up the import and export buttons for preferences.
 */
function setupImportButton() {
	const importButton = document.getElementById("import-button");
	importButton?.addEventListener("click", () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";
		input.style.display = "none";

		input.addEventListener("change", (event) => {
			const files = (event.target as HTMLInputElement).files;
			if (!files || !files[0]) return;
			const file = files[0];

			const reader = new FileReader();
			reader.onload = () => {
				try {
					if (typeof reader.result !== "string") {
						throw new Error("Invalid file content");
					}
					const jsonPreferences = JSON.parse(reader.result) as Preferences;

					chrome.storage.sync.set(
						{ preferences: jsonPreferences },
						updateVisuals,
					);
				} catch (error) {
					alert(chrome.i18n.getMessage("extensionOptionImportError"));
					return;
				}
			};
			reader.onerror = () => {
				alert(chrome.i18n.getMessage("extensionOptionImportError"));
			};
			reader.readAsText(file);
		});

		document.body.appendChild(input);
		input.click();
		document.body.removeChild(input);
	});
}

/*
 * Sets up the export button for preferences.
 */
function setupExportButton() {
	const exportButton = document.getElementById("export-button");
	exportButton?.addEventListener("click", () => {
		chrome.storage.sync.get(["preferences"], (data) => {
			const preferences = data.preferences || DEFAULT_PREFERENCES;
			const json = JSON.stringify(preferences, null, 2);
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = url;
			a.download = "preferences.json";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		});
	});
}

/**
 * Sets up the version text in the footer.
 */
function setupVersionText() {
	const versionText = document.getElementById("version-text");
	const version = chrome.i18n.getMessage("extensionVersion");
	const manifest = chrome.runtime.getManifest();
	if (versionText) {
		versionText.textContent = `${version}: ${manifest.version}`;
	}
}

/**
 * Updates the visual elements based on the current preferences.
 */
function updateVisuals() {
	const sliderDelay = getElement<HTMLInputElement>("slider-delay");
	const sliderDelayValue = getElement<HTMLInputElement>("slider-delay-value");
	const sliderOpacity = getElement<HTMLInputElement>("slider-opacity");
	const sliderOpacityValue = getElement<HTMLInputElement>(
		"slider-opacity-value",
	);
	const colorPicker = getElement<HTMLInputElement>("color-picker");

	chrome.storage.sync.get(["preferences"], (data: Data) => {
		const preferences = data.preferences || DEFAULT_PREFERENCES;
		sliderDelay.value = preferences.sleepOverlayDelay.toString();
		sliderDelayValue.value = preferences.sleepOverlayDelay.toString();
		sliderOpacity.value = preferences.sleepOverlayOpacity.toString();
		sliderOpacityValue.value = preferences.sleepOverlayOpacity.toString();
		colorPicker.value = preferences.sleepOverlayColor;
	});
}

/**
 * Initializes the preferences in Chrome's storage if they do not exist.
 */
function initPreferences() {
	chrome.storage.sync.get(["preferences"], (data) => {
		if (!data.preferences) {
			chrome.storage.sync.set({ preferences: DEFAULT_PREFERENCES });
		}
	});
}

initPreferences();
setupTabs();
setupSlider("slider-delay", "slider-delay-value", "sleepOverlayDelay");
setupSlider("slider-opacity", "slider-opacity-value", "sleepOverlayOpacity");
setupColorPicker("color-picker", "sleepOverlayColor");
setupResetButton();
setupImportButton();
setupExportButton();
setupVersionText();

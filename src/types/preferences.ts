/**
 * Defines the structure of user preferences for the KeepTheTrack extension.
 */
export interface Preferences {
	// Sleep overlay settings
	sleepOverlayColor: string;
	sleepOverlayOpacity: number;
	sleepOverlayDelay: number;
	// Cinema overlay settings
	cinemaOverlayOpacity: number;
	// Focus overlay settings
	focusOverlayIntensity: number;
	focusOverlayOpacity: number;
	focusOverlayColor: string;
}

/**
 * Defines the default preferences for the KeepTheTrack extension.
 */
export const DEFAULT_PREFERENCES: Preferences = {
	sleepOverlayDelay: 5,
	sleepOverlayOpacity: 0.8,
	sleepOverlayColor: "#000000",

	cinemaOverlayOpacity: 0.8,

	focusOverlayIntensity: 100,
	focusOverlayOpacity: 0,
	focusOverlayColor: "#000000",
};

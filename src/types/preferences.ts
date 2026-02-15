/**
 * Defines the structure of user preferences for the KeepTheTrack extension.
 */
export interface Preferences {
	sleepOverlayColor: string;
	sleepOverlayOpacity: number;
	sleepOverlayDelay: number;
}

/**
 * Defines the default preferences for the KeepTheTrack extension.
 */
export const DEFAULT_PREFERENCES: Preferences = {
	sleepOverlayDelay: 5,
	sleepOverlayOpacity: 0.8,
	sleepOverlayColor: "#000000",
};

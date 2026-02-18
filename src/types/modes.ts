/**
 * Defines the structure of modes for the KeepTheTrack extension.
 */
export default interface Modes {
	sleepMode: boolean;
}

/**
 * Defines the default mode settings for the KeepTheTrack extension.
 */
export const DEFAULT_MODES: Modes = {
	sleepMode: false,
};

/**
 * Defines the structure of filter settings for the KeepTheTrack extension.
 */
export default interface Filters {
	byAuthor: boolean;
	byName: {
		enabled: boolean;
		value: string;
	};
	shuffle: boolean;
}

/**
 * Defines the default filter settings for the KeepTheTrack extension.
 */
export const DEFAULT_FILTERS: Filters = {
	byAuthor: false,
	byName: { enabled: false, value: "" },
	shuffle: false,
};

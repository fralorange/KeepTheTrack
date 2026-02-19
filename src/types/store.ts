/**
 * Defines the structure of the state used in the extension.
 */
interface State {
	nextVideo: HTMLElement | null;
}

/**
 * Defines the structure of the store used to manage the state of the extension.
 */
export interface Store {
	/**
	 * Gets the next video element from the state.
	 * @returns {HTMLElement | null} The next video element or null if not set.
	 */
	getNextVideo: () => HTMLElement | null;
	/**
	 * Sets the next video element in the state.
	 * @param video The next video element to be set in the state, or null to clear it.
	 * @returns {void}
	 */
	setNextVideo: (video: HTMLElement | null) => void;
}

/**
 * Creates a store to manage the state of the extension, specifically the next video information.
 * @returns {Store} The created store with methods to get and set the next video information.
 */
export function createStore(): Store {
	let state: State = {
		nextVideo: null,
	};

	return {
		getNextVideo: () => state.nextVideo,
		setNextVideo: (video: HTMLElement | null) => {
			state.nextVideo = video;
		},
	};
}

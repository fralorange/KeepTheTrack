/**
 * Defines the structure of messages that can be sent between different parts of the KeepTheTrack extension.
 */
export type Message =
	| { action: "requestTabUpdate" }
	| { action: "requestNextVideo" }
	| { action: "updateNextVideo"; nextVideoHTML: string | null };

/**
 * Defines the structure of the response message for updating the next video information.
 */
export type ResponseMessage = {
	nextVideoHTML: string | null;
};

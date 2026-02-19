import Filters from "./filters";
import Modes from "./modes";
import { Preferences } from "./preferences";

/**
 * Defines the structure of the data object used in the KeepTheTrack extension.
 */
export default interface Data {
	preferences: Preferences;
	modes: Modes;
	filters: Filters;
}

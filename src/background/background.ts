import { Message } from "../types/messages";

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
	if (details.url.startsWith("https://www.youtube.com/")) {
		const message: Message = { action: "requestTabUpdate" };

		chrome.tabs.sendMessage(details.tabId, message);
	}
});

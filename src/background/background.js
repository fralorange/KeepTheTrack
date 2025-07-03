chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url.startsWith('https://www.youtube.com/')) {
        chrome.tabs.sendMessage(details.tabId, { action: 'requestTabUpdate' });
    }
});

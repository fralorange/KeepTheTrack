chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    if (changeInfo.status === 'complete') {
        chrome.tabs.get(tabId, (tab) => {
            if (!tab || !tab.url) return;
            if (tab.url.startsWith('https://www.youtube.com/')) {
                chrome.tabs.sendMessage(tabId, { action: 'requestTabUpdate' });
            }
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
        chrome.tabs.sendMessage(tabId, {
            type: 'NEW',
        });
    }
})
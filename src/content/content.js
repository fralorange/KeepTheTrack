(() => {
    let nextVideo
    let youtubeContents = [];
    let currentAuthor = ''

    // Observers

    let playlistObserver = null;
    let recommendationsObserver = null;

    // Functions

    const onYouTubeEnded = (e) => {
        if (nextVideo) {
            nextVideo.click();
        }
    }

    const updateNextVideo = (value) => {
        nextVideo = value;
        chrome.runtime.sendMessage({ action: "nextVideoUpdated", nextVideoHTML: nextVideo?.outerHTML });
    }

    const applyFilters = async () => {
        return new Promise((resolve) => {
            const playlistPanel = document.querySelector('.ytd-watch-flexy ytd-playlist-panel-renderer');
            // If playlist is active then no need for filters.
            if (playlistPanel && !playlistPanel.hasAttribute('hidden')) {
                updateNextVideo(null);
                return resolve();
            }
            
            chrome.storage.sync.get('filters', (data) => {
                const filters = data.filters || {
                    byAuthor: false,
                    byName: { enabled: false, value: '' }
                };
                
                let filteredContents = filters.byAuthor || filters.byName.enabled ? youtubeContents.slice() : [];

                if (filters.byAuthor) {
                    filteredContents = filteredContents.filter(item => item.author === currentAuthor)
                }

                if (filters.byName.enabled && filters.byName.value.trim().toLowerCase() !== '') {
                    const pattern = filters.byName.value.trim().toLowerCase();
                    filteredContents = filteredContents.filter(item => {
                        return item.title && item.title.toLowerCase().includes(pattern);
                    });
                }

                updateNextVideo(filteredContents.length > 0 ? filteredContents[0].urlEl : null);
                resolve();
            });
        })
    }

    const applySleepMode = async () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get('modes', (data) => {
                if (data.modes.sleep) {
                    initSleepOverlay();
                } else {
                    destroySleepOverlay();
                }
                resolve();
            })
        })
    }

    const newVideoLoaded = async () => {
        let youtubePlayer = document.getElementsByClassName('video-stream')[0];
        currentAuthor = (await waitForElement('#upload-info a')).innerText;

        const cards = await waitForElements('ytd-compact-video-renderer');

        youtubeContents = Array.from(cards).map(card => {
            const titleEl = card.querySelector('#video-title');
            const title = titleEl ? titleEl.textContent.trim() : null;

            const urlEl = card.querySelector('a#thumbnail[href^="/watch"]')
                || card.querySelector('a.yt-simple-endpoint[href^="/watch"]');

            const authorEl = card.querySelector('ytd-channel-name yt-formatted-string');
            const author = authorEl ? authorEl.textContent.trim() : null;

            return { title, author, urlEl }
        });

        await applyFilters();
        await applySleepMode();

        youtubePlayer.removeEventListener('ended', onYouTubeEnded);
        youtubePlayer.addEventListener('ended', onYouTubeEnded);
    };

    const init = async () => {
        newVideoLoaded();
        playlistObserver = startPlaylistObserver(async () => {
            await applyFilters();
        });
        recommendationsObserver = await startRecommendationsObserver(newVideoLoaded);
    }

    // Browser listeners

    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'sync' && changes.filters) {
            await applyFilters();
        } else if (area === 'sync' && changes.modes) {
            await applySleepMode();
        }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'requestNextVideo') {
            sendResponse({ data: nextVideo?.outerHTML });
        } else if (message.action === 'requestTabUpdate') {
            newVideoLoaded();
        }
    });

    // Document listeners

    document.addEventListener('yt-navigate-finish', () => {
        init();
    });
})();
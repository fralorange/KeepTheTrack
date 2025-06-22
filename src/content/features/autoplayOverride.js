let nextVideo
let youtubeContents = [];
let currentAuthor = ''

/**
 * Applies the override filters to the video list and updates the next video element.
 * @returns {Promise<void>}
 */
async function applyOverrideFilters() {
    const updateNextVideo = (value) => {
        nextVideo = value;
        chrome.runtime.sendMessage({ action: "nextVideoUpdated", nextVideoHTML: nextVideo?.outerHTML });
    }

    return new Promise((resolve) => {
        const playlistPanel = document.querySelector('.ytd-watch-flexy ytd-playlist-panel-renderer');

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

/**
 * Initializes the autoplay override by fetching video cards and setting up event listeners.
 * @returns {Promise<void>}
 */
async function initAutoplayOverride() {
    const youtubePlayer = document.getElementsByClassName('video-stream')[0];
    const cards = await waitForElements('ytd-compact-video-renderer');

    currentAuthor = (await waitForElement('#upload-info a')).innerText;
    youtubeContents = Array.from(cards).map(card => {
        const titleEl = card.querySelector('#video-title');
        const title = titleEl ? titleEl.textContent.trim() : null;

        const urlEl = card.querySelector('a#thumbnail[href^="/watch"]')
            || card.querySelector('a.yt-simple-endpoint[href^="/watch"]');

        const authorEl = card.querySelector('ytd-channel-name yt-formatted-string');
        const author = authorEl ? authorEl.textContent.trim() : null;

        return { title, author, urlEl }
    });

    const onYouTubeEnded = (e) => {
        if (nextVideo) {
            nextVideo.click();
        }
    }

    if (youtubePlayer) {
        youtubePlayer.removeEventListener('ended', onYouTubeEnded);
        youtubePlayer.addEventListener('ended', onYouTubeEnded);
    }

    await applyOverrideFilters();
}
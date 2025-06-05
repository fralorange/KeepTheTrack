(() => {
    let nextVideo
    let youtubeContents = [];
    let currentAuthor = ""

    const applyFilters = async () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get('filters', (data) => {
                const filters = data.filters || {
                    byAuthor: false,
                    byName: { enabled: false, value: "" }
                };
                
                let filteredContents = filters.byAuthor || filters.byName.enabled ? youtubeContents.slice() : [];

                if (filters.byAuthor) {
                    filteredContents = filteredContents.filter(item => item.author === currentAuthor)
                }

                if (filters.byName.enabled && filters.byName.value.trim().toLowerCase() !== "") {
                    const pattern = filters.byName.value.trim().toLowerCase();
                    filteredContents = filteredContents.filter(item => {
                        return item.title && item.title.toLowerCase().includes(pattern);
                    });
                }

                nextVideo = filteredContents.length > 0 ? filteredContents[0].url : null;
                resolve();
            });
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
            const rawHref = urlEl ? urlEl.getAttribute('href').trim() : null;
            const url = rawHref ? `https://www.youtube.com${rawHref}` : null;

            const authorEl = card.querySelector('ytd-channel-name yt-formatted-string');
            const author = authorEl ? authorEl.textContent.trim() : null;

            return { title, author, url }
        });

        await applyFilters();

        youtubePlayer.addEventListener('ended', (e) => {
            if (!youtubePlayer.hasAttribute('loop') && nextVideo) {
                window.location.href = nextVideo;
            }
        });
    };

    chrome.runtime.onMessage.addListener(({ type }, _sender, _response) => {
        if (type === 'NEW') {
            newVideoLoaded();
        }
    });

    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area == 'sync' && changes.filters) {
            await applyFilters();
        }
    });
})();
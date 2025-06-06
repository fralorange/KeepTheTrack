let debounceTimeout;

function startPlaylistObserver(onPlaylistVisible) {
    let playlistObserver = new MutationObserver(mutations => {
        for (let mut of mutations) {
            if (
                mut.type === 'attributes' &&
                mut.target.nodeType === Node.ELEMENT_NODE &&
                mut.target.tagName.toLowerCase() === 'ytd-playlist-panel-renderer'
            ) {
                onPlaylistVisible();
            }
        }
    });

    const flexy = document.querySelector('ytd-watch-flexy');
    if (!flexy) return null;

    playlistObserver.observe(flexy, {
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden']
    });
}

function debouncedRecommendationChanged(onRecommendationsChanged) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        onRecommendationsChanged();
    }, 200);
}

async function startRecommendationsObserver(onRecommendationsChanged) {
    let recommendationsObserver = new MutationObserver(mutations => {
        let changed = false;
        for (let mut of mutations) {
            if (mut.addedNodes.length || mut.removedNodes.length) {
                mut.addedNodes.forEach(node => {
                    if (
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node.tagName.toLowerCase() === 'ytd-compact-video-renderer' ||
                         node.querySelector('ytd-compact-video-renderer'))
                    ) {
                        changed = true;
                    }
                });
                mut.removedNodes.forEach(node => {
                    if (
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node.tagName.toLowerCase === 'ytd-compact-video-renderer' ||
                         node.querySelector('ytd-compact-video-renderer'))
                    ) {
                        changed = true;
                    }
                });
            }
        }

        if (changed) {
            debouncedRecommendationChanged(onRecommendationsChanged);
        }
    });

    const parent = 'ytd-item-section-renderer.style-scope.ytd-watch-next-secondary-results-renderer';
    const child = 'div#contents.style-scope.ytd-item-section-renderer'
    const container = await waitForElement(`${parent} ${child}`);
    if (!container) return null;

    recommendationsObserver.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
    });
    return recommendationsObserver;
}
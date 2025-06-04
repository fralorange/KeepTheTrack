(() => {
    let youtubePlayer;

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value } = obj;

        if (type === "NEW") {
            newVideoLoaded();
        }
    });

    const newVideoLoaded = async () => {
        youtubePlayer = document.getElementsByClassName("video-stream")[0];
    }

    newVideoLoaded();
})();
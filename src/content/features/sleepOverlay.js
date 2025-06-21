let inactivityTimeout;
const inactivityDelay = 5000;

let currentInstance = null;

function initSleepOverlay() {
    if (document.fullscreenElement && currentInstance) {
        return currentInstance;
    }

    if (currentInstance) {
        currentInstance.destroy();
        currentInstance = null;
    }

    const playerContent = document.querySelector('#player-container[role="complementary"]');
    if (!playerContent) return;

    const overlay = document.createElement('div');
    overlay.className = 'sleep-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease'; 

    playerContent.style.position = 'absolute';
    playerContent.appendChild(overlay);

    const showOverlay = () => {
        overlay.style.opacity = '1';
    };

    const hideOverlay = () => {
        overlay.style.opacity = '0';
    };

    const resetInactivityTimer = () => {
        hideOverlay();
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(showOverlay, inactivityDelay);
    };

    const startTrackingInactivity = () => {
        document.addEventListener('mousemove', resetInactivityTimer);
        resetInactivityTimer();
    };

    const stopTrackingInactivity = () => {
        document.removeEventListener('mousemove', resetInactivityTimer);
        clearTimeout(inactivityTimeout);
        hideOverlay();
    };

    const onFullscreenChange = () => {
        if (document.fullscreenElement) {
            startTrackingInactivity();
        } else {
            stopTrackingInactivity();
        }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    if (document.fullscreenElement) {
        startTrackingInactivity();
    }

    hideOverlay();

    currentInstance = {
            destroy: () => {
                stopTrackingInactivity();
                document.removeEventListener('fullscreenchange', onFullscreenChange);
                overlay.remove();
                currentInstance = null;
            }
        };

    return currentInstance;
}

function destroySleepOverlay() {
    if (currentInstance) {
        currentInstance.destroy();
        currentInstance = null;
    }
}
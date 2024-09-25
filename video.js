const video = document.getElementById('backgroundVideo');

function requestAudioPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            video.muted = false; 
            video.play().catch(error => {
                console.error('Error playing video:', error);
            });
        } else {
            alert('يرجى السماح بالإشعارات لتشغيل الصوت.');
        }
    });
}

document.getElementById('unmuteButton')?.addEventListener('click', requestAudioPermission);

// Initialize application on load
window.onload = function() {
    document.getElementById('loadingMessage')?.style.display = 'block';
    getLocation();
    video.play().catch(error => {
        console.error('Error playing video:', error);
    });
    requestAudioPermission();
};

// Reset data on button click
document.getElementById('resetButton')?.addEventListener('click', resetSelections);

// Reset selections
function resetSelections() {
    document.getElementById('regionSelect').selectedIndex = 0;
    document.getElementById('startLocation').selectedIndex = 0;
    document.getElementById('endLocation').selectedIndex = 0;
    clearMarkers();
    resetSelectedDistance();
}

// Check mobile compatibility
function checkMobileCompatibility() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('تطبيق متوافق مع الأجهزة المحمولة');
    }
}

checkMobileCompatibility();

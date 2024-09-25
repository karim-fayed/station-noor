const video = document.getElementById('backgroundVideo');

function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            requestAudioPermission(); // إذا تم منح الإذن، اطلب إذن الصوت
        } else {
            alert('يرجى السماح بالإشعارات لتفعيل الميزات.');
        }
    });
}

function requestAudioPermission() {
    video.muted = true; // كتم الصوت افتراضيًا
    video.play().catch(error => {
        console.error('Error playing video:', error);
    });

    document.getElementById('unmuteButton')?.addEventListener('click', () => {
        video.muted = false; // إلغاء كتم الصوت
        video.play().catch(error => {
            console.error('Error playing video:', error);
        });
    });
}

// Initialize application on load
window.onload = function() {
    document.getElementById('loadingMessage')?.style.display = 'block';
    getLocation(); // تأكد من وجود دالة getLocation
    requestNotificationPermission(); // بدء طلب الإذن للإشعارات
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

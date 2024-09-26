const video = document.getElementById('backgroundVideo');

// طلب إذن الإشعارات
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            // إذا تم منح الإذن، قم بتشغيل الفيديو والصوت
            requestAudioPermission();
        } else {
            alert('يرجى السماح بالإشعارات لتفعيل الميزات.');
        }
    });
}

// طلب إذن الصوت والتحكم في كتم الفيديو
function requestAudioPermission() {
    video.muted = false; // إلغاء كتم الصوت
    video.play().catch(error => {
        console.error('Error playing video:', error);
    });
}

// طلب الموقع الجغرافي من المستخدم
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('الموقع:', position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.error('لم يتم السماح بالوصول إلى الموقع:', error.message);
                alert('يرجى السماح بالوصول إلى الموقع لتفعيل الميزات.');
            }
        );
    } else {
        alert('الجهاز الخاص بك لا يدعم الموقع الجغرافي.');
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.style.display = 'block'; // إظهار رسالة التحميل
    } else {
        console.error('Element with ID loadingMessage not found.');
    }

    // طلب الأذونات عند تحميل الصفحة
    getLocation(); // طلب الموقع الجغرافي
    requestNotificationPermission(); // بدء طلب الإذن للإشعارات

    // إضافة حدث لتفاعل المستخدم
    document.body.addEventListener('click', () => {
        requestAudioPermission(); // تشغيل الفيديو عند النقر
    });
});

// التحكم في الفيديو وعناصر الصوت
const video = document.getElementById('backgroundVideo');

// طلب إذن الإشعارات
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            requestAudioPermission(); // إذا تم منح الإذن، اطلب إذن الصوت
        } else {
            alert('يرجى السماح بالإشعارات لتفعيل الميزات.');
        }
    });
}

// طلب إذن الصوت والتحكم في كتم الفيديو
function requestAudioPermission() {
    video.muted = true; // كتم الصوت افتراضيًا
    video.play().catch(error => {
        console.error('Error playing video:', error);
    });

    // إلغاء كتم الصوت تلقائيًا إذا كان المستخدم قد منح الإذن
    if (video.muted === false) {
        video.play().catch(error => {
            console.error('Error playing video:', error);
        });
    }
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
window.onload = function() {
    document.getElementById('loadingMessage').style.display = 'block';

    // طلب الأذونات عند تحميل الصفحة
    getLocation(); // طلب الموقع الجغرافي
    requestNotificationPermission(); // بدء طلب الإذن للإشعارات
};

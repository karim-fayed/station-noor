// التحكم في الفيديو وعناصر الصوت
const video = document.getElementById('backgroundVideo');

// طلب إذن الإشعارات
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            // إذا تم منح الإذن، قم بتشغيل الفيديو والصوت
            requestAudioPermission();
        } else {
            alert('يرجى السماح بالإشعارات لتفعيل الميزات.');
            hideLoadingMessage(); // إخفاء رسالة التحميل حتى إذا لم يُسمح بالإشعارات
        }
    });
}

// طلب إذن الصوت والتحكم في كتم الفيديو
function requestAudioPermission() {
    video.muted = false; // إلغاء كتم الصوت
    video.play().catch(error => {
        console.error('Error playing video:', error);
    }).finally(hideLoadingMessage); // إخفاء رسالة التحميل بعد محاولة التشغيل
}

// طلب الموقع الجغرافي من المستخدم
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('الموقع:', position.coords.latitude, position.coords.longitude);
                hideLoadingMessage(); // إخفاء رسالة التحميل عند الحصول على الموقع
            },
            error => {
                console.error('لم يتم السماح بالوصول إلى الموقع:', error.message);
                alert('يرجى السماح بالوصول إلى الموقع لتفعيل الميزات.');
                hideLoadingMessage(); // إخفاء رسالة التحميل في حالة الخطأ
            }
        );
    } else {
        alert('الجهاز الخاص بك لا يدعم الموقع الجغرافي.');
        hideLoadingMessage(); // إخفاء رسالة التحميل إذا كان الجهز لا يدعم الموقع
    }
}

// إخفاء رسالة التحميل
function hideLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.style.display = 'block'; // عرض رسالة التحميل
    } else {
        console.error('Element with ID loadingMessage not found.');
    }

    // طلب الأذونات عند تحميل الصفحة
    getLocation(); // طلب الموقع الجغرافي
    requestNotificationPermission(); // بدء طلب الإذن للإشعارات
});

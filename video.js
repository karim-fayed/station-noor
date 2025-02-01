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
        if (loadingMessage) {
            loadingMessage.style.display = 'none'; // إخفاء رسالة التحميل بعد النقر
        }
    });
});

// الحصول على الأزرار وعناصر النماذج
const loginButton = document.getElementById("loginButton");
const signupButton = document.getElementById("signupButton");
const loginFormContainer = document.getElementById("loginFormContainer");
const signupFormContainer = document.getElementById("signupFormContainer");

// عند النقر على زر تسجيل الدخول
if (loginButton && loginFormContainer && signupFormContainer) {
    loginButton.addEventListener("click", function () {
        loginFormContainer.style.display = "block";
        signupFormContainer.style.display = "none";
    });
}

// عند النقر على زر تسجيل جديد
if (signupButton && loginFormContainer && signupFormContainer) {
    signupButton.addEventListener("click", function () {
        loginFormContainer.style.display = "none";
        signupFormContainer.style.display = "block";
    });
}

// إرسال نموذج تسجيل الدخول
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        })
            .then((response) => response.text())
            .then((message) => alert(message))
            .catch((err) => alert(err.message));
    });
}


// إرسال نموذج تسجيل جديد
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const username = document.getElementById("signupUsername").value;
        const password = document.getElementById("signupPassword").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;

        fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ firstName, lastName, username, password, email, phone })
        })
            .then((response) => response.text())
            .then((message) => alert(message))
            .catch((err) => alert(err.message));
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebarBefore = document.querySelector('.sidebar.active::before');
    // إظهار/إخفاء القائمة عند النقر على الزر
    if (toggleButton) {
        toggleButton.addEventListener('click', function(event) {
            event.stopPropagation(); // منع انتشار الحدث إلى document
            sidebar.classList.toggle('active');
        });
    }



    // فتح القائمة عند النقر على الجزء الظاهر (::before)

    if (sidebarBefore) {
        sidebarBefore.addEventListener('click', function(event) {
            event.stopPropagation(); // منع انتشار الحدث إلى document
            sidebar.classList.add('active');
        });
    }
});
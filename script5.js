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

    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(event) {
        if (sidebar.classList.contains('active') && !sidebar.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });

    // فتح القائمة عند النقر على الجزء الظاهر (::before)
    if (sidebarBefore) {
        sidebarBefore.addEventListener('click', function(event) {
            event.stopPropagation(); // منع انتشار الحدث إلى document
            sidebar.classList.add('active');
        });
    }
});

// تنفيذ التمرير السلس للروابط الداخلية
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// إدارة إرسال النموذج
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // التحقق من الحقول الفارغة
    if (!name || !email || !phone || !message) {
        alert('يرجى ملء جميع الحقول المطلوبة.');
        return;
    }

    // تعطيل زر الإرسال وإظهار مؤشر تحميل
    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.textContent = 'جاري الإرسال...';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const data = {
                name: name,
                email: email,
                phone: phone,
                message: message,
                latitude: latitude,
                longitude: longitude
            };

            fetch('https://script.google.com/macros/s/AKfycby8eKmLbnexY1pr-aIiasmgvECcnEMWgc7oOlJry0VKs9GCFXgQGTKxWfDs2ZUmRXWwuQ/exec', {
                method: 'POST',
                body: JSON.stringify(data), // استخدام البيانات التي تم جمعها
                headers: {
                  'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                alert('تم إرسال البيانات بنجاح!');
                
                // تفريغ حقول النموذج
                document.getElementById('contactForm').reset();
                
                // إعادة توجيه المستخدم إلى الصفحة السابقة
                history.back();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى لاحقًا.');
            })
            .finally(() => {
                // إعادة تمكين زر الإرسال
                submitButton.disabled = false;
                submitButton.textContent = 'إرسال';
            });
        }, function(error) {
            // في حالة فشل الحصول على الموقع الجغرافي
            console.error('Geolocation Error:', error);
            alert('تعذر الحصول على الموقع الجغرافي. يرجى التأكد من تفعيل خدمات الموقع.');
            submitButton.disabled = false;
            submitButton.textContent = 'إرسال';
        });
    } else {
        alert('Geolocation is not supported by this browser.');
        submitButton.disabled = false;
        submitButton.textContent = 'إرسال';
    }
});
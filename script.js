// النصوص باللغتين
const translations = {
    ar: {
        pageTitle: "محطات نور خوي",
        selectRegion: "اختر منطقة",
        selectFuel: "اختر نوع الوقود",
        currentLocation: "موقعي الحالي",
        resetButton: "إعادة تعيين",
        regionsTableTitle: "المناطق والمواقع",
        calculateDistanceTitle: "حساب المسافة بين موقعين",
        tableHeaders: {
            region: "المنطقة",
            location: "الموقع",
            avgDistance: "المسافة المتوسطة (كم)",
            map: "الخريطة",
            startLocation: "الموقع الأول",
            endLocation: "الموقع الثاني",
            distance: "المسافة (كم)"
        }
    },
    en: {
        pageTitle: "Noor Khoy Stations",
        selectRegion: "Select Region",
        selectFuel: "Select Fuel Type",
        currentLocation: "My Current Location",
        resetButton: "Reset",
        regionsTableTitle: "Regions and Locations",
        calculateDistanceTitle: "Calculate Distance Between Two Locations",
        tableHeaders: {
            region: "Region",
            location: "Location",
            avgDistance: "Average Distance (km)",
            map: "Map",
            startLocation: "Start Location",
            endLocation: "End Location",
            distance: "Distance (km)"
        }
    }
};

// اللغة الافتراضية
let currentLanguage = localStorage.getItem('language') || 'ar';

// تبديل اللغة
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    localStorage.setItem('language', currentLanguage);
    updateTexts();
}

// تحديث النصوص
function updateTexts() {
    console.log("Updating texts for language:", currentLanguage); // تحقق من اللغة الحالية
    updateElementText('pageTitle', translations[currentLanguage].pageTitle);
    updateElementText('loadingMessage', translations[currentLanguage].loadingMessage);

    updateSelectPlaceholder('regionSelect', translations[currentLanguage].selectRegion);
    updateSelectPlaceholder('fuelTypeSelect', translations[currentLanguage].selectFuel);
    updateSelectPlaceholder('startLocation', translations[currentLanguage].currentLocation);
    updateSelectPlaceholder('endLocation', translations[currentLanguage].currentLocation);

    updateElementText('resetButton', translations[currentLanguage].resetButton);

    updateElementText('.table-container h4:first-child', translations[currentLanguage].regionsTableTitle, true);
    updateElementText('.table-container h4:last-child', translations[currentLanguage].calculateDistanceTitle, true);

    updateTableHeaders('thead tr:first-child th', translations[currentLanguage].tableHeaders, ['region', 'location', 'avgDistance', 'map']);
    updateTableHeaders('thead tr:last-child th', translations[currentLanguage].tableHeaders, ['startLocation', 'endLocation', 'distance']);
}
// تحديث النصوص لعناصر فردية
function updateElementText(selector, text, isQuerySelector = false) {
    const element = isQuerySelector ? document.querySelector(selector) : document.getElementById(selector);
    if (element) {
        console.log(`Updating element ${selector} with text: ${text}`); // تحقق من النص الذي يتم تحديثه
        element.textContent = text;
    } else {
        console.error(`العنصر '${selector}' غير موجود.`);
    }
}
// تحديث العناصر الافتراضية للقوائم المنسدلة
function updateSelectPlaceholder(selectId, placeholder) {
    const selectElement = document.getElementById(selectId);
    if (selectElement && selectElement.options.length > 0) {
        console.log(`Updating select ${selectId} with placeholder: ${placeholder}`); // تحقق من النص الذي يتم تحديثه
        selectElement.options[0].text = placeholder;
    } else {
        console.error(`القائمة المنسدلة '${selectId}' غير موجودة أو لا تحتوي على خيارات.`);
    }
}

// تحديث رؤوس الجداول
function updateTableHeaders(selector, headers, keys) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        elements.forEach((element, index) => {
            if (keys[index] && headers[keys[index]]) {
                console.log(`Updating table header ${keys[index]} with text: ${headers[keys[index]]}`); // تحقق من النص الذي يتم تحديثه
                element.textContent = headers[keys[index]];
            }
        });
    } else {
        console.error(`رؤوس الجداول '${selector}' غير موجودة.`);
    }
}

// تطبيق النصوص عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateTexts();
    initMap(); // تأكد من تشغيل الخريطة فقط بعد تحميل DOM
});

// تهيئة الخريطة
function initMap() {
    try {
        const map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 24.7136, lng: 46.6753 },
            zoom: 11
        });
        console.log("Google Maps initialized successfully.");
    } catch (error) {
        console.error("Error initializing Google Maps:", error);
    }
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// تحديث النصوص عند تغيير اللغة
document.getElementById('languageSelect').addEventListener('change', function () {
    currentLanguage = this.value;
    localStorage.setItem('language', currentLanguage);
    updateTexts();
});


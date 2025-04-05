//script.js

// النصوص باللغتين
const translations = {
    ar: {
        pageTitle: "محطات نور خوي",
        selectRegion: "اختر منطقة",
        selectFuel: "اختر نوع الوقود",
        currentLocation: "موقعي الحالي",
        resetButton: "إعادة تعيين",
        nearestStationButton:"عرض أقرب محطة",
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
        nearestStationButton:"Show the nearest station",
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

// إدارة حالة اللغة
let currentLanguage = localStorage.getItem('language') || 'ar';
// تهيئة أولية
function initLanguage() {
    // تأكيد استخدام العربية كافتراضية
    currentLanguage = localStorage.getItem('language') || 'ar';
    document.getElementById('languageToggle').addEventListener('click', toggleLanguage);
    updatePageDirection();
    updateTexts();
}
// تبديل اللغة
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    localStorage.setItem('language', currentLanguage);
    updateTexts();
    updatePageDirection();
}
// تحديث اتجاه الصفحة
function updatePageDirection() {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
}
// تحديث النصوص
function updateTexts() {
    console.log("Updating texts for language:", currentLanguage); // تحقق من اللغة الحالية
    // تحديث عنوان الصفحة
    updateElementText('pageTitle', translations[currentLanguage].pageTitle);    updateElementText('.table-container:nth-child(1) h4', translations[currentLanguage].regionsTableTitle, true);
    // تحديث عناوين الجداول
    updateElementText('regionsTableTitle', translations[currentLanguage].regionsTableTitle);
    updateElementText('distanceTableTitle', translations[currentLanguage].calculateDistanceTitle);
    updateElementText('.table-container:nth-child(2) h4', translations[currentLanguage].calculateDistanceTitle, true);
    // تحديث القوائم المنسدلة
    updateSelectPlaceholder('regionSelect', translations[currentLanguage].selectRegion);
    updateSelectPlaceholder('startLocation', translations[currentLanguage].currentLocation);
    updateSelectPlaceholder('endLocation', translations[currentLanguage].currentLocation);

    // تحديث الأزرار
    updateElementText('resetButton', translations[currentLanguage].resetButton);
    updateElementText('nearestStationButton', translations[currentLanguage].nearestStationButton);

    // تحديث رؤوس الجداول
    updateTableHeaders('.regions-table thead th', translations[currentLanguage].tableHeaders, ['region', 'location', 'avgDistance', 'map']);
    updateTableHeaders('.distance-table thead th', translations[currentLanguage].tableHeaders, ['startLocation', 'endLocation', 'distance']);
}
// تحديث النصوص لعناصر فردية
function updateElementText(selector, text, isQuerySelector = false) {
    try {
        const element = isQuerySelector ? 
            document.querySelector(selector) : 
            document.getElementById(selector);
        
        if (!element) throw new Error('Element not found');
        
        element.textContent = text;
    } catch (error) {
        console.warn(`Failed to update ${selector}:`, error.message);
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
                if (element) {
                    element.textContent = headers[keys[index]];
                }
            }
        });
    } else {
        console.error(`رؤوس الجداول '${selector}' غير موجودة.`);
    }
}

// تطبيق النصوص عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initMap();
});


// map.js

let markers = {};
let visibleMarkers = new Set();
let locations = {};
const pinUrls = {
  blue: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  red: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  green: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
};
let activeMarker = null;
let activeInfoWindow = null;
let map, directionsService, directionsRenderer;
let cityCenters = {};
// ------ نظام التخزين المؤقت ------
const dataCache = {
  regions: null,
  lastUpdated: null,
  
  async getRegionsData() {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق
    
    if (!this.regions || Date.now() - this.lastUpdated > CACHE_DURATION) {
      this.regions = await loadRegionsData();
      this.lastUpdated = Date.now();
    }
    return this.regions;
  }
};

const regionsData = {};
const cities = [];
let currentRoute = null;
let pollingInterval;

/* ---------------------------------------------
   وظائف عرض وإخفاء التحميل والتنبيهات
--------------------------------------------- */
function showLoading(message = 'جاري التحميل...') {
    const loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage) {
      loadingMessage.innerHTML = `
        <div class="loading-spinner"></div>
        <div>${message}</div>
      `;
      loadingMessage.style.display = "flex";
      loadingMessage.style.flexDirection = "column";
      loadingMessage.style.alignItems = "center";
    }
  }
  
  function hideLoading() {
    const loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage) {
      loadingMessage.style.display = "none";
      loadingMessage.innerHTML = '';
    }
  }
/**
 * دالة لجلب موقع المستخدم مع استخدام التخزين المؤقت (cache) لفترة محددة (مثلاً 60 ثانية)
 */
function getUserLocation(geoOptions, onSuccess, onError) {
    const now = Date.now();
    // إذا تم جلب الموقع خلال 60 ثانية، استخدم الموقع المخزن
    if (cachedUserLocation && (now - lastLocationFetchTime < 60000)) {
      onSuccess(cachedUserLocation);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          cachedUserLocation = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
          lastLocationFetchTime = Date.now();
          onSuccess(cachedUserLocation);
        },
        onError,
        geoOptions
      );
    }
  }
/* ---------------------------------------------
   وظائف عرض وإخفاء التحميل والتنبيهات
--------------------------------------------- */
function showLoading() {
    const loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage) {
      loadingMessage.innerHTML = `
        <div class="loading-spinner"></div>
        <div></div>
      `;
      loadingMessage.style.display = "flex";
      loadingMessage.style.flexDirection = "column";
      loadingMessage.style.alignItems = "center";
    }
  }
  
  function hideLoading() {
    const loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage) {
      loadingMessage.style.display = "none";
      loadingMessage.innerHTML = ''; // تنظيف المحتوى
    }
  }

function showCustomAlert(title, message) {
  const alertDiv = document.getElementById("customAlert");
  if (!alertDiv) {
    console.error("Custom alert element not found!");
    return;
  }
  alertDiv.innerHTML = `
    <div class="alert-content">
      <span class="close-btn" onclick="closeCustomAlert()">&times;</span>
      <h3>${title}</h3>
      <div class="alert-body">
        ${message}
        <div class="technical-details">
          <i class="fas fa-info-circle"></i>
          تم تسجيل التفاصيل في وحدة التحكم
        </div>
      </div>
      <p class="welcome-message">نتشرف بتواجدك</p>
    </div>
  `;
  alertDiv.style.display = "block";
}

function closeCustomAlert() {
  const alertDiv = document.getElementById("customAlert");
  if (alertDiv) {
    alertDiv.style.display = "none";
  }
}

/* ---------------------------------------------
   تحميل البيانات من Google Sheets وملف مراكز المدن
--------------------------------------------- */
// تحميل بيانات المناطق من Google Sheets API
/* ---------------------------------------------
   وظائف التحميل والكاش المحسنة
--------------------------------------------- */
/* ---------------------------------------------
   وظائف التحميل والكاش المحسنة
--------------------------------------------- */
async function loadRegionsData() {
  const SHEET_ID = '1NItFn79G46YMoqdyeBvGO-oGiPqfR-oXzHEi1i-OxHM';
  const API_KEY = 'AIzaSyAL2-JNGE6oTtgVWaQH2laI45G__2nop-8';
  const SHEET_NAME = 'stations';

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
    );
    const data = await response.json();

    if (!data.values || data.values.length < 2) {
      throw new Error("الجدول لا يحتوي على بيانات كافية");
    }

    const rows = data.values
      .slice(1)
      .filter(row => row.length >= 4)
      .map(row => ({
        "المنطقة": row[0] || "غير محدد",
        "الموقع": row[1] || "غير معروف",
        "خط العرض": parseFloat(row[2]) || 0,
        "خط الطول": parseFloat(row[3]) || 0,
        "نوع الوقود": row[4] || "غير متوفر",
        "معلومات إضافية": row[5] || "لا توجد معلومات",
      }));

    processRegionsData(rows);
    return regionsData; // إرجاع البيانات المعالجة للتخزين في الكاش

  } catch (error) {
    console.error("تفاصيل الخطأ:", error);
    showCustomAlert("خطأ فني", `تعذر تحميل البيانات بسبب:<br>${error.message}`);
    return null;
  }
}

// تحميل بيانات مراكز المدن من ملف JSON
async function loadCityCenters() {
  try {
    const response = await fetch("cityCenters.json");
    if (!response.ok) throw new Error("خطأ في تحميل بيانات مراكز المدن.");
    cityCenters = await response.json();
    console.log("City Centers Loaded:", cityCenters);
  } catch (error) {
    console.error("Error loading city centers:", error);
  }
}

/* ---------------------------------------------
   معالجة البيانات وتحديث الواجهة
--------------------------------------------- */
function processRegionsData(jsonData) {
  // إعادة تعيين البيانات القديمة
  cities.length = 0;
  for (let key in regionsData) {
    delete regionsData[key];
  }

  jsonData.forEach((item, index) => {
    try {
      if (!item["المنطقة"] || !item["الموقع"]) {
        throw new Error(`بيانات ناقصة في الصف ${index + 1}`);
      }

      const lat = parseFloat(item["خط العرض"]);
      const lng = parseFloat(item["خط الطول"]);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`إحداثيات غير صالحة في الصف ${index + 1}`);
      }

      const region = item["المنطقة"];
      if (!cities.includes(region)) {
        cities.push(region);
      }

      const location = {
        name: item["الموقع"],
        lat: lat,
        lng: lng,
        fuelType: item["نوع الوقود"],
        additionalInfo: item["معلومات إضافية"],
      };

      if (!regionsData[region]) {
        regionsData[region] = [];
      }
      regionsData[region].push(location);
    } catch (error) {
      console.error(`خطأ في الصف ${index + 1}:`, error.message);
    }
  });

  populateRegionSelect();
}

// بدء التحديث التلقائي للبيانات كل 5 دقائق
function startPolling() {
  pollingInterval = setInterval(() => {
    showLoading();
    dataCache.getRegionsData().finally(() => hideLoading());
  }, 300000); // التحديث كل 5 دقائق
}
/* ---------------------------------------------
   تهيئة الخريطة والإعدادات الخاصة بها
--------------------------------------------- */
window.initMap = async function () {
  const defaultLocation = { lat: 24.7136, lng: 46.6753 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 11,
    scrollwheel: true,
    gestureHandling: "auto",
    zoomControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
  });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  document
    .getElementById("regionSelect")
    .addEventListener("change", debounce(updateLocations, 300));
};

/* ---------------------------------------------
   وظائف التعامل مع العلامات (Markers) على الخريطة
--------------------------------------------- */
function clearMarkers() {
  for (const marker of Object.values(markers)) {
    marker.setMap(null);
  }
  visibleMarkers.clear();
}

function addMarker(location) {
  if (markers[location.name]) {
    markers[location.name].setMap(map);
    visibleMarkers.add(location.name);
    return;
  }

  const latLng = new google.maps.LatLng(location.lat, location.lng);
  const marker = new google.maps.Marker({
    position: latLng,
    map: map,
    title: location.name,
    icon: {
      url: "./logo1.png",
      scaledSize: new google.maps.Size(32, 32),
    },
    draggable: false,
  });

  // تخزين الإحداثيات
  locations[location.name] = latLng;

  const infoWindowContent = `
    <div style="text-align: center; font-family: Arial, sans-serif; max-width: 400px;">
      <img src="../data/image.png" alt="Company Logo" style="width: 65px; height: auto; margin: auto;">
      <h3 style="margin: 0; font-size: 14px; color: #333;">${location.name}</h3>
      <p style="margin: 1px 0; font-size: 12px; color: #555;"><strong>نوع الوقود:</strong> ${location.fuelType}</p>
      <p style="margin: 1px 0; font-size: 12px; color: #555;"><strong>معلومات إضافية:</strong> ${location.additionalInfo}</p>
    </div>
  `;
  const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
  marker.addListener("click", () => {
    if (activeInfoWindow) {
      activeInfoWindow.close();
    }
    activeInfoWindow = infoWindow;
    infoWindow.open(map, marker);
    map.setCenter(marker.getPosition());
    map.setZoom(15);
  });

  markers[location.name] = marker;
  visibleMarkers.add(location.name);
}

/* ---------------------------------------------
   تحديث وعرض المواقع بناءً على اختيار المنطقة
--------------------------------------------- */
function updateLocations() {
  showLoading();
  try {
    const selectedRegion = document.getElementById("regionSelect").value;
    clearMarkers();
    document.getElementById("regionsTable").innerHTML = "";

    if (!selectedRegion) {
      populateLocationSelects([]);
      return;
    }

    const regionLocations = regionsData[selectedRegion];
    if (regionLocations && regionLocations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      const addedLocations = new Set();

      regionLocations.forEach((location) => {
        if (!addedLocations.has(location.name)) {
          addMarker(location);
          bounds.extend(new google.maps.LatLng(location.lat, location.lng));
          addedLocations.add(location.name);
          addRowToRegionsTable(selectedRegion, location);
        }
      });

      if (addedLocations.size > 0) {
        map.fitBounds(bounds);
      }
      calculateAverageDistances(selectedRegion, regionLocations);
      populateLocationSelects(regionLocations.map((loc) => loc.name));
    }
  } catch (error) {
    console.error("Error updating locations:", error);
    alert("حدث خطأ أثناء تحديث المواقع. يرجى المحاولة مرة أخرى.");
  } finally {
    hideLoading();
  }
}

function addRowToRegionsTable(selectedRegion, location) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${selectedRegion}</td>
    <td>${location.name}</td>
    <td id="distance-${selectedRegion}-${location.name}">---</td>
    <td>
      <button class="show-map-button" onclick="centerMap(${location.lat}, ${location.lng})">عرض على الخريطة</button>
      <button class="show-map-button" onclick="navigateToStation(${location.lat}, ${location.lng})">عرض الاتجاهات</button>
    </td>
  `;
  document.getElementById("regionsTable").appendChild(row);
}

/* ---------------------------------------------
   وظائف التنقل والرسم على الخريطة
--------------------------------------------- */
function navigateToStation(lat, lng) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLatitude = position.coords.latitude;
        const currentLongitude = position.coords.longitude;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLatitude},${currentLongitude}&destination=${lat},${lng}&travelmode=driving`;
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = googleMapsUrl;
        } else {
          window.open(googleMapsUrl, "_blank");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("يرجى السماح بالوصول إلى موقعك لاستخدام هذه الميزة");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    alert("المتصفح لا يدعم تحديد الموقع الجغرافي.");
  }
}

function populateRegionSelect() {
    const regionSelect = document.getElementById("regionSelect");
    regionSelect.innerHTML = "";
    // إضافة خيار افتراضي
    regionSelect.add(new Option("اختر منطقة", ""));
    cities.forEach((city) => {
      const option = new Option(city, city);
      regionSelect.add(option);
    });
  }
  

  function populateLocationSelects(locationNames) {
    const startSelect = document.getElementById("startLocation");
    const endSelect = document.getElementById("endLocation");
    
    // إعادة تعيين القوائم
    startSelect.innerHTML = "";
    endSelect.innerHTML = "";
    
    // إضافة خيار افتراضي لكل قائمة
//    startSelect.add(new Option("اختر نقطة الانطلاق", ""));
//    endSelect.add(new Option("اختر نقطة الوصول", ""));
    
    if (locationNames.length > 0) {
      // إضافة خيار "موقعي الحالي" بعد الخيار الافتراضي
      startSelect.add(new Option("موقعي الحالي", "موقعي الحالي"));
      endSelect.add(new Option("موقعي الحالي", "موقعي الحالي"));
      
      // إضافة باقي المواقع
      locationNames.forEach((name) => {
        startSelect.add(new Option(name, name));
        endSelect.add(new Option(name, name));
      });
      startSelect.disabled = false;
      endSelect.disabled = false;
    } else {
      startSelect.disabled = true;
      endSelect.disabled = true;
    }
    
    resetSelectedDistance();
  }
  

function centerMap(lat, lng) {
  map.setCenter(new google.maps.LatLng(lat, lng));
  map.setZoom(18);
}

function calculateAverageDistances(region, locationsArray) {
  const cityCenter = cityCenters[region];
  if (!cityCenter) return;
  const latLngCityCenter = new google.maps.LatLng(cityCenter.lat, cityCenter.lng);
  locationsArray.forEach((location) => {
    const distance = computeDistance(latLngCityCenter, location);
    const distanceElem = document.getElementById(`distance-${region}-${location.name}`);
    if (distanceElem) {
      distanceElem.innerText = distance.toFixed(2);
    }
  });
}

function computeDistance(latLngCityCenter, location) {
  const latLngLocation = new google.maps.LatLng(location.lat, location.lng);
  return google.maps.geometry.spherical.computeDistanceBetween(latLngLocation, latLngCityCenter) / 1000;
}

function resetSelectedDistance() {
  document.getElementById("selectedStart").innerText = "---";
  document.getElementById("selectedEnd").innerText = "---";
  document.getElementById("calculatedDistance").innerText = "---";
  directionsRenderer.setMap(null);
}

/* ---------------------------------------------
   حساب المسافات ورسم الطريق بين الموقعين
--------------------------------------------- */
function handleLocationChange() {
  const startLocation = document.getElementById("startLocation").value;
  const endLocation = document.getElementById("endLocation").value;
  document.getElementById("selectedStart").innerText = startLocation || "---";

  if (startLocation && endLocation) {
    calculateDistanceBetweenLocations(startLocation, endLocation);
  } else {
    resetSelectedDistance();
  }
}

document.getElementById("startLocation").addEventListener("change", handleLocationChange);
document.getElementById("endLocation").addEventListener("change", handleLocationChange);

function calculateDistanceBetweenLocations(start, end) {
  const handleGeolocation = (latLngStart, latLngEnd) => {
    if (!latLngStart || !latLngEnd) {
      console.error("Invalid start or end location");
      return;
    }
    const distance = google.maps.geometry.spherical.computeDistanceBetween(latLngStart, latLngEnd) / 1000;
    document.getElementById("calculatedDistance").innerText = distance.toFixed(2) + " كم";
    document.getElementById("selectedStart").innerText = start === "موقعي الحالي" ? "موقعي الحالي" : start;
    document.getElementById("selectedEnd").innerText = end === "موقعي الحالي" ? "موقعي الحالي" : end;
    drawRoute(latLngStart, latLngEnd);
  };

  if (start === "موقعي الحالي" || end === "موقعي الحالي") {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latLngCurrent = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          const latLngStart = start === "موقعي الحالي" ? latLngCurrent : locations[start];
          const latLngEnd = end === "موقعي الحالي" ? latLngCurrent : locations[end];
          handleGeolocation(latLngStart, latLngEnd);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("فشل الحصول على الموقع الحالي: " + error.message);
        }
      );
    } else {
      alert("المتصفح لا يدعم تحديد الموقع الجغرافي.");
    }
  } else {
    const latLngStart = locations[start];
    const latLngEnd = locations[end];
    if (!latLngStart || !latLngEnd) {
      console.error("Invalid start or end location");
      return;
    }
    handleGeolocation(latLngStart, latLngEnd);
  }
}

function drawRoute(start, end) {
  if (!start || !end) {
    console.error("Start or end location is missing");
    return;
  }
  const request = {
    origin: start,
    destination: end,
    travelMode: "DRIVING",
  };
  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(result);
      currentRoute = directionsRenderer;
    } else {
      console.error("Error fetching directions:", status);
      alert("فشل في جلب المسار. يرجى التأكد من اختيار مواقع صحيحة.");
    }
  });
}

function resetAll() {
  for (const marker of Object.values(markers)) {
    marker.setMap(null);
  }
  markers = {};
  visibleMarkers.clear();
  if (currentRoute) {
    currentRoute.setMap(null);
    currentRoute = null;
  }
  document.getElementById("regionsTable").innerHTML = "";
  document.getElementById("regionSelect").selectedIndex = 0;
  document.getElementById("startLocation").innerHTML = '<option value="">اختر موقع</option>';
  document.getElementById("endLocation").innerHTML = '<option value="">اختر موقع</option>';
  document.getElementById("selectedStart").innerText = "---";
  document.getElementById("selectedEnd").innerText = "---";
  document.getElementById("calculatedDistance").innerText = "---";
  const defaultLocation = { lat: 24.7136, lng: 46.6753 };
  map.setCenter(defaultLocation);
  map.setZoom(11);
}

/* ---------------------------------------------
   وظيفة debounce لتأخير تنفيذ الدوال عند التكرار السريع
--------------------------------------------- */
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/* ---------------------------------------------
   إدارة القائمة الجانبية (Sidebar)
--------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    showLoading();
    await Promise.all([
      loadCityCenters(),
      dataCache.getRegionsData() // استخدام الكاش هنا
    ]);
    startPolling();
    await initMap();
  } catch (error) {
    console.error("Error during initialization:", error);
  } finally {
    hideLoading();
  }
});

/* ---------------------------------------------
   البحث عن أقرب محطة بناءً على موقع المستخدم
--------------------------------------------- */
function findNearestStation() {
    if (Object.keys(regionsData).length === 0) {
      showCustomAlert("تحذير", "البيانات قيد التحميل... الرجاء الانتظار");
      return;
    }
  
    showLoading("");
    
    if (!navigator.geolocation) {
      hideLoading();
      showCustomAlert("خطأ", "المتصفح لا يدعم تحديد الموقع");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatLng = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
  
        const selectedRegion = document.getElementById("regionSelect").value;
        let stationsToSearch = selectedRegion
          ? regionsData[selectedRegion]
          : Object.values(regionsData).flat();
  
        if (!stationsToSearch || stationsToSearch.length === 0) {
          hideLoading();
          showCustomAlert("تنبيه", "لا توجد محطات متاحة للبحث");
          return;
        }
  
        let nearestStation = null;
        let shortestDistance = Infinity;
        
        stationsToSearch.forEach((station) => {
          const stationLatLng = new google.maps.LatLng(station.lat, station.lng);
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            userLatLng,
            stationLatLng
          );
          
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestStation = station;
          }
        });
  
        hideLoading();
        
        if (nearestStation) {
          centerMap(nearestStation.lat, nearestStation.lng);
          showCustomAlert(
            "أقرب محطة إليك",
            `اسم المحطة: ${nearestStation.name}<br>المسافة: ${(shortestDistance / 1000).toFixed(2)} كم`
          );
        } else {
          showCustomAlert("تنبيه", "لم يتم العثور على محطات قريبة");
        }
      },
      (error) => {
        hideLoading();
        console.error("Geolocation error:", error);
        const errorMessage = error.code === error.PERMISSION_DENIED 
          ? "يرجى السماح بالوصول إلى الموقع" 
          : "فشل في الحصول على الموقع";
        showCustomAlert("خطأ", errorMessage);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }
  
function findNearestStation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // الحصول على الموقع الحالي للمستخدم بدقة
          const userLatLng = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
  
          // تحديد المحطات التي سيتم البحث فيها:
          // إذا لم يقم المستخدم باختيار مدينة (regionSelect فارغ)، يتم البحث في جميع المحطات
          const selectedRegion = document.getElementById("regionSelect").value;
          let stationsToSearch = [];
          if (!selectedRegion) {
            stationsToSearch = Object.values(regionsData).flat();
          } else {
            stationsToSearch = regionsData[selectedRegion] || [];
          }
  
          if (stationsToSearch.length === 0) {
            showCustomAlert("تنبيه", "لا توجد محطات متاحة للبحث");
            return;
          }
  
          // البحث عن أقرب محطة بناءً على المسافة من موقع المستخدم
          let nearestStation = null;
          let shortestDistance = Infinity;
          stationsToSearch.forEach((station) => {
            const stationLatLng = new google.maps.LatLng(station.lat, station.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              userLatLng,
              stationLatLng
            );
            if (distance < shortestDistance) {
              shortestDistance = distance;
              nearestStation = station;
            }
          });
  
          if (nearestStation) {
            centerMap(nearestStation.lat, nearestStation.lng);
            showCustomAlert(
              "أقرب محطة إليك",
              `اسم المحطة: ${nearestStation.name}<br>المسافة: ${(shortestDistance / 1000).toFixed(2)} كم`
            );
          } else {
            showCustomAlert("تنبيه", "لم يتم العثور على محطات قريبة");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          showCustomAlert("خطأ", "يرجى السماح بالوصول إلى الموقع");
        }
      );
    } else {
      showCustomAlert("خطأ", "المتصفح لا يدعم تحديد الموقع");
    }
  }
  
/* ---------------------------------------------
   تهيئة التطبيق عند تحميل المحتوى مع تحميل البيانات بشكل متزامن
--------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    showLoading();
    // تحميل بيانات مراكز المدن وبيانات المناطق في وقت واحد
    await Promise.all([loadCityCenters(), loadRegionsData()]);
    startPolling();
    await initMap();
  } catch (error) {
    console.error("Error during initialization:", error);
  } finally {
    hideLoading();
  }
});


// Function to find the nearest station
function showCustomAlert(title, message) {
    const alertDiv = document.getElementById("customAlert");
    alertDiv.innerHTML = `
        <div class="alert-content">
            <span class="close-btn" onclick="closeCustomAlert()">&times;</span>
            <h3>${title}</h3>
            <div class="alert-body">
                ${message}
                <div class="technical-details">
                    <i class="fas fa-info-circle"></i>
                    تم تسجيل التفاصيل في وحدة التحكم
                </div>
            </div>
            <p class="welcome-message">نتشرف بتواجدك</p>
        </div>
    `;
    alertDiv.style.display = "block";
}

function closeCustomAlert() {
    document.getElementById("customAlert").style.display = "none";
}

// Find nearest station function
function findNearestStation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLatLng = new google.maps.LatLng(
                    position.coords.latitude,
                    position.coords.longitude,
                );
                let nearestStation = null;
                let shortestDistance = Infinity;

                const selectedRegion =
                    document.getElementById("regionSelect").value;
                const stationsToSearch = selectedRegion
                    ? regionsData[selectedRegion]
                    : Object.values(regionsData).flat();

                stationsToSearch.forEach((location) => {
                    const stationLatLng = new google.maps.LatLng(
                        location.lat,
                        location.lng,
                    );
                    const distance =
                        google.maps.geometry.spherical.computeDistanceBetween(
                            userLatLng,
                            stationLatLng,
                        );
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestStation = location;
                    }
                });

                if (nearestStation) {
                    centerMap(nearestStation.lat, nearestStation.lng);
                    showCustomAlert(
                        "أقرب محطة إليك",
                        `اسم المحطة: ${nearestStation.name}<br>المسافة: ${(shortestDistance / 1000).toFixed(2)} كم`,
                    );
                } else {
                    showCustomAlert("تنبيه", "لم يتم العثور على محطات قريبة");
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                showCustomAlert("خطأ", "يرجى السماح بالوصول إلى الموقع");
            },
        );
    } else {
        showCustomAlert("خطأ", "المتصفح لا يدعم تحديد الموقع");
    }
}
function requestLocationPermission() {
    if (!navigator.geolocation) {
      showCustomAlert("خطأ", "المتصفح لا يدعم تحديد الموقع الجغرافي.");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // تم الحصول على الموقع بنجاح
        console.log("الموقع الحالي:", position.coords.latitude, position.coords.longitude);
        // يمكنك هنا متابعة الإجراءات التي تعتمد على الموقع
      },
      (error) => {
        // معالجة الأخطاء
        if (error.code === error.PERMISSION_DENIED) {
          showCustomAlert("تنبيه", "يرجى السماح بالوصول إلى الموقع لاستخدام هذه الميزة.");
        } else {
          console.error("حدث خطأ أثناء جلب الموقع:", error);
          showCustomAlert("خطأ", "حدث خطأ أثناء محاولة الحصول على الموقع.");
        }
      },
      {
        enableHighAccuracy: false, // للحصول على استجابة أسرع بدقة أقل
        timeout: 5000,             // مهلة زمنية (5 ثوانٍ)
        maximumAge: 60000          // استخدام الموقع المخزن لمدة تصل إلى دقيقة
      }
    );
  document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebarHandle = document.querySelector('.sidebar-handle');

    if (toggleButton && sidebar && sidebarHandle) {
        toggleButton.addEventListener('click', function (event) {
            event.stopPropagation(); // منع انتشار الحدث إلى document
            sidebar.classList.toggle('active');
        });

        sidebarHandle.addEventListener('click', function (event) {
            event.stopPropagation(); // منع انتشار الحدث إلى document
            sidebar.classList.add('active');
        });

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function (event) {
            if (sidebar.classList.contains('active') && !sidebar.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });
    } else {
        console.error("عناصر القائمة الجانبية غير موجودة!");
    }
});
  

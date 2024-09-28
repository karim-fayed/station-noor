let markers = {};
let locations = {};
const pinUrls = {
    blue: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    red: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    green: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
};
let activeMarker = null;
let map, directionsService, directionsRenderer;
let cityCenters = {};
const regionsData = {};
const cities = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadCityCenters();
    await loadRegionsData();
    initMap();
});

// Load regions data
async function loadRegionsData() {
    const url = 'data.xlsx';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('خطأ في تحميل البيانات. تأكد من المسار الصحيح.');
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        processRegionsData(jsonData);
    } catch (error) {
        alert('حدث خطأ أثناء تحميل بيانات المناطق: ' + error.message);
        console.error('Error loading regions data:', error);
    } finally {
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

// Process regions data
function processRegionsData(jsonData) {
    jsonData.forEach(item => {
        const region = item['المنطقة'];
        if (!cities.includes(region)) cities.push(region);
        const location = {
            name: item['الموقع'],
            lat: parseFloat(item['خط العرض']),
            lng: parseFloat(item['خط الطول']),
            fuelType: item['نوع الوقود'] || 'غير متوفر' // إضافة نوع الوقود
        };
        if (!regionsData[region]) regionsData[region] = [];
        regionsData[region].push(location);
    });
    populateRegionSelect();
    populateFuelTypeSelect(); // تأكد من استدعاء هذه الدالة هنا
}

// Load city centers
async function loadCityCenters() {
    try {
        const response = await fetch('cityCenters.json');
        if (!response.ok) throw new Error('خطأ في تحميل بيانات مراكز المدن.');
        cityCenters = await response.json();
        console.log(cityCenters);
    } catch (error) {
        console.error('Error loading city centers:', error);
    }
}

// Initialize the map
function initMap() {
    const defaultLocation = { lat: 24.7136, lng: 46.6753 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 10,
        mapTypeId: 'hybrid'
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    document.getElementById('regionSelect').addEventListener('change', updateLocations);
    document.getElementById('fuelTypeSelect').addEventListener('change', updateLocations); // إضافة الاستماع لتغيير نوع الوقود
}

// Populate region select
function populateRegionSelect() {
    const regionSelect = document.getElementById('regionSelect');
    regionSelect.innerHTML = '';
    cities.forEach(city => {
        const option = new Option(city, city);
        regionSelect.add(option);
    });
}

// Populate fuel type select
function populateFuelTypeSelect() {
    const fuelTypeSelect = document.getElementById('fuelTypeSelect');
    const fuelTypes = new Set();

    for (const region in regionsData) {
        regionsData[region].forEach(location => {
            fuelTypes.add(location.fuelType);
        });
    }

    fuelTypeSelect.innerHTML = '<option value="">اختر نوع الوقود</option>';
    fuelTypes.forEach(type => {
        fuelTypeSelect.add(new Option(type, type));
    });
}

// Update locations based on selected region
function updateLocations() {
    const selectedRegion = document.getElementById('regionSelect').value;
    const selectedFuelType = document.getElementById('fuelTypeSelect').value;
    clearMarkers();
    const regionsTable = document.getElementById('regionsTable');
    regionsTable.innerHTML = '';

    if (!selectedRegion) {
        populateLocationSelects([]);
        return;
    }

    // تصفية المواقع بناءً على نوع الوقود
    const regionLocations = regionsData[selectedRegion].filter(location => 
        !selectedFuelType || location.fuelType === selectedFuelType
    );

    if (regionLocations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        const addedLocations = new Set();

        regionLocations.forEach(location => {
            if (!addedLocations.has(location.name)) {
                addMarker(location);
                bounds.extend(new google.maps.LatLng(location.lat, location.lng));
                addedLocations.add(location.name);
                addRowToRegionsTable(selectedRegion, location);
            }
        });

        map.fitBounds(bounds);

        // حساب المسافات فقط للمواقع المعروضة
        calculateAverageDistances(selectedRegion, regionLocations);
        populateLocationSelects(regionLocations.map(loc => loc.name));
    }
}


// Clear markers from the map
function clearMarkers() {
    for (const marker of Object.values(markers)) {
        marker.setMap(null);
    }
    markers = {};
    locations = {};
    directionsRenderer.setMap(null);
}

// Add a marker to the map
function addMarker(location) {
    const latLng = new google.maps.LatLng(location.lat, location.lng);
    const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: location.name,
        icon: pinUrls.blue,
        draggable: true
    });

    marker.addListener('click', () => {
        if (activeMarker) activeMarker.setIcon(pinUrls.blue);
        marker.setIcon(pinUrls.red);
        activeMarker = marker;
        map.setCenter(marker.getPosition());
        map.setZoom(12);
    });

    marker.addListener('dragend', (event) => {
        const newLatLng = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        console.log(`Marker moved to: ${newLatLng.lat}, ${newLatLng.lng}`);
    });

    markers[location.name] = marker;
    locations[location.name] = latLng;
}

// Add a row to the regions table
// Add a row to the regions table
function addRowToRegionsTable(selectedRegion, location) {
    const row = document.createElement('tr');

    // معالجة أنواع الوقود
    const fuelTypes = location.fuelType.split(' '); // تقسيم الأنواع إلى مصفوفة
    const coloredFuelTypes = fuelTypes.map(type => {
        let color;
        if (type === '91') {
            color = 'green'; // اللون الأخضر لنوع الوقود 91
        } else if (type === '95') {
            color = 'red'; // اللون الأحمر لنوع الوقود 95
        } else if (type.toLowerCase() === 'ديزل') {
            color = 'orange'; // اللون الأصفر لنوع الوقود ديزل
        } else {
            color = 'black'; // لون افتراضي للأنواع الأخرى
        }
        return `<span style="color: ${color}; font-weight: bold;">${type}</span>`; // تلوين النوع وجعله غامق
    });

    row.innerHTML = `
        <td>${selectedRegion}</td>
        <td>${location.name}</td>
        <td id="distance-${selectedRegion}-${location.name}">---</td>
        <td>${coloredFuelTypes.join(' ')}</td> <!-- إضافة الأنواع الملونة -->
        <td><button class="show-map-button" onclick="centerMap(${location.lat}, ${location.lng})">عرض على الخريطة</button></td>
    `;
    document.getElementById('regionsTable').appendChild(row);
}


// Populate location selects
function populateLocationSelects(locationNames) {
    const startSelect = document.getElementById('startLocation');
    const endSelect = document.getElementById('endLocation');

    startSelect.innerHTML = "";
    endSelect.innerHTML = "";

    if (locationNames.length > 0) {
        startSelect.add(new Option("اختر موقع", ""));
        endSelect.add(new Option("اختر موقع", ""));
        startSelect.add(new Option("موقعي الحالي", "موقعي الحالي"));
        endSelect.add(new Option("موقعي الحالي", "موقعي الحالي"));

        locationNames.forEach(name => {
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

// Center the map on a specific location
function centerMap(lat, lng) {
    map.setCenter(new google.maps.LatLng(lat, lng));
    map.setZoom(18);
}

// تحديث دالة حساب المسافات
function calculateAverageDistances(region, locationsArray) {
    const cityCenter = cityCenters[region];
    if (!cityCenter) return;

    const latLngCityCenter = new google.maps.LatLng(cityCenter.lat, cityCenter.lng);
    locationsArray.forEach(location => {
        const distance = computeDistance(latLngCityCenter, location);
        document.getElementById(`distance-${region}-${location.name}`).innerText = distance.toFixed(2);
    });
}
function computeDistance(latLngCityCenter, location) {
    const latLngLocation = new google.maps.LatLng(location.lat, location.lng);
    return google.maps.geometry.spherical.computeDistanceBetween(latLngLocation, latLngCityCenter) / 1000;
}
// Reset selected distances
function resetSelectedDistance() {
    document.getElementById('selectedStart').innerText = '---';
    document.getElementById('selectedEnd').innerText = '---';
    document.getElementById('calculatedDistance').innerText = '---';
    directionsRenderer.setMap(null);
}

// Handle location selection changes
document.getElementById('startLocation').addEventListener('change', handleLocationChange);
document.getElementById('endLocation').addEventListener('change', handleLocationChange);

function handleLocationChange() {
    const startLocation = document.getElementById('startLocation').value;
    const endLocation = document.getElementById('endLocation').value;
    document.getElementById('selectedStart').innerText = startLocation || '---';
    
    if (startLocation && endLocation) {
        calculateDistanceBetweenLocations(startLocation, endLocation);
    } else {
        resetSelectedDistance();
    }
}

// Calculate distance between selected locations
function calculateDistanceBetweenLocations(start, end) {
    const handleGeolocation = (latLngStart, latLngEnd) => {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(latLngStart, latLngEnd) / 1000;
        document.getElementById('calculatedDistance').innerText = distance.toFixed(2);
        drawRoute(latLngStart, latLngEnd);
    };

    if (start === "موقعي الحالي" || end === "موقعي الحالي") {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const latLngCurrent = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                const latLngStart = start === "موقعي الحالي" ? latLngCurrent : locations[start];
                const latLngEnd = end === "موقعي الحالي" ? latLngCurrent : locations[end];
                handleGeolocation(latLngStart, latLngEnd);
            }, (error) => {
                alert('فشل الحصول على الموقع الحالي: ' + error.message);
                console.error('Geolocation error:', error);
            });
        } else {
            alert("المتصفح لا يدعم تحديد الموقع الجغرافي.");
        }
    } else {
        const latLngStart = locations[start];
        const latLngEnd = locations[end];
        handleGeolocation(latLngStart, latLngEnd);
    }
}

// Draw route on the map
function drawRoute(start, end) {
    const request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
    };
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
        } else {
            console.error('Error fetching directions:', status);
        }
    });
}

// Reset all
function resetAll() {
    window.location.reload();
}

// Link reset button to function
document.getElementById('resetButton').addEventListener('click', resetAll);

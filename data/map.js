let markers = {};
let locations = {};
const pinUrls = {
    blue: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    red: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    green: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
};
let activeMarker = null;
let activeInfoWindow = null;
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
    console.log(jsonData); // هذا سيساعدك على رؤية البيانات
    jsonData.forEach(item => {
        const region = item['المنطقة'];
        if (!cities.includes(region)) cities.push(region);
        const location = {
            name: item['الموقع'],
            lat: parseFloat(item['خط العرض']),
            lng: parseFloat(item['خط الطول']),
            fuelType: item['نوع الوقود'] || 'غير متوفر',
            additionalInfo: item['معلومات إضافية'] || 'لا توجد معلومات إضافية' // تأكد من وجود العمود في شيت الإكسل
        };
        if (!regionsData[region]) regionsData[region] = [];
        regionsData[region].push(location);
    });
    populateRegionSelect();
    populateFuelTypeSelect();
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
window.initMap = async function() {
    const defaultLocation = { lat: 24.7136, lng: 46.6753 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 11,
        scrollwheel: true,
        gestureHandling: 'auto',
        zoomControl: false, // إخفاء زر التكبير والتصغير
        streetViewControl: false, // إخفاء زر التجول الافتراضي
        fullscreenControl: false, // إخفاء زر الشاشة الكاملة
        mapTypeControl: false, // اجعل زر نوع الخريطة ظاهرًا
        //mapTypeControlOptions: {
            //style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR, // استخدم الشريط الأفقي
            //position: google.maps.ControlPosition.TOP_CENTER // موقع التحكم
       // }   
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    
    document.getElementById('regionSelect').addEventListener('change', debounce(updateLocations, 300));
    document.getElementById('fuelTypeSelect').addEventListener('change', debounce(updateLocations, 300));
};

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
function addMarker(location) {
    const latLng = new google.maps.LatLng(location.lat, location.lng);
    
    const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: location.name,
        icon: {
            url: '../data/image.png', 
            scaledSize: new google.maps.Size(50, 50), // Resize the logo
        },
        draggable: false
    });

    const infoWindow = new google.maps.InfoWindow();

    const contentString = `
        <div style="text-align: center; white-space: nowrap; overflow: hidden; z-index: 1000;">
            <img src="../data/image.png" alt="Company Logo" style="width:70px;">
            <h3>${location.name}</h3>
            <p>نوع الوقود: ${location.fuelType}</p>
            <p>${location.additionalInfo}</p>
        </div>
    `;

    marker.addListener('click', () => {
        if (activeInfoWindow) {
            activeInfoWindow.close();
        }
        if (activeMarker) {
            activeMarker.setIcon({
                url: '../data/image.png',
                scaledSize: new google.maps.Size(50, 50)
            });
        }

        marker.setIcon({
            url: '../data/image.png',
            scaledSize: new google.maps.Size(60, 60) // Enlarge the active marker's icon
        });

        activeMarker = marker;
        activeInfoWindow = infoWindow;

        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);

        map.setCenter(marker.getPosition());
        map.setZoom(11);
    });

    // Listen for the closeclick event on the InfoWindow to reset map center to the current city center
    infoWindow.addListener('closeclick', () => {
        const selectedRegion = document.getElementById('regionSelect').value;

        if (cityCenters[selectedRegion]) {
            // Recenter the map to the selected city's center
            const cityCenter = cityCenters[selectedRegion];
            map.setCenter(new google.maps.LatLng(cityCenter.lat, cityCenter.lng));
            map.setZoom(11); // تعيين التكبير الافتراضي مرة أخرى إذا لزم الأمر
        } else {
            console.error('City center not found for:', selectedRegion);
        }
    });

    markers[location.name] = marker;
    locations[location.name] = latLng;
}



// Add a row to the regions table
function addRowToRegionsTable(selectedRegion, location) {
    const row = document.createElement('tr');

    // أزل هذا الجزء الذي يضيف نوع الوقود
    /*
    const fuelTypes = location.fuelType.split(' ');
    const coloredFuelTypes = fuelTypes.map(type => {
        let color;
        if (type === '91') {
            color = 'green';
        } else if (type === '95') {
            color = 'red';
        } else if (type.toLowerCase() === 'ديزل') {
            color = 'orange';
        } else {
            color = 'black';
        }
        return `<span style="color: ${color}; font-weight: bold;">${type}</span>`;
    });
    */

    // تعديل الكود لإضافة الصف بدون نوع الوقود
    row.innerHTML = `
        <td>${selectedRegion}</td>
        <td>${location.name}</td>
        <td id="distance-${selectedRegion}-${location.name}">---</td>
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

// Calculate average distances
function calculateAverageDistances(region, locationsArray) {
    const cityCenter = cityCenters[region];
    if (!cityCenter) return;

    const latLngCityCenter = new google.maps.LatLng(cityCenter.lat, cityCenter.lng);
    locationsArray.forEach(location => {
        const distance = computeDistance(latLngCityCenter, location);
        document.getElementById(`distance-${region}-${location.name}`).innerText = distance.toFixed(2);
    });
}

// Compute distance
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

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

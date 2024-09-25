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

async function loadRegionsData() {
    const url = 'data.xlsx';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('خطأ في تحميل البيانات. تأكد من المسار الصحيح.');
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log(jsonData);

        jsonData.forEach(item => {
            const region = item['المنطقة'];
            if (!cities.includes(region)) {
                cities.push(region);
            }

            const location = {
                name: item['الموقع'],
                lat: parseFloat(item['خط العرض']),
                lng: parseFloat(item['خط الطول'])
            };

            if (!regionsData[region]) {
                regionsData[region] = [];
            }
            regionsData[region].push(location);
        });

        populateRegionSelect();
    } catch (error) {
        alert('حدث خطأ أثناء تحميل بيانات المناطق: ' + error.message);
        console.error('Error loading regions data:', error);
    } finally {
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

async function loadCityCenters() {
    try {
        const response = await fetch('cityCenters.json');
        if (!response.ok) throw new Error('خطأ في تحميل بيانات مراكز المدن.');
        cityCenters = await response.json(); // تخزين البيانات هنا
        console.log(cityCenters);
    } catch (error) {
        console.error('Error loading city centers:', error);
    }
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadCityCenters);

const regionSelect = document.getElementById('regionSelect');
const startLocationSelect = document.getElementById('startLocation');
const endLocationSelect = document.getElementById('endLocation');
const regionsTable = document.getElementById('regionsTable');

function initMap() {
    console.log('initMap called');
    const defaultLocation = { lat: 24.7136, lng: 46.6753 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 10,
        mapTypeId: 'hybrid'
    });
    
    map.setOptions({ scrollwheel: true });
    loadRegionsData();

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    if (regionSelect) {
        for (const region in regionsData) {
            const option = new Option(region, region);
            regionSelect.add(option);
        }

        regionSelect.addEventListener('change', (event) => {
            updateLocations();
        });
    }
}

// Call initMap only after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

function updateLocations() {
    const selectedRegion = regionSelect.value;
    regionsTable.innerHTML = '';
    if (!selectedRegion) {
        populateLocationSelects([]);
        return;
    }

    for (const marker of Object.values(markers)) {
        marker.setMap(null);
    }
    markers = {};
    locations = {};
    directionsRenderer.setMap(null);

    const regionLocations = regionsData[selectedRegion];
    if (regionLocations) {
        const bounds = new google.maps.LatLngBounds();
        const addedLocations = new Set();

        regionLocations.forEach((location) => {
            if (!addedLocations.has(location.name)) {
                const latLng = new google.maps.LatLng(location.lat, location.lng);
                const marker = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    title: location.name,
                    icon: pinUrls.blue,
                    draggable: true // جعل العلامة قابلة للسحب
                });

                marker.addListener('click', () => {
                    if (activeMarker) {
                        activeMarker.setIcon(pinUrls.blue);
                    }
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

                bounds.extend(latLng);

                const row = document.createElement('tr');
                row.innerHTML = `<td>${selectedRegion}</td><td>${location.name}</td><td id="distance-${selectedRegion}-${location.name}">---</td><td><button class="show-map-button" onclick="centerMap(${location.lat}, ${location.lng})">عرض على الخريطة</button></td>`;
                regionsTable.appendChild(row);

                addedLocations.add(location.name);
            }
        });

        map.fitBounds(bounds);
        calculateAverageDistances(selectedRegion);
        populateLocationSelects(regionLocations.map(loc => loc.name));
    }
}

function populateRegionSelect() {
    const regionSelect = document.getElementById('regionSelect');
    regionSelect.innerHTML = '';

    cities.forEach(city => {
        const option = new Option(city, city);
        regionSelect.add(option);
    });
}

function populateLocationSelects(locationNames) {
    const startSelect = document.getElementById('startLocation');
    const endSelect = document.getElementById('endLocation');

    startSelect.innerHTML = ""; 
    endSelect.innerHTML = ""; 

    const addedOptions = new Set();

    if (locationNames.length > 0) {
        startSelect.add(new Option("اختر موقع", ""));
        endSelect.add(new Option("اختر موقع", ""));
        startSelect.add(new Option("موقعي الحالي", "موقعي الحالي"));
        endSelect.add(new Option("موقعي الحالي", "موقعي الحالي"));

        locationNames.forEach(name => {
            if (!addedOptions.has(name)) {
                startSelect.add(new Option(name, name));
                endSelect.add(new Option(name, name));
                addedOptions.add(name);
            }
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

function calculateAverageDistances(region) {
    const locationsArray = regionsData[region];
    const cityCenter = cityCenters[region]; // تأكد من وجود مركز المدينة للمنطقة

    if (cityCenter) {
        const latLngCityCenter = new google.maps.LatLng(cityCenter.lat, cityCenter.lng);

        locationsArray.forEach(location => {
            const latLngLocation = new google.maps.LatLng(location.lat, location.lng);
            const distanceToCenter = google.maps.geometry.spherical.computeDistanceBetween(latLngLocation, latLngCityCenter) / 1000;
            document.getElementById(`distance-${region}-${location.name}`).innerText = distanceToCenter.toFixed(2);
        });
    }
}



function resetSelectedDistance() {
    document.getElementById('selectedStart').innerText = '---';
    document.getElementById('selectedEnd').innerText = '---';
    document.getElementById('calculatedDistance').innerText = '---';
    directionsRenderer.setMap(null);
}

regionSelect.addEventListener('change', () => {
    updateLocations();
});

startLocationSelect.addEventListener('change', () => {
    const startLocation = startLocationSelect.value;
    const endLocation = endLocationSelect.value;
    document.getElementById('selectedStart').innerText = startLocation || '---';
    if (startLocation && endLocation) {
        calculateDistanceBetweenLocations(startLocation, endLocation);
    } else {
        resetSelectedDistance();
    }
});

endLocationSelect.addEventListener('change', () => {
    const startLocation = startLocationSelect.value;
    const endLocation = endLocationSelect.value;
    document.getElementById('selectedEnd').innerText = endLocation || '---';
    if (startLocation && endLocation) {
        calculateDistanceBetweenLocations(startLocation, endLocation);
    } else {
        resetSelectedDistance();
    }
});

function resetSelections() {
    regionSelect.selectedIndex = 0;
    startLocationSelect.selectedIndex = 0;
    endLocationSelect.selectedIndex = 0;

    for (const marker of Object.values(markers)) {
        marker.setMap(null);
    }
    markers = {};
    locations = {};

    directionsRenderer.setMap(null);
    resetSelectedDistance();
}

function calculateDistanceBetweenLocations(start, end) {
    if (start === "موقعي الحالي" || end === "موقعي الحالي") {
        if (navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            };
            navigator.geolocation.getCurrentPosition((position) => {
                const latLngCurrent = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                const latLngStart = start === "موقعي الحالي" ? latLngCurrent : locations[start];
                const latLngEnd = end === "موقعي الحالي" ? latLngCurrent : locations[end];

                const distance = google.maps.geometry.spherical.computeDistanceBetween(latLngStart, latLngEnd) / 1000; // Convert to km
                document.getElementById('calculatedDistance').innerText = distance.toFixed(2);
                drawRoute(latLngStart, latLngEnd);
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
        const distance = google.maps.geometry.spherical.computeDistanceBetween(latLngStart, latLngEnd) / 1000; // Convert to km
        document.getElementById('calculatedDistance').innerText = distance.toFixed(2);
        drawRoute(latLngStart, latLngEnd);
    }
}

function drawRoute(start, end) {
    const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
        } else {
            console.error('Error fetching directions:', status);
        }
    });
}

window.onload = function() {
    document.getElementById('loadingMessage').style.display = 'block';
    loadRegionsData();
    initMap();
};

document.getElementById('resetButton').addEventListener('click', () => {
    resetSelectedDistance();
    regionSelect.selectedIndex = 0;
    startLocationSelect.selectedIndex = 0;
    endLocationSelect.selectedIndex = 0;
    for (const marker of Object.values(markers)) {
        marker.setMap(null);
    }
    markers = {};
    locations = {};
});

function checkMobileCompatibility() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('تطبيق متوافق مع الأجهزة المحمولة');
    }
}

checkMobileCompatibility();

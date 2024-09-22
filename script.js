let map = null;
let markers = {};
let locations = {};
const bluePinUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
const redPinUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
let activeMarker = null;
let directionsService;
let directionsRenderer;

const regionsData = {};
const cities = []; // مصفوفة المدن

// دالة لتحميل بيانات المناطق من ملف الإكسل
function loadRegionsData() {
    const url = './data.xlsx'; // تأكد من المسار الصحيح للملف
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log(jsonData); // لفحص البيانات

            jsonData.forEach(item => {
                const region = item['المنطقة'];
                if (!cities.includes(region)) {
                    cities.push(region); // إضافة المنطقة إلى المصفوفة إذا لم تكن موجودة
                }

                const location = {
                    name: item['الموقع'],
                    lat: item['خط العرض'],
                    lng: item['خط الطول']
                };

                if (!regionsData[region]) {
                    regionsData[region] = [];
                }
                regionsData[region].push(location);
            });

            populateRegionSelect();
            document.getElementById('loadingMessage').style.display = 'none';
        })
        .catch(error => {
            console.error('Error loading regions data:', error);
        });
}

const regionSelect = document.getElementById('regionSelect');
const startLocationSelect = document.getElementById('startLocation');
const endLocationSelect = document.getElementById('endLocation');
const regionsTable = document.getElementById('regionsTable');
const loadingMessage = document.getElementById('loadingMessage');
const selectedStart = document.getElementById('selectedStart');
const selectedEnd = document.getElementById('selectedEnd');
const calculatedDistance = document.getElementById('calculatedDistance');

function initMap() {
    const defaultLocation = { lat: 24.7136, lng: 46.6753 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 10,
        scrollwheel: true,
        mapTypeId: 'hybrid'
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    document.getElementById('loadingMessage').style.display = 'none';
}

function updateLocations() {
    const selectedRegion = document.getElementById('regionSelect').value;
    console.log('Updating locations for region:', selectedRegion);
    regionsTable.innerHTML = '';
    if (!selectedRegion) {
        populateLocationSelects([]);
        return;
    }

    // Clear old markers and directions
    for (const marker of Object.values(markers)) {
        marker.setMap(null);
    }
    markers = {};
    locations = {};
    directionsRenderer.setMap(null); // إزالة المسار السابق

    const regionLocations = regionsData[selectedRegion];
    console.log('Region Locations:', regionLocations);

    if (regionLocations) {
        const bounds = new google.maps.LatLngBounds(); // لتحديد نطاق الخريطة
        regionLocations.forEach((location) => {
            const latLng = new google.maps.LatLng(location.lat, location.lng);
            bounds.extend(latLng); // توسيع نطاق الخريطة لتشمل جميع المواقع
            
            const marker = new google.maps.Marker({
                position: latLng,
                map: map,
                title: location.name,
                icon: bluePinUrl
            });

            marker.addListener('click', () => {
                if (activeMarker) {
                    activeMarker.setIcon(bluePinUrl);
                }
                marker.setIcon(redPinUrl);
                activeMarker = marker;
                map.setCenter(marker.getPosition());
                map.setZoom(12);
            });

            markers[location.name] = marker;
            locations[location.name] = latLng;

            const row = document.createElement('tr');
            row.innerHTML = `<td>${selectedRegion}</td><td>${location.name}</td><td id="distance-${selectedRegion}-${location.name}">---</td><td><button class="show-map-button" onclick="centerMap(${location.lat}, ${location.lng})">عرض على الخريطة</button></td>`;
            regionsTable.appendChild(row);
        });

        map.fitBounds(bounds); // ضبط نطاق الخريطة
        calculateAverageDistances(selectedRegion);
        populateLocationSelects(regionLocations.map(loc => loc.name));
    }
}


function populateRegionSelect() {
    const regionSelect = document.getElementById('regionSelect');
    regionSelect.innerHTML = ''; // إعادة تعيين القائمة

    cities.forEach(city => {
        const option = new Option(city, city);
        regionSelect.add(option);
    });
}


function populateLocationSelects(locationNames) {
    const startSelect = document.getElementById('startLocation');
    const endSelect = document.getElementById('endLocation');

    startSelect.innerHTML = ""; // إزالة الخيارات السابقة
    endSelect.innerHTML = ""; // إزالة الخيارات السابقة

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

function centerMap(lat, lng) {
    map.setCenter(new google.maps.LatLng(lat, lng));
    map.setZoom(18);
}

function calculateAverageDistances(region) {
    const locationsArray = regionsData[region];
    locationsArray.forEach((location1, index1) => {
        let totalDistance = 0;
        locationsArray.forEach((location2, index2) => {
            if (index1 !== index2) {
                const latLng1 = new google.maps.LatLng(location1.lat, location1.lng);
                const latLng2 = new google.maps.LatLng(location2.lat, location2.lng);
                const distance = google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2) / 1000; // Convert to km
                totalDistance += distance;
                document.getElementById(`distance-${region}-${location2.name}`).innerText = distance.toFixed(2);
            }
        });
    });
}

function resetSelectedDistance() {
    document.getElementById('selectedStart').innerText = '---';
    document.getElementById('selectedEnd').innerText = '---';
    document.getElementById('calculatedDistance').innerText = '---';
    directionsRenderer.setMap(null); // إزالة المسار السابق
}

document.getElementById('regionSelect').addEventListener('change', () => {
    updateLocations();
});

document.getElementById('startLocation').addEventListener('change', () => {
    const startLocation = document.getElementById('startLocation').value;
    const endLocation = document.getElementById('endLocation').value;
    document.getElementById('selectedStart').innerText = startLocation || '---';
    if (startLocation && endLocation) {
        calculateDistanceBetweenLocations(startLocation, endLocation);
    } else {
        resetSelectedDistance();
    }
});

document.getElementById('endLocation').addEventListener('change', () => {
    const startLocation = document.getElementById('startLocation').value;
    const endLocation = document.getElementById('endLocation').value;
    document.getElementById('selectedEnd').innerText = endLocation || '---';
    if (startLocation && endLocation) {
        calculateDistanceBetweenLocations(startLocation, endLocation);
    } else {
        resetSelectedDistance();
    }
});


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
                drawRoute(latLngStart, latLngEnd); // رسم المسار بين النقطتين
            }, (error) => {
                console.error("Error getting location: ", error);
                alert("فشل في الحصول على الموقع الحالي. تأكد من تفعيل GPS.");
            }, options);
        } else {
            alert("تدعم هذه الميزة المتصفحات التي تحتوي على خدمات الموقع.");
        }
    } else {
        const latLngStart = locations[start];
        const latLngEnd = locations[end];
        const distance = google.maps.geometry.spherical.computeDistanceBetween(latLngStart, latLngEnd) / 1000; // Convert to km
        document.getElementById('calculatedDistance').innerText = distance.toFixed(2);
        drawRoute(latLngStart, latLngEnd); // رسم المسار بين النقطتين
    }
}

function drawRoute(start, end) {
    const request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING',
        provideRouteAlternatives: true // تقديم خيارات بديلة للطرق
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
            directionsRenderer.setOptions({
                polylineOptions: {
                    strokeColor: 'blue',
                    strokeWeight: 5,
                    strokeOpacity: 0.7
                },
                suppressMarkers: true
            });

            // ضبط الخريطة لتظهر المسار بشكل أفضل
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.end_location);
                bounds.extend(step.start_location); // إضافة نقطة البداية للنطاق
            });
            map.fitBounds(bounds); // ضبط نطاق الخريطة ليتناسب مع المسار
        } else {
            console.error('Error fetching directions:', status);
            alert("حدث خطأ أثناء محاولة رسم المسار.");
        }
    });
}




window.onload = function() {
    initMap();
    loadRegionsData();
};

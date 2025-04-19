// Configure MapTiler SDK
maptilersdk.config.apiKey = 'C5gadk1d4Aij5VT8qROL';

// Generated from MetroBus XML data
// Generated on: [timestamp]
// Contains data for [X] bus routes and [Y] bus stops

// Add after maptilersdk config
window.addEventListener('load', () => {
    console.log('Page loaded, checking bus data:');
    console.log('Bus routes:', busRoutes);
    console.log('Bus stops:', busStops);
    console.log('Select element:', document.getElementById('busRouteSelect'));
});

// Add at the top of your file, after the MapTiler config
console.log('Bus routes loaded:', busRoutes.length);
console.log('Bus stops loaded:', busStops.length);
console.log('findNearbyStops available:', typeof findNearbyStops === 'function');

async function searchLocation(searchText) {
    const apiKey = 'C5gadk1d4Aij5VT8qROL';
    try {
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(searchText)}.json?key=${apiKey}`);
        if(!response.ok) throw new Error ('search failed');
        const data = await response.json();
        
        if(data.features && data.features.length > 0) {
            const location = data.features[0];
            return{
                coordinates: location.center,
                address: location.place_name,
                properties: location.properties
            };
        }
        return null;
    } catch (error) {
        console.log('error getting location:', error);
        return null;
    }
}

function getLocation() {
    const locate = document.getElementById("getlocation");
    const result = document.getElementById("result");
    const going = document.getElementById("goingto");
    const go = document.getElementById("gotto");
    locate.addEventListener("click", function() {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, handleLocationError);
            result.textContent = "Getting your location...";
        } else {
            result.textContent = "Geolocation is not supported by this browser.";  
        }
    });
    if(going && go) {
        go.addEventListener("click", async function() {
            const searchText = going.value.trim();   
            if(searchText === "") {
                result.textContent = "please enter a destination";
                alert('enter a destination');
                return;
            }    
            result.textContent = "searching for your destination";
            const locationData = await searchLocation(searchText);
            if (locationData) {
                const [longitude, latitude] = locationData.coordinates;
                // Check if the coordinates are in the UK
                if (isLocationInUK(latitude, longitude)) {
                    console.log('Location is within the UK');
                    // Proceed with your logic for UK locations
                } else {
                    alert('Location is outside of the UK');
                    result.textContent = "Location is outside of the UK";
                    console.log('Location is outside the UK');
                    result.textContent = "Location is outside of the UK";
                    return;
                    // Handle non-UK locations
                }
                const apiKey = 'C5gadk1d4Aij5VT8qROL';
                const mapStyleId = '0195d8bd-f901-7e90-8469-4095ee9643e0';
                const address = await getAddressFromCoordinates(longitude, latitude, apiKey);
                result.innerHTML = `Your location: ${address}<br>
                <small>Coordinates: ${latitude}, ${longitude}</small>`;
                if (map){
                    map.setCenter([longitude, latitude]);
                    marker.setLngLat([longitude, latitude])
                    .setPopup(new maptilersdk.Popup().setHTML(`
                        <div class="popup-content">
                            <strong>Location:</strong><br>
                            ${address}
                        </div>
                    `));
                    marker.addTo(map);
                }else{
                    map = new maptilersdk.Map({
                        container: 'map',
                        style: mapStyleId,
                        center: [longitude, latitude],
                        zoom: 15
                    });
            
                    // Add a marker for the location with a detailed popup
                    marker = new maptilersdk.Marker()
                        .setLngLat([longitude, latitude])
                        .setPopup(new maptilersdk.Popup().setHTML(`
                            <div class="popup-content">
                                <strong>Location:</strong><br>
                                ${address}
                            </div>
                        `))
                        .addTo(map);
                }
                const nearbyStops = findNearbyStops(latitude, longitude, 1); // 1km radius
                const nearbyRoutes = busRoutes.filter(route =>
                    route.stops.some(stopId => {
                        const matchedStop = nearbyStops.find(stop => stop.id === String(stopId));
                        console.log(`Checking stopId: ${stopId}, Found match:`, matchedStop);
                        return matchedStop;
                    })
                );
                
                console.log("Nearby Routes Found:", nearbyRoutes);
                console.log("Nearby Stops Found:", nearbyStops);
                // Format pattern/route info
                const patternHTML = nearbyRoutes.length > 0
                    ? nearbyRoutes.map(route => 
                        `<li>
                            <a href="#" onclick="showBusStopsOnMap('${route.id}')">
                              ${route.name}
                            </a> - ${route.description}
                         </li>`
                    ).join('')
                    : '<li>No nearby bus routes found</li>';
                
                if (nearbyStops.length > 0) {
                    // Add nearby stops section to result
                    result.innerHTML = `
                        <div class="location-result">
                            <strong>Your location:</strong> ${address}<br>
                            <small>Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</small>
                            <div class="nearby-routes">
                                <strong>Nearby Routes:</strong>
                                <ul>${patternHTML}</ul>
                            </div>
                            <div class="nearby-stops">
                                <strong>Nearby Bus Stops:</strong>
                                <ul>
                                    ${nearbyStops.map(stop => `<li>${stop.name}</li>`).join('')}
                                </ul>
                            </div>
                        </div>`;
                        alert('Click on the bus route to check the bus that goes to your location');
                    // Add markers for nearby stops
                    nearbyStops.forEach(stop => {
                        const stopMarker = new maptilersdk.Marker()
                            .setLngLat([stop.lng, stop.lat])
                            .setPopup(new maptilersdk.Popup().setHTML(`
                                <div class="popup-content">
                                    <strong>Bus Stop:</strong><br>
                                    ${stop.name} 
                                    <h3>(click on bus route to check the bus that goes to your location)</h3>
                                </div>
                            `))
                            .addTo(map);
                        busStopMarkers.push(stopMarker);
                    });
                    console.log('Checking if route stop exists in nearbyStops:', stopId);
                    console.log('Nearby Stops:', nearbyStops);
                    console.log('Nearby Routes:', nearbyRoutes);
                    console.log('Bus routes available:', busRoutes);
                    console.log('Bus stops available:', busStops);
                    console.log("patternHTML output:", patternHTML);
                }
            }
        });
    } else {
        result.textContent = "please enter a destination";
        alert('enter a destination');
        return;
    }
}

function handleLocationError(error) {
    const result = document.getElementById("result");
    switch(error.code) {
        case error.PERMISSION_DENIED:
            result.textContent = "Location access was denied by the user.";
            break;
        case error.POSITION_UNAVAILABLE:
            result.textContent = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            result.textContent = "Location request timed out.";
            break;
        default:
            result.textContent = "An unknown error occurred getting location.";
            break;
    }
}

// Move these variables to global scope
let map = null;
let marker = null;

function showSearchResult(latitude, longitude,address) {
    const result = document.getElementById("result");
    
    // Format the complete address with location details
    result.innerHTML = `
    <div class="location-result">
        <strong>Found location:</strong> ${address}<br>
        <small>Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</small>
        
    </div>`;
}

async function getAddressFromCoordinates(longitude, latitude, apiKey) {
    try {
        const response = await fetch(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${apiKey}`);
        if (!response.ok) throw new Error('Geocoding failed');
        const data = await response.json();
        
        if (data.features && data.features.length >0) {
            // Use the first feature from the geocoding response as our location
            const location = data.features[0];
            // Extract relevant address components
            const address = {
                place: location.text || '',
                street: location.properties.street || '',
                city: location.properties.city || location.properties.municipality || '',
                state: location.properties.state || '',
                country: location.properties.country||'',
                postcode: location.properties.postcode || ''
            };
            
            // Check if location is in the UK
            if (address.country && address.country.toLowerCase() !== 'united kingdom') {
                alert('Location is outside of the UK');
                return 'Location is outside of the UK';
            }
            
            // Create a more comprehensive address format that always includes country
            let formattedAddress = '';
            
            // Add street and place if available
            if (address.street) formattedAddress += `${address.street},`;
            if (address.place)  formattedAddress += `${address.place},`;
            // Add city and state
            if (address.city)   formattedAddress += `${address.city},`;
            if (address.state)  formattedAddress += `${address.state},`;
            
            // Always add postcode if available
            if (address.postcode) formattedAddress += `${address.postcode},`;
            
            // Always add country at the end, making it stand out
            if (address.country) formattedAddress += `${address.country.toUpperCase()}`;

            formattedAddress = formattedAddress.replace(/,\s*$/,'');
            return formattedAddress || 'Address details not available';
        }
        return 'Location not found';
    } catch (error) {
        console.error('Error getting address:', error);
        return 'Could not determine address';
    }
}
function isLocationInUK(latitude, longitude) {
    // Define the approximate bounding box for the United Kingdom
    const north = 60.847;   // Northernmost Latitude
    const south = 49.672;   // Southernmost Latitude
    const west = -7.572;    // Westernmost Longitude
    const east = 1.764;     // Easternmost Longitude

    // Check if the coordinates are within the bounding box
    if (latitude >= south && latitude <= north && longitude >= west && longitude <= east) {
        return true;
    } else {
        return false;
    }
}

async function showPosition(position) {

    const apiKey = 'C5gadk1d4Aij5VT8qROL';
    const mapStyleId = '0195d8bd-f901-7e90-8469-4095ee9643e0';
    const result = document.getElementById("result");
    
    // Ensure we have valid coordinates
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Check if the coordinates are in the UK
    if (isLocationInUK(latitude, longitude)) {
        console.log('Location is within the UK');
        // Proceed with your logic for UK locations
    } else {
        alert('Location is outside of the UK');
        result.textContent = "Location is outside of the UK";
        console.log('Location is outside the UK');
        // Handle non-UK locations
    }
    
    if (!latitude || !longitude) {
        result.textContent = "Could not get valid coordinates";
        return;
    }

    // Get the address and update the result
    const address = await getAddressFromCoordinates(longitude, latitude, apiKey);
    // Display the full address with coordinates
    result.innerHTML = `
    <div class="location-result">
        <strong>Your location:</strong> ${address}<br>
        <small>Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</small>
    </div>`;

    // Initialize or update the map
    if (!map) {
        populateBusRoutes();
        // Initialize the map
        map = new maptilersdk.Map({
            container: 'map',
            style: mapStyleId,
            center: [longitude, latitude],
            zoom: 19
        });

        // Add a marker for the location with a detailed popup
        marker = new maptilersdk.Marker()
            .setLngLat([longitude, latitude])
            .setPopup(new maptilersdk.Popup().setHTML(`
                <div class="popup-content">
                    <strong>Location:</strong><br>
                    ${address}
                </div>
            `))
            .addTo(map);
            const nearbyStops = findNearbyStops(latitude, longitude, 1); // 1km radius
            const nearbyRoutes = busRoutes.filter(route =>
                route.stops.some(stopId => {
                    const matchedStop = nearbyStops.find(stop => stop.id === String(stopId));
                    console.log(`Checking stopId: ${stopId}, Found match:`, matchedStop);
                    return matchedStop;
                })
            );
            
            console.log("Nearby Routes Found:", nearbyRoutes);
            console.log("Nearby Stops Found:", nearbyStops);
            // Format pattern/route info
            const patternHTML = nearbyRoutes.length > 0
                ? nearbyRoutes.map(route => 
                    `<li>
                        <a href="#" onclick="showBusStopsOnMap('${route.id}')">
                          ${route.name}
                        </a> - ${route.description}
                     </li>`
                ).join('')
                : '<li>No nearby bus routes found</li>';
            
            if (nearbyStops.length > 0) {
                // Add nearby stops section to result
                result.innerHTML = `
                    <div class="location-result">
                        <strong>Your location:</strong> ${address}<br>
                        <small>Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</small>
                        <div class="nearby-routes">
                            <strong>Nearby Routes:</strong>
                            <ul>${patternHTML}</ul>
                        </div>
                        <div class="nearby-stops">
                            <strong>Nearby Bus Stops:</strong>
                            <ul>
                                ${nearbyStops.map(stop => `<li>${stop.name}</li>`).join('')}
                            </ul>
                        </div>
                    </div>`;
                    alert('Click on the bus route to check the bus that goes to your location');
                // Add markers for nearby stops
                nearbyStops.forEach(stop => {
                    const stopMarker = new maptilersdk.Marker()
                        .setLngLat([stop.lng, stop.lat])
                        .setPopup(new maptilersdk.Popup().setHTML(`
                            <div class="popup-content">
                                <strong>Bus Stop:</strong><br>
                                ${stop.name} 
                                <h3>(click on bus route to check the bus that goes to your location)</h3>
                            </div>
                        `))
                        .addTo(map);
                    busStopMarkers.push(stopMarker);
                });
                console.log('Checking if route stop exists in nearbyStops:', stopId);
                console.log('Nearby Stops:', nearbyStops);
                console.log('Nearby Routes:', nearbyRoutes);
                console.log('Bus routes available:', busRoutes);
                console.log('Bus stops available:', busStops);
                console.log("patternHTML output:", patternHTML);
            }
    } else {
        // Update existing map view and marker
        map.setCenter([longitude, latitude]);
        marker.setLngLat([longitude, latitude])
            .setPopup(new maptilersdk.Popup().setHTML(`
                <div class="popup-content">
                    <strong>Location:</strong><br>
                    ${address}
                    <strong>Bus Stop:</strong><br>
                    ${stop.name} 
                    <h3>(click on bus route to check the bus that goes to your location)</h3>
                </div>
            `));
            marker.addTo(map);
    }
}
let busStopMarkers = [];

function populateBusRoutes() {
    const select = document.getElementById('busRouteSelect');
    
    // Debug logging
    console.log('Populating bus routes:');
    console.log('Select element found:', !!select);
    console.log('Bus routes available:', busRoutes?.length || 0);
    
    if (!select) {
        console.error('Bus route select element not found');
        return;
    }
    
    if (!busRoutes || !Array.isArray(busRoutes) || busRoutes.length === 0) {
        console.error('No bus routes data available');
        select.innerHTML = '<option value="">No routes available</option>';
        return;
    }
    
    // Clear existing options
    select.innerHTML = '<option value="">Select a bus route</option>';
    
    try {
        // Sort routes by name/number
        const sortedRoutes = [...busRoutes].sort((a, b) => 
            a.name.localeCompare(b.name)
        );

        // Add bus routes to dropdown
        sortedRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = `${route.name} - ${route.description}`;
            select.appendChild(option);
        });

        // Add change event listener
        select.addEventListener('change', handleRouteSelection);
    } catch (error) {
        console.error('Error populating bus routes:', error);
    }
}
function handleRouteSelection(event) {
    const selectedRoute = event.target.value;
    if (selectedRoute) {
        showBusStopsOnMap(selectedRoute);
    } else {
        clearBusStopMarkers();
    }
}
function showBusStopsOnMap(routeId) {
    // Clear existing markers
    clearBusStopMarkers();
    
    // Filter stops for selected route
    const routeStops = window.busStops.filter(stop => {
        const route = window.busRoutes.find(r => r.id === routeId);
        return route && route.stops && route.stops.includes(stop.id);
    });

    // Add markers for each stop
    routeStops.forEach(stop => {
        const routesAtStop = window.busRoutes.filter(route => route.stops.includes(stop.id));
        //const nearStop = findNearbyStops(stop.lat, stop.lng, 1); // 1km radius

        // Find the next stop for each route that includes this stop
        const nextStops = routesAtStop.map(route => {
            const stopIndex = route.stops.indexOf(stop.id);
            if (stopIndex !== -1 && stopIndex < route.stops.length - 1) {
            const nextStopId = route.stops[stopIndex + 1];
            const nextStop = window.busStops.find(s => s.id === nextStopId);
            return nextStop ? nextStop.name : "Unknown Stop";
            }
            return "End of Route";
        });

        // Generate an HTML list of all routes stopping at this stop
        const routeListHTML = routesAtStop.map((route, index) => 
            `<li>${route.name} - Next Stop: ${nextStops[index]}</li>`
        ).join("");

        const marker = new maptilersdk.Marker()
            .setLngLat([stop.lng, stop.lat])
            .setPopup(new maptilersdk.Popup().setHTML(`
            <div class="popup-content">
                <strong>Bus Stop:</strong><br>
                ${stop.name}<br>
                <small>
                <strong>Routes stopping here:</strong>
                <ul>
                    ${routeListHTML}
                </ul>
                </small>
            </div>
            `))
            .addTo(map);
            
        busStopMarkers.push(marker);
    });

    // If we have stops, fit the map to show all of them
    if (routeStops.length > 0) {
        const bounds = new maptilersdk.LngLatBounds();
        routeStops.forEach(stop => {
            bounds.extend([stop.lng, stop.lat]);
        });
        map.fitBounds(bounds, { padding: 50 });
    }
}
function clearBusStopMarkers() {
    if (busStopMarkers) {
        busStopMarkers.forEach(marker => marker.remove());
        busStopMarkers = [];
    }
}

// Replace existing initializePage function
async function initializePage() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', populateBusRoutes);
    } else {
        populateBusRoutes();
    }
}

// Remove the separate DOMContentLoaded listener and getLocation call
// Instead use:
window.addEventListener('load', () => {
    initializePage();
    getLocation();
});

function darkMode() {
    var element = document.body;
    element.classList.toggle("dark-mode");
}
function getYear(){
    const year = document.getElementById("year");
    const date = new Date();
    const yearText = date.getFullYear();
    year.textContent = yearText;
    console.log(yearText);
}
getYear();
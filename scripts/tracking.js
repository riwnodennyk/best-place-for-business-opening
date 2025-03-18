function trackSliderChange(value) {
    gtag('event', 'pedestrian_filter_changed', {
        'slider_value': value,
        'interaction_type': 'adjusted_traffic_threshold'
    });
    console.log("Slider changed to:", value);
}

function trackCityChipSelected(value) {
    gtag('event', 'city_chip_selected', {
        'city': value
    });
    console.log("City Chip Selected:", value);
}

function trackMapPanned() {
    gtag('event', 'map_panned', {});
    console.log("Map Panned");
}

function trackMapZoomed(zoomValue) {
    gtag('event', 'map_zoomed', {
        'zoom': zoomValue
    });
    console.log("Map Zoomed:", zoomValue);
}

function trackLoadedBuildings(location, secondsPassed, howManyBuildings) {
    gtag('event', 'loaded_buildings', {
        'map_location': location.lat + ',' + location.lng,
        'seconds': secondsPassed,
        'how_many': howManyBuildings,
    });
    console.log("Loaded Buildings in:", location.lat, location.lng, " for seconds: ", secondsPassed,
        "and loaded ", howManyBuildings, "buildings"
    );

    if (howManyBuildings == 0) {
        gtag('event', 'no_loaded_buildings_error', {
            'map_location': location.lat + ',' + location.lng,
            'seconds': secondsPassed
        });
        console.warn("No buildings with sufficient business density found.");
    }
}


function trackClickedBuilding(location, pedestrians) {
    gtag('event', 'clicked_building', {
        'map_location': location.lat + ',' + location.lng,
        'pedestrians': pedestrians,
    });
    console.log("Building clicked at:", location.lat, location.lng, " with pedestrians: ", pedestrians);
}

function trackTooManyRequestsError() {
    gtag('event', 'too_many_requests_error');
}

function trackLocationDetected(data) {
    gtag('event', 'user_location_detected', {
        'user_location': data.latitude + ',' + data.longitude,
    });
    console.log("User Location Detected: ", data.latitude, data.longitude);
}

function trackNoUserLocationDetectedError(error) {
    gtag('event', 'no_user_location_detected_error', {
    });
    console.warn("Could not fetch user location, using default:", error);
}

function trackClickedMyLocation() {
    gtag('event', 'my_location_clicked'); 
    console.log("clicked my location");
}

export {
    trackSliderChange,
    trackCityChipSelected,
    trackClickedMyLocation,
    trackMapPanned,
    trackLocationDetected,
    trackNoUserLocationDetectedError,
    trackMapZoomed, trackTooManyRequestsError,
    trackLoadedBuildings, trackClickedBuilding
}
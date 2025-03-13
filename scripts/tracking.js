window.gtag = window.gtag || function() { console.warn("Google Analytics not loaded, event skipped."); };

function trackSliderChange(value) {
    gtag('event', 'pedestrian_filter_changed', {
        'slider_value': value, // Custom parameter in GA4
        'interaction_type': 'adjusted_traffic_threshold' // Custom event property
    });
    console.log("Slider changed to:", value); // Debugging in console
}


function trackCityChipSelected(value) {
    gtag('event', 'city_chip_selected', {
        'city': value
    });
    console.log("City Chip Selected:", value); // Debugging in console
}

export {trackSliderChange, trackCityChipSelected}
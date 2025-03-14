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

export { trackSliderChange, trackCityChipSelected, trackMapPanned, trackMapZoomed }
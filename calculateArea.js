// calculateArea.js

// Function to calculate the area of a polygon in square meters using the Shoelace Theorem
function calculateArea(polygon) {
    let latLngs = polygon.getLatLngs()[0];
    let area = 0;

    for (let i = 0; i < latLngs.length; i++) {
        let j = (i + 1) % latLngs.length; // next point, wrapping around
        let lat1 = latLngs[i].lat;
        let lon1 = latLngs[i].lng;
        let lat2 = latLngs[j].lat;
        let lon2 = latLngs[j].lng;

        area += lon1 * lat2 - lon1 * lat1 - lon2 * lat1 + lon2 * lat2;
    }

    area = Math.abs(area) / 2;

    // Convert the area from degrees² to square meters (approximate conversion)
    const latLngAreaFactor = 111319; // 1 degree of latitude is approx 111.319 km
    let areaInSquareMeters = area * latLngAreaFactor * latLngAreaFactor;

    return areaInSquareMeters;
}

export { calculateArea };

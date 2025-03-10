// businessDensity.js
const TOP_DENSITY = 1/200;  // less than 1/200 // approximate 30 people passing
const MID_DENSITY = 1/400;  // 1/200 to 1/400 // approximate 20 people passing
const LOW_DENSITY = 1/500; // 1/300 to 1/500 // approximate 15 people passing

// Function to calculate business density (businesses per square meter)
function calculateBusinessDensity(buildingArea, businessesInBuilding) {
    return buildingArea > 0 ? businessesInBuilding / buildingArea : 0;
}

// Function to get the color based on business density
function getColorByDensity(density) {
    return density > TOP_DENSITY ? "#811963" : density > MID_DENSITY ? '#cd3ea4' : '#f497d9';
}

// Function to process building and business data, calculate density, and determine if the building should be shown on the map
function processBuildingData(building, businessesResponse, calculateArea, buildingsLayer) {
    let coords = building.geometry.map(pt => [pt.lat, pt.lon]);
    let polygon = L.polygon(coords);

    // Calculate the area of the building in square meters
    let buildingArea = calculateArea(polygon);

    // Count businesses inside the building's bounds
    let businessesInBuilding = businessesResponse.elements.filter(business => {
        return polygon.getBounds().contains([business.lat, business.lon]);
    }).length;

    // Calculate business density
    let businessDensity = calculateBusinessDensity(buildingArea, businessesInBuilding);

    if (businessDensity >= LOW_DENSITY) { // Set your own threshold for density here
        const fractionDenominator = (1 / businessDensity).toFixed(0); // Convert density to fraction form
        const fraction = `1/${fractionDenominator}`; // Format it as "1/200"

        // Set the fillColor based on density
        var color = getColorByDensity(businessDensity)
        polygon.setStyle({
            fillColor: color,
            fillOpacity: 1,
            color: color,
            opacity: 1,
            lineJoin: "round",
        });
        console.log("color set ", color);
        polygon.bindPopup(`Businesses per m²: ${fraction}`);
        buildingsLayer.addLayer(polygon);

        return true;
    }

    return false;
}

export { processBuildingData, calculateBusinessDensity, getColorByDensity };

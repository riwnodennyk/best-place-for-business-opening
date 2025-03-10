// businessDensity.js
const AT_25_DENSITY = 25;
const AT_15_DENSITY = 15;
const LOW_DENSITY = 1;

// Function to calculate business density (businesses per square meter)
function calculateBusinessDensity(buildingArea, businessesInBuilding) {
    return buildingArea > 0 ? businessesInBuilding / buildingArea : 0;
}

// Function to get the color based on business density
function getColorByPeoplePassingBy(people) {
    return people > AT_25_DENSITY ? "#811963" : people > AT_15_DENSITY ? '#cd3ea4' : '#f497d9';
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

    // Count businesses within a 100-meter radius
    let businessesNearby = businessesResponse.elements.filter(business => {
        let distance = polygon.getBounds().getCenter().distanceTo([business.lat, business.lon]);
        return distance <= 100;
    }).length;

    let businessesWithin200Meters = businessesResponse.elements.filter(business => {
        let distance = polygon.getBounds().getCenter().distanceTo([business.lat, business.lon]);
        return distance <= 200;
    }).length;

    // Main Formula 
    var coefBuildingBusinessDensity = 0.6;
    var coef100meterDensity = 1;
    var coef200meterDensity = 1;

    var peoplePassingBy = (businessDensity * 2000 * coefBuildingBusinessDensity
         + businessesNearby  *coef100meterDensity
        + businessesWithin200Meters* coef200meterDensity) * 0.15 * (3/(coefBuildingBusinessDensity+
            coef100meterDensity+coef200meterDensity
        ));

    if (peoplePassingBy >= LOW_DENSITY) { // Set your own threshold for density here
        const fractionDenominator = (1 / businessDensity).toFixed(0); // Convert density to fraction form
        const fraction = `1/${fractionDenominator}`; // Format it as "1/200"

        var color = getColorByPeoplePassingBy(peoplePassingBy);
        polygon.setStyle({
            fillColor: color,
            fillOpacity: 1,
            color: color,
            opacity: 1,
            lineJoin: "round",
        });

        polygon.bindPopup(
            `People passing by: ${peoplePassingBy} <br>
            Businesses per m²: ${fraction} <br>
             Businesses within 100m: ${businessesNearby} <br>
             Businesses within 200m: ${businessesWithin200Meters}`
        );
        
        buildingsLayer.addLayer(polygon);
        return true;
    }

    return false;
}

export { processBuildingData, calculateBusinessDensity, getColorByPeoplePassingBy };

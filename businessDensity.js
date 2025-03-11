const AT_75_DENSITY = 55;  // Extreme foot traffic
const AT_50_DENSITY = 40;  // Very high foot traffic
const AT_35_DENSITY = 30;  // High foot traffic
const AT_25_DENSITY = 20;  // Medium-high traffic
const AT_15_DENSITY = 10;  // Moderate traffic
const LOW_DENSITY = 1;     // Low traffic

// Function to calculate business density (businesses per square meter)
function calculateBusinessDensity(buildingArea, businessesInBuilding) {
    return buildingArea > 0 ? businessesInBuilding / buildingArea : 0;
}

// Function to get the color based on people passing by
function getColorByPeoplePassingBy(people) {
    return people > AT_75_DENSITY ? "#1a0510" :  // Almost black (Extreme traffic)
           people > AT_50_DENSITY ? "#30071e" :  // Very dark purple (Very high traffic)
           people > AT_35_DENSITY ? "#4a0b30" :  // Deep plum (High traffic)
           people > AT_25_DENSITY ? "#811963" :  // Strong purple (Medium-high traffic)
           people > AT_15_DENSITY ? "#cd3ea4" :  // Lighter magenta (Moderate traffic)
                                    "#f497d9";   // Soft pink (Low traffic)
}
// Function to get the building's address from OSM tags
function getBuildingAddress(building) {
    if (!building.tags) return null;

    const street = building.tags["addr:street"] || "";
    if (!street) return null;

    const housenumber = building.tags["addr:housenumber"] || "";
    let address = `${street}, ${housenumber}`.trim();

    const postcode = building.tags["addr:postcode"] || "";
    if (postcode) address += `<br/>${postcode}`;

    return address || null;
}


// Function to process building and business data, calculate density, and determine if the building should be shown on the map
async function processBuildingData(building, businessesResponse, calculateArea, buildingsLayer) {
    const coords = building.geometry.map(pt => [pt.lat, pt.lon]);
    const polygon = L.polygon(coords);

    // Calculate the area of the building in square meters
    const buildingArea = calculateArea(polygon);
    
    // Count businesses inside the building bounds
    const businessesInBuilding = businessesResponse.elements.filter(business => 
        polygon.getBounds().contains([business.lat, business.lon])
    ).length;

    // Calculate business density
    const businessDensity = calculateBusinessDensity(buildingArea, businessesInBuilding);
    
    // Get center of the polygon
    const polygonCenter = polygon.getBounds().getCenter();

    let businessesWithin100m = 0;
    let businessesWithin200m = 0;
    let businessesWithin300m = 0;

    businessesResponse.elements.forEach(business => {
        const distance = polygonCenter.distanceTo([business.lat, business.lon]);
        if (distance <= 90) {
            businessesWithin100m++;
        }
        if (distance <= 180) {
            businessesWithin200m++;
        }
        if (distance <= 300) {
            businessesWithin300m++;
        }
    });

    // Define coefficients for weighting each density factor
    const coefBuildingDensity = 0.5;
    const coef100mDensity = 1.5;
    const coef200mDensity = 1;
    const coef300mDensity = 0.5;
    
    // Calculate people passing by using a weighted model
    const densityWeightSum = coefBuildingDensity + coef100mDensity + coef200mDensity + coef300mDensity;
    let peoplePassingBy = (
        (businessDensity * 2000 * coefBuildingDensity) + 
        (businessesWithin100m * coef100mDensity) + 
        (businessesWithin200m * coef200mDensity) + 
        (businessesWithin300m * coef300mDensity)
    ) * 0.6 / densityWeightSum;

    peoplePassingBy = Math.round(peoplePassingBy); // Round to avoid excessive decimals

    if (peoplePassingBy >= LOW_DENSITY) {
        const fractionDenominator = businessDensity > 0 ? (1 / businessDensity).toFixed(0) : "N/A";
        const fraction = businessDensity > 0 ? `1/${fractionDenominator}` : "N/A"; // Avoid division by zero

        const color = getColorByPeoplePassingBy(peoplePassingBy);
        polygon.setStyle({
            fillColor: color,
            fillOpacity: 1,
            color: color,
            opacity: 1,
            lineJoin: "round",
        });

        // Fetch the address
        const address = await getBuildingAddress(building);

        polygon.bindPopup(`
            <b>People passing by:</b> ${peoplePassingBy} <br>
             ${address ? `${address} <br>` : ""}
        `);
        // <b>Businesses per m²:</b> ${fraction} <br>
        // <b>Businesses within 100m:</b> ${businessesWithin100m} <br>
        // <b>Businesses within 200m:</b> ${businessesWithin200m}

        buildingsLayer.addLayer(polygon);
        return true;
    }

    return false;
}

export { processBuildingData, calculateBusinessDensity, getColorByPeoplePassingBy };

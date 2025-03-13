import { translate } from './foot_traffic_translation.js';

const AT_75_DENSITY = 55;
const AT_50_DENSITY = 40;
const AT_35_DENSITY = 30;
const AT_25_DENSITY = 20;
const AT_15_DENSITY = 10;


let minThreshold = 1;
let buildingsLayer;
let peoplePassingByTranslated = translate("peoplePassingBy");

function calculateBusinessDensity(buildingArea, businessesInBuilding) {
    return buildingArea > 0 ? businessesInBuilding / buildingArea : 0;
}

function getColorByPeoplePassingBy(people) {
    return people > AT_75_DENSITY ? "#1a0510" :
        people > AT_50_DENSITY ? "#30071e" :
            people > AT_35_DENSITY ? "#4a0b30" :
                people > AT_25_DENSITY ? "#811963" :
                    people > AT_15_DENSITY ? "#cd3ea4" :
                        "#f497d9";
}

async function getBuildingAddress(building) {
    if (!building.tags) return null;
    const street = building.tags["addr:street"] || "";
    if (!street) return null;
    const housenumber = building.tags["addr:housenumber"] || "";
    let address = `${street}, ${housenumber}`.trim();
    const postcode = building.tags["addr:postcode"] || "";
    if (postcode) address += `<br/>${postcode}`;
    return address || null;
}

async function processBuildingData(building, businessesResponse, calculateArea, buildingsLayerInstance) {
    buildingsLayer = buildingsLayerInstance;
    const coords = building.geometry.map(pt => [pt.lat, pt.lon]);
    const polygon = L.polygon(coords);
    const buildingArea = calculateArea(polygon);
    const businessesInBuilding = businessesResponse.elements.filter(business =>
        polygon.getBounds().contains([business.lat, business.lon])
    ).length;
    const businessDensity = calculateBusinessDensity(buildingArea, businessesInBuilding);
    const polygonCenter = polygon.getBounds().getCenter();
    let businessesWithin100m = 0;
    let businessesWithin200m = 0;
    let businessesWithin300m = 0;

    businessesResponse.elements.forEach(business => {
        const distance = polygonCenter.distanceTo([business.lat, business.lon]);
        if (distance <= 90) businessesWithin100m++;
        if (distance <= 180) businessesWithin200m++;
        if (distance <= 300) businessesWithin300m++;
    });

    const coefBuildingDensity = 0.5;
    const coef100mDensity = 1.5;
    const coef200mDensity = 1;
    const coef300mDensity = 0.5;
    const densityWeightSum = coefBuildingDensity + coef100mDensity + coef200mDensity + coef300mDensity;
    let peoplePassingBy = (
        (businessDensity * 2000 * coefBuildingDensity) +
        (businessesWithin100m * coef100mDensity) +
        (businessesWithin200m * coef200mDensity) +
        (businessesWithin300m * coef300mDensity)
    ) * 0.6 / densityWeightSum;
    peoplePassingBy = Math.round(peoplePassingBy);

    polygon.feature = { properties: { peoplePassingBy } };

    if (peoplePassingBy >= 1) {
        const color = getColorByPeoplePassingBy(peoplePassingBy);
        polygon.setStyle({
            fillColor: color,
            fillOpacity: 1,
            color: color,
            opacity: 1,
            lineJoin: "round",
        });

        const address = await getBuildingAddress(building);
        polygon.bindPopup(`
            <b>${peoplePassingByTranslated}:</b> ${peoplePassingBy} <br>
             ${address ? `${address} <br>` : ""}
        `);
        buildingsLayer.addLayer(polygon);
        return true;
    }
    return false;
}

function updateMapVisibility() {
    buildingsLayer?.eachLayer(layer => {
        if (layer.feature.properties.peoplePassingBy < minThreshold) {
            layer.setStyle({ fillOpacity: 0, opacity: 0 });
        } else {
            layer.setStyle({ fillOpacity: 1, opacity: 1 });
        }
    });
}

function trackSliderChange(value) {
    gtag('event', 'slider_change', {
        'event_category': 'User Interaction',
        'event_label': 'Traffic Slider',
        'value': value
    });
    console.log("Slider changed to:", value); // Debugging in console
}

document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById("traffic-slider");
    const sliderValue = document.getElementById("slider-value");
    slider.addEventListener("input", (event) => {
        minThreshold = parseInt(event.target.value);
        console.log("threshold ", minThreshold);
        sliderValue.textContent = minThreshold;
        updateMapVisibility();
    });
    slider.addEventListener("change", (event) =>{
        let finalSliderValue = event.target.value;
        trackSliderChange(finalSliderValue);
    });
});

export { processBuildingData, calculateBusinessDensity, getColorByPeoplePassingBy, updateMapVisibility };

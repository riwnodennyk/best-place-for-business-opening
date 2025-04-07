import { calculateArea } from './calculateArea.js';
import { processBuildingData, updateMapVisibility } from './businessDensity.js';
import { translate } from './foot_traffic_translation.js';
import {
    trackMapPanned, trackTooManyRequestsError, trackMapZoomed, trackCityChipSelected,
    trackNoUserLocationDetectedError, trackLocationDetected, trackClickedMyLocation,
    trackLoadedBuildings, trackEligibleToBuy} from './scripts/tracking.js';
import { setupPurchasePromo } from './scripts/activeUserPurchasePromo.js';

// Global variables
export let areYouHappy = document.getElementById("are-you-happy-block");
export let surveyContainer;
let map, buildingsLayer, lastBounds = null, currentRequestController = null;
let locateControl = null;
let loadingIndicator = document.getElementById('loading');
let loadingStartTime = null;
let pageLoadTime = null;
let panCount = 0;

// Initialize happyBlockShown from localStorage
let happyBlockShown = localStorage.getItem('happyBlockShown') === 'true';

/**
 * Utility function to debounce a function call.
 */
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Fetch the user's location using an external API.
 */
async function getUserLocation() {
// return {lat: 50.177,lon:  30.318}; // Vasylkiv
    // return {lat: 50.079,lon:  29.909}; // Fastiv
    // return {lat: 50.398,lon: 30.619}; // osokorky
    // return {lat: 50.398, lon: 30.630}; // pozniaky
    // return {lat: 50.403,lon:  30.650}; // kharkivska
    // return {lat: 50.398,lon:  30.603}; // Slavutych
    // return {lat: 50.450,lon:  30.510}; // Zoloti vorota
    // return {lat: 50.440, lon: 30.520}; // Besarabka
    // return {lat: 52.383, lon: 4.632}; // Haarlem
    // return {lat: 51.508, lon: -0.128}; // london
    // return {lat: 40.7552275, lon: -73.9787606}; // new york

    try {
        const response = await fetch("https://geolocation-db.com/json/");
        const data = await response.json();
        trackLocationDetected(data);
        return { lat: data.latitude, lon: data.longitude };
    } catch (error) {
        trackNoUserLocationDetectedError(error);
        return { lat: 51.508, lon: -0.128 }; // Fallback to London
    }
}

/**
 * Initialize the map and its components.
 */
async function initializeMap() {
    pageLoadTime = performance.now();
    const userLocation = await getUserLocation();

    map = L.map('map', {
        center: [userLocation.lat, userLocation.lon],
        zoom: 15,
        minZoom: 15,
        maxZoom: 18
    });

    setupTileLayer();
    setupLocateControl();
    setupEventListeners();

    buildingsLayer = L.geoJSON(null).addTo(map);
    map.whenReady(() => fetchData(map.getBounds()));
}

/**
 * Setup the map's tile layer.
 */
function setupTileLayer() {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

/**
 * Setup the locate control for the map.
 */
function setupLocateControl() {
    locateControl = L.control.locate({
        position: 'topright',
        setView: 'always',
        flyTo: true,
        drawCircle: true,
        keepCurrentZoomLevel: false,
        showPopup: false,
        locateOptions: {
            enableHighAccuracy: false,
            timeout: 6000,
            maxZoom: 15
        },
        icon: 'fa fa-crosshairs'
    }).addTo(map);
}

/**
 * Setup event listeners for the map.
 */
function setupEventListeners() {
    map.on("movestart", onMapMoveStart);
    map.on("moveend", onMapMoveEnd);
    map.on('zoomend', () => trackMapZoomed(map.getZoom()));
    map.on('moveend', handleMapPan);
}

/**
 * Handle map panning events.
 */
function handleMapPan() {
    trackMapPanned();
    if (!happyBlockShown) {
        panCount++;
        checkHappyBlockCondition();
    }
}

/**
 * Check if the "Are You Happy" block should be displayed.
 */
function checkHappyBlockCondition() {
    const timeSpent = (performance.now() - pageLoadTime) / 1000;

    if (timeSpent >= 15 && panCount >= 3 && !happyBlockShown) {
        if (areYouHappy) {
            areYouHappy.style.display = "block";
        }
        happyBlockShown = true;

        // Store happyBlockShown in localStorage
        localStorage.setItem('happyBlockShown', 'true');

        trackEligibleToBuy();
    }
}

/**
 * Fetch data for the current map bounds.
 */
async function fetchData(bounds, retryCount = 0) {
    if (currentRequestController) {
        currentRequestController.abort();
    }
    currentRequestController = new AbortController();
    const { signal } = currentRequestController;

    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    console.log("Fetching data for bbox:", bbox);

    try {
        loadingIndicator.style.display = 'block';
        const [buildingsResponse, businessesResponse] = await fetchOverpassData(bbox, signal, bounds, retryCount);

        processFetchedData(buildingsResponse, businessesResponse);
    } catch (error) {
        handleFetchError(error, bounds, retryCount);
    }
}

/**
 * Fetch data from the Overpass API.
 */
async function fetchOverpassData(bbox, signal, bounds, retryCount) {
    const buildingsQuery = `
        [out:json][timeout:25];
        way["building"](${bbox});
        out body geom;
    `;
    const businessesQuery = `
        [out:json][timeout:25];
        (
            node["shop"](${bbox});
            node["office"](${bbox});
            node["tourism"~"museum|attraction|gallery"](${bbox});
            node["leisure"~"park|garden"](${bbox});
            node[railway~"station|subway_entrance"](${bbox});
            node[amenity~"restaurant|cafe|fast_food|pub|bar|marketplace|school|university|cinema|theatre|pharmacy|supermarket|mall|bank|bureau_de_change"](${bbox});
        );
        out body;
    `;

    const buildingsUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(buildingsQuery)}`;
    const businessesUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(businessesQuery)}`;

    return Promise.all([
        fetch(buildingsUrl, { signal }).then(res => handleResponse(res, bounds, retryCount)),
        fetch(businessesUrl, { signal }).then(res => handleResponse(res, bounds, retryCount))
    ]);
}

/**
 * Process fetched data and update the map.
 */
async function processFetchedData(buildingsResponse, businessesResponse) {
    buildingsLayer.clearLayers();
    let foundBuildings = 0;

    for (const building of buildingsResponse.elements) {
        if (building.type === "way" && building.geometry) {
            const isBuildingProcessed = await processBuildingData(building, businessesResponse, calculateArea, buildingsLayer);
            if (isBuildingProcessed) {
                foundBuildings++;
            }
        }
    }

    updateMapVisibility();
    trackLoadedBuildings(map.getCenter(), calculateLoadingDuration(), foundBuildings);
    loadingIndicator.style.display = 'none';
}

/**
 * Calculate the loading duration for data fetching.
 */
function calculateLoadingDuration() {
    return Math.round((performance.now() - loadingStartTime) / 1000);
}

/**
 * Handle errors during data fetching.
 */
function handleFetchError(error, bounds, retryCount) {
    if (error.name === "AbortError") {
        console.log("Request aborted successfully.");
        return;
    }
    console.error("Error fetching data:", error);
}

async function handleResponse(response, bounds, retryCount) {
    if (response.status === 429) {
        await handleTooManyRequests(bounds, retryCount);
    }
    return response.json();
}

async function handleTooManyRequests(bounds, retryCount) {
    const waitTime = Math.pow(2, retryCount) * 1000;
    console.warn(`429 Too Many Requests - Retrying in ${waitTime / 1000} seconds...`);
    trackTooManyRequestsError();
    await new Promise(resolve => setTimeout(resolve, waitTime));

    if (retryCount < 5) {
        return fetchData(bounds, retryCount + 1);
    } else {
        console.error("Maximum retry limit reached. Giving up.");
        throw new Error("Too many requests. Please try again later.");
    }
}

const debouncedFetchData = debounce(fetchData, 1000);

function onMapMoveStart() {
    loadingIndicator.style.display = 'block';
    if (currentRequestController) {
        currentRequestController.abort();
        currentRequestController = null;
    }
}

/**
 * Handle the end of a map move event.
 */
function onMapMoveEnd() {
    const bounds = map.getBounds();
    const currentBoundsString = bounds.toBBoxString();

    if (lastBounds !== currentBoundsString) {
        loadingStartTime = performance.now();
        lastBounds = currentBoundsString;
        if (map.getZoom() >= 15) {
            debouncedFetchData(bounds);
        } else {
            loadingIndicator.style.display = 'block';
        }
    }
}

/**
 * Pan the map to a specific city.
 */
function panToCity(lat, lon) {
    if (map) {
        map.setView([lat, lon], 15);
    }
}

/**
 * Setup UI interactions for the page.
 */
function setupUIInteractions() {
    areYouHappy = document.getElementById("are-you-happy-block");
    const titleBlock = document.getElementById("title-block");
    const mapElement = document.getElementById("map");

    areYouHappy.style.display = "none";
    surveyContainer = document.getElementById("survey-block");
    surveyContainer.style.display = "none";

    function hideTitleBlock() {
        titleBlock.classList.add("hide-title");
        setTimeout(() => {
            titleBlock.style.display = "none";
        }, 500);
    }

    mapElement.addEventListener("click", hideTitleBlock, { once: true });
    mapElement.addEventListener("touchstart", hideTitleBlock, { once: true });
    mapElement.addEventListener("wheel", hideTitleBlock, { once: true });
    mapElement.addEventListener("mousedown", hideTitleBlock, { once: true });

    setupCityChips();
    const myLocationChip = document.querySelector('.my-loction-chip');
    myLocationChip.addEventListener("click", () => myLocationChip.classList.remove('pulsating'));

    setupPurchasePromo();
    setupTranslation();
}

/**
 * Setup translations for the page.
 */
function setupTranslation() {
    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.dataset.translate;
        element.textContent = translate(key);
    });
}

/**
 * Setup city chips for quick navigation.
 */
function setupCityChips() {
    document.querySelector('.my-loction-chip').addEventListener('click', () => {
        trackClickedMyLocation();
        locateControl.start();
    });

    document.querySelectorAll(".city-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const lat = parseFloat(chip.dataset.lat);
            const lon = parseFloat(chip.dataset.lon);
            panToCity(lat, lon);
            trackCityChipSelected(chip.dataset.translate);
        });
    });

    setupChipScrolling();
}

/**
 * Setup scrolling for city chips.
 */
function setupChipScrolling() {
    const chipsContainer = document.getElementById("city-chips-container");
    const scrollLeftBtn = document.getElementById("scroll-left");
    const scrollRightBtn = document.getElementById("scroll-right");

    function checkScrollButtons() {
        scrollLeftBtn.style.opacity = chipsContainer.scrollLeft <= 0 ? "0" : "1";
        scrollLeftBtn.style.pointerEvents = chipsContainer.scrollLeft <= 0 ? "none" : "auto";

        scrollRightBtn.style.opacity = chipsContainer.scrollLeft + chipsContainer.clientWidth >= chipsContainer.scrollWidth ? "0" : "1";
        scrollRightBtn.style.pointerEvents = chipsContainer.scrollLeft + chipsContainer.clientWidth >= chipsContainer.scrollWidth ? "none" : "auto";
    }

    scrollLeftBtn.addEventListener("click", () => chipsContainer.scrollBy({ left: -150, behavior: "smooth" }));
    scrollRightBtn.addEventListener("click", () => chipsContainer.scrollBy({ left: 150, behavior: "smooth" }));

    chipsContainer.addEventListener("scroll", checkScrollButtons);
    checkScrollButtons();
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    setupUIInteractions();
    initializeMap();
});
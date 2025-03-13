
import { calculateArea } from './calculateArea.js';
import { processBuildingData } from './businessDensity.js';
import { translate } from './foot_traffic_translation.js';

let map, buildingsLayer, lastBounds = null, currentRequestController = null;
let loadingIndicator = document.getElementById('loading');

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}
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

        console.log("User Location: ", data.latitude, data.longitude);
        return { lat: data.latitude, lon: data.longitude };
    } catch (error) {
        console.warn("Could not fetch user location, using default:", error);
        return { lat: 51.508, lon: -0.128 }; // fallback
    }
}

async function initializeMap() {
    const userLocation = await getUserLocation();

    map = L.map('map', {
        center: [userLocation.lat, userLocation.lon],
        zoom: 16,
        minZoom: 15,
        maxZoom: 18
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.locate({
        position: 'topright',
        setView: 'always',
        flyTo: true,
        drawCircle: true,
        keepCurrentZoomLevel: false,
        showPopup: false,
        locateOptions: {
            enableHighAccuracy: true
        },
        icon: 'fa fa-crosshairs' // Explicitly define the icon

    }).addTo(map);

    buildingsLayer = L.geoJSON(null).addTo(map);
    map.whenReady(() => fetchData(map.getBounds()));

    map.on("movestart", onMapMoveStart);
    map.on("moveend", onMapMoveEnd);
}
async function fetchData(bounds, retryCount = 0) {
    if (currentRequestController) {
        currentRequestController.abort();
    }
    currentRequestController = new AbortController();
    const { signal } = currentRequestController;

    let bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    console.log("Fetching data for bbox:", bbox);

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

    try {
        loadingIndicator.style.display = 'block';

        const [buildingsResponse, businessesResponse] = await Promise.all([
            fetch(buildingsUrl, { signal }).then(res => handleResponse(res, bounds, retryCount)),
            fetch(businessesUrl, { signal }).then(res => handleResponse(res, bounds, retryCount))
        ]);

        buildingsLayer.clearLayers();
        let foundBuildings = false;

        buildingsResponse.elements.forEach(building => {
            if (building.type === "way" && building.geometry) {
                const isBuildingProcessed = processBuildingData(building, businessesResponse, calculateArea, buildingsLayer);
                if (isBuildingProcessed) foundBuildings = true;
            }
        });

        if (!foundBuildings) {
            console.warn("No buildings with sufficient business density found.");
        }
        loadingIndicator.style.display = 'none';
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Request aborted successfully.");
            return;
        }
        console.error("Error fetching data:", error);
    }
}

async function handleResponse(response, bounds, retryCount) {
    if (response.status === 429) {
        let waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2^retryCount seconds
        console.warn(`429 Too Many Requests - Retrying in ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        if (retryCount < 5) { // Limit retries to prevent infinite loops
            return fetchData(bounds, retryCount + 1);
        } else {
            console.error("Maximum retry limit reached. Giving up.");
            throw new Error("Too many requests. Please try again later.");
        }
    }
    return response.json();
}


const debouncedFetchData = debounce(fetchData, 3000); // Increase debounce to 3 sec

function onMapMoveStart() {
    loadingIndicator.style.display = 'block';
    if (currentRequestController) {
        currentRequestController.abort();
        currentRequestController = null; // Reset the controller to avoid conflicts
    }
}

function onMapMoveEnd() {
    const bounds = map.getBounds();
    const currentBoundsString = bounds.toBBoxString();

    if (lastBounds !== currentBoundsString) {
        lastBounds = currentBoundsString;
        debouncedFetchData(bounds);
    }
}

initializeMap(); // Start the map initialization


function panToCity(lat, lon) {
    if (map) {
        map.setView([lat, lon], 16);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let titleBlock = document.getElementById("title-block");
    let mapElement = document.getElementById("map");

    function hideTitleBlock() {
        titleBlock.classList.add("hide-title");
        setTimeout(() => {
            titleBlock.style.display = "none";
        }, 500); // Matches fade-out duration
    }

    mapElement.addEventListener("click", hideTitleBlock, { once: true });
    mapElement.addEventListener("touchstart", hideTitleBlock, { once: true });
    mapElement.addEventListener("wheel", hideTitleBlock, { once: true });
    mapElement.addEventListener("mousedown", hideTitleBlock, { once: true });


    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.dataset.translate;

        element.textContent = translate(key);

    });

    document.querySelectorAll(".city-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const lat = parseFloat(chip.dataset.lat);
            const lon = parseFloat(chip.dataset.lon);
            panToCity(lat, lon);
        });
    });


    const chipsContainer = document.getElementById("city-chips-container");
    const scrollLeftBtn = document.getElementById("scroll-left");
    const scrollRightBtn = document.getElementById("scroll-right");


    function checkScrollButtons() {
         // Check if scrolled to the leftmost position
         if (chipsContainer.scrollLeft <= 0) {
            scrollLeftBtn.style.opacity = "0"; // Hide left button
            scrollLeftBtn.style.pointerEvents = "none"; // Disable interactions
        } else {
            scrollLeftBtn.style.opacity = "1"; // Show left button
            scrollLeftBtn.style.pointerEvents = "auto"; // Enable interactions
        }

        // Check if scrolled to the rightmost position
        if (chipsContainer.scrollLeft + chipsContainer.clientWidth >= chipsContainer.scrollWidth) {
            scrollRightBtn.style.opacity = "0"; // Hide right button
            scrollRightBtn.style.pointerEvents = "none"; // Disable interactions
        } else {
            scrollRightBtn.style.opacity = "1"; // Show right button
            scrollRightBtn.style.pointerEvents = "auto"; // Enable interactions
        }
    }

    // Scroll buttons functionality
    scrollLeftBtn.addEventListener("click", () => {
        chipsContainer.scrollBy({ left: -150, behavior: "smooth" });
    });

    scrollRightBtn.addEventListener("click", () => {
        chipsContainer.scrollBy({ left: 150, behavior: "smooth" });
    });

    // Listen for scroll event and update button visibility
    chipsContainer.addEventListener("scroll", checkScrollButtons);

    // Run once on page load to check initial state
    checkScrollButtons();
});
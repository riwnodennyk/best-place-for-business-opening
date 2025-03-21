import { cities, generalUI, pageMetadata, trafficSlider, headerContent,loadingStates } from "./translations/index.js";

const translations = Object.fromEntries(
    Object.keys(pageMetadata).map(lang => [lang, {
        ...cities[lang],
        ...trafficSlider[lang],
        ...pageMetadata[lang],
        ...headerContent[lang],
        ...loadingStates[lang],
        ...generalUI[lang]
    }])
);

function translate(key) {
    return translation[key] || translations["en"][key];
}

const userLang = navigator.language.substring(0, 2);
let translation = translations[userLang] || translations["en"];

document.querySelector('meta[name="description"]').setAttribute("content", translate("metaDescription"));
document.querySelector('meta[name="keywords"]').setAttribute("content", translate("keywords"));
document.querySelector('meta[property="og:title"]').setAttribute("content", translate("og_title"));
document.querySelector('meta[property="og:description"]').setAttribute("content", translate("og_description"));
document.querySelector('meta[name="twitter:title"]').setAttribute("content", translate("twitter_title"));
document.querySelector('meta[name="twitter:description"]').setAttribute("content", translate("twitter_description"));


if (document.getElementById("map")) document.getElementById("map").setAttribute("data-placeholder", translate("mapPlaceholder"));

export { translate }
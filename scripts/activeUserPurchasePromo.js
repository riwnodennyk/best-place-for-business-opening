import { areYouHappy, surveyContainer } from '../map-script.js';
import { trackBuyButtonClicked, trackSurveyveSent } from './tracking.js';

/**
 * Setup survey interactions.
 */
export function setupPurchasePromo() {
    const buyBtn = document.getElementById("buy-button");
    buyBtn.addEventListener("click", () => {
        trackBuyButtonClicked();
        areYouHappy.style.display = "none";
    });

    const notInterestedBtn = document.getElementById("not-interested-button");
    notInterestedBtn.addEventListener("click", () => {
        areYouHappy.style.display = "none";
        surveyContainer.style.display = "block";
    });

    const submitBtn = document.getElementById("submit-feedback-button");
    submitBtn.addEventListener("click", () => {
        const feedback = document.getElementById("improvement-feedback").value.trim();
        trackSurveyveSent(feedback);
        surveyContainer.style.display = "none";
    });

    document.getElementById("close-survey-button").addEventListener("click", () => {
        const feedback = document.getElementById("improvement-feedback").value.trim();
        trackSurveyveSent(feedback);
        surveyContainer.style.display = "none";
    });

    const textarea = document.getElementById('improvement-feedback');
    const placeholder = document.querySelector('.textarea-placeholder');

    // Initial check
    placeholder.style.opacity = textarea.value.length > 0 ? '0' : '1';

    // Update on input
    textarea.addEventListener('input', () => {
        placeholder.style.opacity = textarea.value.length > 0 ? '0' : '1';
    });
}

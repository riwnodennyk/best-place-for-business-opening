import { areYouHappy, surveyContainer } from '../map-script.js';
import { trackBuyButtonClicked, trackSurveyveSent } from './tracking.js';

/**
 * Setup survey interactions.
 */
export function setupPurchasePromo() {
    const buyBtn = document.getElementById("buy-button");
    buyBtn.addEventListener("click", async () => {
        trackBuyButtonClicked();
        areYouHappy.style.display = "none";
        try {
          const response = await fetch('https://backend-best-place-for-business-opening.vercel.app/create-monobank-invoice', {
            method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.pageUrl) {
              window.location.href = data.pageUrl; // Redirect to Monobank checkout
            } else {
              alert('Failed to create payment link: ' + (data.error || 'Unknown error'));
            }
          } catch (error) {
            alert('Error connecting to server: ' + error.message);
          }
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

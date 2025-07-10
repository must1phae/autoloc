// frontend/js/car-details.js
document.addEventListener('DOMContentLoaded', () => {
    const detailsContainer = document.getElementById('car-details-container');
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Très utile : pour lire les paramètres dans l'URL
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        detailsContainer.innerHTML = '<h1>Erreur : ID de voiture manquant.</h1>';
        return;
    }

    async function fetchDetails() {
        // ... ici, vous ferez un fetch à l'API avec l'action 'getCarDetails' et le carId ...
        // ... puis vous afficherez les détails dans le detailsContainer ...
    }

    fetchDetails();
});
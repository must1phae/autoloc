// File: frontend/js/car-details.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // --- Code existant pour la liste des voitures ---
    const carListContainer = document.getElementById('car-list');
    if (carListContainer) {
        // ... votre fonction fetchAndDisplayCars()
    }

    // --- NOUVEAU CODE POUR LA PAGE DE DÉTAILS ---
    const carDetailsContainer = document.getElementById('car-details-container');
    if (carDetailsContainer) {
        // 1. Récupérer l'ID de la voiture depuis l'URL
        const params = new URLSearchParams(window.location.search);
        const carId = params.get('id');

        if (carId) {
            // 2. Appeler l'API pour obtenir les détails
            fetch(`${API_URL}?action=getCarDetails&id=${carId}`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        const car = result.data;
                        // 3. Afficher les détails dans le HTML
                        carDetailsContainer.innerHTML = `
                            <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}" style="max-width: 500px;">
                            <h2 id="car-title">${car.marque} ${car.modele} (${car.annee})</h2>
                            <p><strong>Type:</strong> ${car.type}</p>
                            <p><strong>Prix:</strong> <span id="car-price">${car.prix_par_jour}</span> €/jour</p>
                            <p><strong>Statut:</strong> ${car.statut}</p>
                            <a href="reservation-form.html?id=${car.id_voiture}" class="btn btn-primary">Réserver ce véhicule</a>
                        `;
                    } else {
                        carDetailsContainer.innerHTML = `<p>${result.message}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    carDetailsContainer.innerHTML = '<p>Une erreur est survenue lors du chargement des détails.</p>';
                });
        } else {
            carDetailsContainer.innerHTML = '<p>Aucun ID de voiture spécifié.</p>';
        }
    }
});
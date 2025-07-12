// frontend/js/car-details.js - VERSION MISE À JOUR

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const carDetailsContainer = document.getElementById('car-details-container');

    // On s'assure qu'on est bien sur la page de détails avant de continuer
    if (carDetailsContainer) {
        // 1. Récupérer l'ID de la voiture depuis l'URL
        const params = new URLSearchParams(window.location.search);
        const carId = params.get('id');

        if (carId) {
            // --- CHARGEMENT DES DÉTAILS DE LA VOITURE ---
            fetch(`${API_URL}?action=getCarDetails&id=${carId}`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        const car = result.data;
                        // Afficher les détails principaux
                        carDetailsContainer.innerHTML = `
                            <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}" style="max-width: 500px;">
                            <h2 id="car-title">${car.marque} ${car.modele} (${car.annee})</h2>
                            <p><strong>Type:</strong> ${car.type}</p>
                            <p><strong>Prix:</strong> <span id="car-price">${car.prix_par_jour}</span> €/jour</p>
                            <p><strong>Statut:</strong> ${car.statut}</p>
                            <a href="reservation-form.html?id=${car.id_voiture}" class="btn btn-primary">Réserver ce véhicule</a>
                        `;

                        // ===============================================
                        // == APRÈS AVOIR CHARGÉ LES DÉTAILS, ON CHARGE LES AVIS
                        // ===============================================
                        loadReviews(carId);

                    } else {
                        carDetailsContainer.innerHTML = `<p>${result.message}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Erreur lors du chargement des détails:', error);
                    carDetailsContainer.innerHTML = '<p>Une erreur est survenue lors du chargement des détails.</p>';
                });
        } else {
            carDetailsContainer.innerHTML = '<p>Aucun ID de voiture spécifié.</p>';
        }
    }
});


/**
 * NOUVELLE FONCTION DÉDIÉE AU CHARGEMENT DES AVIS
 * @param {string} carId - L'ID de la voiture pour laquelle charger les avis.
 */
async function loadReviews(carId) {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const reviewsListDiv = document.getElementById('reviews-list');
    
    // On s'assure que le conteneur des avis existe
    if (!reviewsListDiv) return;

    // On appelle la nouvelle route de l'API
    const response = await fetch(`${API_URL}?action=getCarReviews&id=${carId}`);
    const result = await response.json();

    if (result.success) {
        reviewsListDiv.innerHTML = ''; // On vide le conteneur
        if (result.data.length > 0) {
            let totalNotes = 0;
            
            result.data.forEach(review => {
                totalNotes += parseInt(review.note);

                reviewsListDiv.innerHTML += `
                    <div class="review-card">
                        <div class="review-header">
                            <strong>${review.prenom}</strong>
                            <span class="stars">${'★'.repeat(review.note)}${'☆'.repeat(5 - review.note)}</span>
                        </div>
                        <p class="review-comment">"${review.commentaire}"</p>
                        <span class="review-date">Avis du ${review.date}</span>
                    </div>
                `;
            });
            
            // Calcul et affichage de la note moyenne
            const averageRating = totalNotes / result.data.length;
            const averageRatingElement = document.createElement('div');
            averageRatingElement.className = 'average-rating';
            averageRatingElement.innerHTML = `
                Note moyenne : <strong>${averageRating.toFixed(1)} / 5</strong> 
                (${result.data.length} avis)
            `;
            // On insère la note moyenne avant la liste des avis
            reviewsListDiv.parentNode.insertBefore(averageRatingElement, reviewsListDiv);

        } else {
            reviewsListDiv.innerHTML = '<p>Soyez le premier à laisser un avis pour cette voiture !</p>';
        }
    }
}
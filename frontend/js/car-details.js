// frontend/js/car-details.js - VERSION FINALE AVEC BOUTON DYNAMIQUE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const carDetailsContainer = document.getElementById('car-details-container');

    // On s'assure qu'on est bien sur la page de détails avant de continuer.
    if (carDetailsContainer) {
        initializeCarDetailsPage();
    }
});


/**
 * Fonction principale qui orchestre le chargement de la page de détails.
 */
async function initializeCarDetailsPage() {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const carDetailsContainer = document.getElementById('car-details-container');
    
    // --- 1. On vérifie d'abord qui est l'utilisateur pour connaître son rôle. ---
    const authResponse = await fetch(`${API_URL}?action=checkAuth`);
    const authResult = await authResponse.json();
    const userRole = authResult.isLoggedIn ? authResult.user.role : null; // 'admin', 'client', ou null
console.log("Résultat de checkAuth:", authResult); 
    // --- 2. On récupère l'ID de la voiture depuis l'URL. ---
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        carDetailsContainer.innerHTML = '<p>Aucun ID de voiture spécifié.</p>';
        return;
    }

    // --- 3. On charge les détails de la voiture. ---
    try {
        const carResponse = await fetch(`${API_URL}?action=getCarDetails&id=${carId}`);
        const carResult = await carResponse.json();

        if (carResult.success) {
            const car = carResult.data;
            
            // --- 4. On génère le bouton d'action en fonction du rôle de l'utilisateur. ---
            let actionButtonHtml = '';
    if (userRole === 'admin') { // <-- Cette condition est VRAIE alors qu'elle devrait être FAUSSE
        // Le code génère le bouton admin
        actionButtonHtml = `<a href="edit-car.html?id=${car.id_voiture}" class="btn btn-secondary">Modifier cette voiture</a>`;
    } else {
        // Le code ne passe jamais ici pour le client
        actionButtonHtml = `<a href="reservation-form.html?id=${car.id_voiture}" class="btn btn-primary">Réserver ce véhicule</a>`;
    }
            // --- 5. On affiche toutes les informations dans le conteneur. ---
            carDetailsContainer.innerHTML = `
                <div class="car-image-container">
                    <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}">
                </div>
                <div class="car-info-container">
                    <h2 id="car-title">${car.marque} ${car.modele} (${car.annee})</h2>
                    <p><strong>Type:</strong> ${car.type}</p>
                    <p><strong>Prix:</strong> <span id="car-price">${car.prix_par_jour}</span> €/jour</p>
                    <p><strong>Statut:</strong> <span class="status status-${car.statut}">${car.statut}</span></p>
                    ${actionButtonHtml}
                </div>
            `;

            // --- 6. Une fois les détails affichés, on charge les avis. ---
            loadReviews(carId);

        } else {
            carDetailsContainer.innerHTML = `<p>${carResult.message}</p>`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des détails:', error);
        carDetailsContainer.innerHTML = '<p>Une erreur est survenue lors du chargement des détails.</p>';
    }
}


/**
 * Fonction dédiée au chargement et à l'affichage des avis.
 * (Cette fonction reste identique à la version précédente).
 * @param {string} carId - L'ID de la voiture.
 */
async function loadReviews(carId) {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const reviewsListDiv = document.getElementById('reviews-list');
    
    if (!reviewsListDiv) return;

    const response = await fetch(`${API_URL}?action=getCarReviews&id=${carId}`);
    const result = await response.json();

    if (result.success) {
        reviewsListDiv.innerHTML = ''; 
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
            
            const averageRating = totalNotes / result.data.length;
            const averageRatingElement = document.createElement('div');
            averageRatingElement.className = 'average-rating';
            averageRatingElement.innerHTML = `Note moyenne : <strong>${averageRating.toFixed(1)} / 5</strong> (${result.data.length} avis)`;
            reviewsListDiv.parentNode.insertBefore(averageRatingElement, reviewsListDiv);

        } else {
            reviewsListDiv.innerHTML = '<p>Soyez le premier à laisser un avis pour cette voiture !</p>';
        }
    }
}
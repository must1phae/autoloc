// frontend/js/modal.js - VERSION FINALE AVEC CORRECTION DE LA VARIABLE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Éléments de la modale
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContentContainer = document.getElementById('modal-content-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- LOGIQUE D'OUVERTURE DE LA MODALE ---
    document.body.addEventListener('click', async (e) => {
        const viewDetailsButton = e.target.closest('.btn-view-details');
        if (viewDetailsButton) {
            e.preventDefault();
            const carId = viewDetailsButton.dataset.id;
            openModalWithCarDetails(carId);
        }
    });

    // --- Fonction pour ouvrir et remplir la modale ---
    async function openModalWithCarDetails(carId) {
        if (!modalOverlay) return;

        modalOverlay.classList.remove('modal-hidden');
        modalContentContainer.innerHTML = '<div class="loader"></div>';
        
        try {
            const [carResponse, reviewsResponse] = await Promise.all([
                fetch(`${API_URL}?action=getCarDetails&id=${carId}`),
                fetch(`${API_URL}?action=getCarReviews&id=${carId}&limit=3`)
            ]);
            
            const carResult = await carResponse.json();
            
            // ===============================================
            // ==         LA CORRECTION EST ICI             ==
            // ===============================================
            const reviewsResult = await reviewsResponse.json(); // On utilise la bonne variable

            if (carResult.success) {
                const car = carResult.data;
                
                let reviewsHtml = '<p>Aucun avis pour le moment.</p>';
                if (reviewsResult.success && reviewsResult.data.length > 0) {
                    reviewsHtml = reviewsResult.data.map(review => `
                        <div class="modal-review-card">
                            <div class="review-header">
                                <strong>${review.prenom}</strong>
                                <span class="stars">${'★'.repeat(review.note)}${'☆'.repeat(5 - review.note)}</span>
                            </div>
                            <p class="review-comment">"${review.commentaire}"</p>
                        </div>
                    `).join('');
                }

                modalContentContainer.innerHTML = `
                    <div class="modal-car-details-grid">
                        <div class="modal-car-image">
                            <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}">
                        </div>
                        <div class="modal-car-info">
                            <h2>${car.marque} ${car.modele}</h2>
                            <div class="car-specs">
                                <span><strong>Année :</strong> ${car.annee}</span>
                                <span><strong>Type :</strong> ${car.type}</span>
                                <span><strong>Statut :</strong> <span class="status status-${car.statut}">${car.statut}</span></span>
                            </div>
                            <p class="modal-price">${car.prix_par_jour} €<span>/jour</span></p>
                           <button class="btn btn-primary btn-reserve" data-id="${car.id_voiture}" data-name="${car.marque} ${car.modele}" data-price="${car.prix_par_jour}">Réserver maintenant</button>
                        </div>
                    </div>
                    <div class="modal-reviews-section">
                        <h3>Derniers avis des clients</h3>
                        <div class="modal-reviews-grid">
                            ${reviewsHtml}
                        </div>
                    </div>
                `;
            } else {
                modalContentContainer.innerHTML = `<p>Erreur: Impossible de charger les détails de cette voiture.</p>`;
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la modale:", error);
            modalContentContainer.innerHTML = `<p>Une erreur de connexion est survenue.</p>`;
        }
    }
    
    // On expose la fonction à la portée globale
    window.openDetailsModal = openModalWithCarDetails;
    
    // --- LOGIQUE DE FERMETURE DE LA MODALE (INCHANGÉE) ---
    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.add('modal-hidden');
            modalContentContainer.innerHTML = ''; 
        }
    }

    if(modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    if(modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('modal-hidden')) {
            closeModal();
        }
    });
});
// frontend/js/dashboard-client.js - VERSION MISE À JOUR

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    const userInfoDiv = document.getElementById('user-info');
    const reservationsListDiv = document.getElementById('reservations-list');
    const logoutBtn = document.getElementById('logout-btn');

    // --- 1. Vérifier l'authentification et charger les données ---
    async function loadDashboard() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        if (authResult.isLoggedIn) {
            const user = authResult.user;
            // On vérifie que userInfoDiv existe avant de l'utiliser
            if (userInfoDiv) {
                userInfoDiv.innerHTML = `
                    <p>Bonjour, <strong>${user.prenom} ${user.nom}</strong> !</p>
                    <p>Email: ${user.email}</p>
                `;
            }

            const reservationsResponse = await fetch(`${API_URL}?action=getUserReservations`);
            const reservationsResult = await reservationsResponse.json();

            // On vérifie que reservationsListDiv existe avant de l'utiliser
            if (reservationsListDiv) {
                if (reservationsResult.success && reservationsResult.data.length > 0) {
                    reservationsListDiv.innerHTML = ''; 
                    reservationsResult.data.forEach(res => {
                        const reservationCard = document.createElement('div');
                        reservationCard.className = 'reservation-card';

                        // ===============================================
                        // ==      PARTIE AJOUTÉE POUR LES AVIS         ==
                        // ===============================================
                        let actionButton = '';
                        // Si la réservation est 'terminée', on ajoute le bouton
                        if (res.statut_reservation === 'terminée') {
                            actionButton = `
                                <button class="btn-review" 
                                        data-car-id="${res.id_voiture}" 
                                        data-car-name="${res.marque} ${res.modele}">
                                    Laisser un avis
                                </button>
                            `;
                        }
                        // ===============================================
                        
                        reservationCard.innerHTML = `
                            <img src="../../uploads/cars/${res.image}" alt="${res.marque}">
                            <div class="reservation-details">
                                <h4>${res.marque} ${res.modele}</h4>
                                <p>Du <strong>${res.date_debut}</strong> au <strong>${res.date_fin}</strong></p>
                                <p>Montant total : <strong>${res.montant_total} €</strong></p>
                                <p>Statut : <span class="status status-${res.statut_reservation.replace(' ', '-')}">${res.statut_reservation}</span></p>
                                <div class="reservation-actions">
                                    ${actionButton}
                                </div>
                            </div>
                        `;
                        reservationsListDiv.appendChild(reservationCard);
                    });
                } else {
                    reservationsListDiv.innerHTML = '<p>Vous n\'avez aucune réservation pour le moment.</p>';
                }
            }
        } else {
            window.location.href = 'login.html';
        }
    }

    // --- 2. Gérer la déconnexion ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch(`${API_URL}?action=logout`);
            window.location.href = 'home.html';
        });
    }

    // =========================================================
    // == ÉCOUTEUR D'ÉVÉNEMENT AJOUTÉ POUR GÉRER LE CLIC SUR AVIS
    // =========================================================
    if (reservationsListDiv) {
        reservationsListDiv.addEventListener('click', async (e) => {
            // On vérifie si l'élément cliqué est bien notre bouton
            if (e.target.classList.contains('btn-review')) {
                const button = e.target;
                const carId = button.dataset.carId;
                const carName = button.dataset.carName;
                
                // On utilise des boîtes de dialogue simples.
                const note = prompt(`Quelle note (de 1 à 5) donnez-vous à la ${carName} ?`);
                
                // On s'arrête si l'utilisateur annule ou ne met pas de note valide
                if (!note || isNaN(note) || note < 1 || note > 5) {
                    alert('Action annulée ou note invalide. Veuillez entrer un chiffre entre 1 et 5.');
                    return;
                }

                const commentaire = prompt("Laissez un commentaire pour aider les autres utilisateurs (optionnel) :");
console.log("Données envoyées à l'API:", { id_voiture: carId, note: parseInt(note), commentaire: commentaire });
                // On envoie les données à l'API
                const response = await fetch(`${API_URL}?action=leaveReview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id_voiture: carId, 
                        note: parseInt(note), 
                        commentaire: commentaire 
                    })
                });
                
                const result = await response.json();

                if (result.success) {
                    alert('Merci pour votre avis ! Il a bien été enregistré.');
                    button.textContent = 'Avis envoyé'; // Change le texte du bouton
                    button.disabled = true; // Désactive le bouton pour éviter un double envoi
                } else {
                    alert('Une erreur est survenue. Vous avez peut-être déjà laissé un avis pour cette voiture.');
                }
            }
        });
    }

    // Lancer le chargement du tableau de bord au chargement de la page
    loadDashboard();
});
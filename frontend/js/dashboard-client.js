// frontend/js/dashboard-client.js - VERSION FINALE AVEC PROTECTION DE RÔLE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    const userInfoDiv = document.getElementById('user-info');
    const reservationsListDiv = document.getElementById('reservations-list');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Fonction principale qui orchestre le chargement de la page ---
    async function initializePage() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        // =========================================================
        // ==         NOUVELLE LOGIQUE DE PROTECTION DE RÔLE      ==
        // =========================================================
        if (authResult.isLoggedIn) {
            // L'utilisateur est connecté, on vérifie son rôle.
            const userRole = authResult.user.role;

            if (userRole === 'admin') {
                // C'est un admin sur une page client, on le redirige.
                alert("Accès Espace Client impossible pour un administrateur. Redirection vers votre tableau de bord.");
                window.location.href = 'dashboard-admin.html';
                return; // On arrête l'exécution du script.
            }

            // Si on arrive ici, c'est bien un client. On peut charger le contenu de la page.
            displayUserInfo(authResult.user);
            loadClientReservations();
            
        } else {
            // L'utilisateur n'est pas connecté du tout.
            window.location.href = 'login.html';
        }
    }

    // --- Fonction pour afficher les informations de l'utilisateur ---
    function displayUserInfo(user) {
        if (userInfoDiv) {
            userInfoDiv.innerHTML = `
                <p>Bonjour, <strong>${user.prenom} ${user.nom}</strong> !</p>
                <p>Email: ${user.email}</p>
            `;
        }
    }

    // --- Fonction pour charger et afficher les réservations du client ---
    async function loadClientReservations() {
        if (!reservationsListDiv) return;

        const reservationsResponse = await fetch(`${API_URL}?action=getUserReservations`);
        const reservationsResult = await reservationsResponse.json();

        if (reservationsResult.success && reservationsResult.data.length > 0) {
            reservationsListDiv.innerHTML = ''; 
            reservationsResult.data.forEach(res => {
                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                
                let actionButton = '';
                if (res.statut_reservation === 'terminée') {
                    actionButton = `<button class="btn-review" data-car-id="${res.id_voiture}" data-car-name="${res.marque} ${res.modele}">Laisser un avis</button>`;
                }
                
                reservationCard.innerHTML = `
                    <img src="../uploads/cars/${res.image}" alt="${res.marque}">
                    <div class="reservation-details">
                        <h4>${res.marque} ${res.modele}</h4>
                        <p>Du <strong>${res.date_debut}</strong> au <strong>${res.date_fin}</strong></p>
                        <p>Montant total : <strong>${res.montant_total} €</strong></p>
                        <p>Statut : <span class="status status-${res.statut_reservation.replace(' ', '-')}">${res.statut_reservation}</span></p>
                        <div class="reservation-actions">${actionButton}</div>
                    </div>
                `;
                reservationsListDiv.appendChild(reservationCard);
            });
        } else {
            reservationsListDiv.innerHTML = '<p>Vous n\'avez aucune réservation pour le moment.</p>';
        }
    }

    // --- Gérer la déconnexion ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch(`${API_URL}?action=logout`);
            window.location.href = 'home.html';
        });
    }

    // --- Gérer le clic pour laisser un avis ---
    if (reservationsListDiv) {
        reservationsListDiv.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-review')) {
                const button = e.target;
                const carId = button.dataset.carId;
                const carName = button.dataset.carName;
                
                const note = prompt(`Quelle note (de 1 à 5) donnez-vous à la ${carName} ?`);
                
                if (!note || isNaN(note) || note < 1 || note > 5) {
                    alert('Action annulée ou note invalide. Veuillez entrer un chiffre entre 1 et 5.');
                    return;
                }

                const commentaire = prompt("Laissez un commentaire (optionnel) :");

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
                    alert('Merci pour votre avis !');
                    button.textContent = 'Avis envoyé';
                    button.disabled = true;
                } else {
                    alert('Une erreur est survenue. Vous avez peut-être déjà laissé un avis pour cette voiture.');
                }
            }
        });
    }

    // --- Lancement de l'initialisation de la page ---
    initializePage();
});
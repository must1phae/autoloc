// frontend/js/dashboard-client.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    const userInfoDiv = document.getElementById('user-info');
    const reservationsListDiv = document.getElementById('reservations-list');
    const logoutBtn = document.getElementById('logout-btn');

    // --- 1. Vérifier l'authentification et charger les données ---
    async function loadDashboard() {
        // On vérifie d'abord si l'utilisateur est connecté via la session PHP
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        if (authResult.isLoggedIn) {
            // Si oui, on affiche ses infos
            const user = authResult.user;
            userInfoDiv.innerHTML = `
                <p>Bonjour, <strong>${user.prenom} ${user.nom}</strong> !</p>
                <p>Email: ${user.email}</p>
            `;

            // Ensuite, on charge ses réservations
            const reservationsResponse = await fetch(`${API_URL}?action=getUserReservations`);
            const reservationsResult = await reservationsResponse.json();

            if (reservationsResult.success && reservationsResult.data.length > 0) {
                reservationsListDiv.innerHTML = ''; // On vide le message de chargement
                reservationsResult.data.forEach(res => {
                    const reservationCard = document.createElement('div');
                    reservationCard.className = 'reservation-card'; // Une classe pour le style
                    reservationCard.innerHTML = `
                        <img src="../../uploads/cars/${res.image}" alt="${res.marque}">
                        <div class="reservation-details">
                            <h4>${res.marque} ${res.modele}</h4>
                            <p>Du <strong>${res.date_debut}</strong> au <strong>${res.date_fin}</strong></p>
                            <p>Montant total : <strong>${res.montant_total} €</strong></p>
                            <p>Statut : <span class="status status-${res.statut_reservation.replace(' ', '-')}">${res.statut_reservation}</span></p>
                        </div>
                    `;
                    reservationsListDiv.appendChild(reservationCard);
                });
            } else {
                reservationsListDiv.innerHTML = '<p>Vous n\'avez aucune réservation pour le moment.</p>';
            }

        } else {
            // Si non connecté, on le renvoie à la page de connexion
            window.location.href = 'login.html';
        }
    }

    // --- 2. Gérer la déconnexion ---
    logoutBtn.addEventListener('click', async () => {
        const response = await fetch(`${API_URL}?action=logout`);
        const result = await response.json();
        if (result.success) {
            // Rediriger vers la page d'accueil après déconnexion
            window.location.href = 'home.html';
        }
    });

    // Lancer le chargement du tableau de bord au chargement de la page
    loadDashboard();
});
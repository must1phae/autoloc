// frontend/js/dashboard-client.js - VERSION FINALE POUR LA NOUVELLE STRUCTURE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Nouveaux sélecteurs pour les éléments du DOM
    const userInfoSidebarDiv = document.getElementById('user-info-sidebar');
    const upcomingReservationsDiv = document.getElementById('upcoming-reservations-list');
    const pastReservationsDiv = document.getElementById('past-reservations-list');

    // --- Fonction principale qui initialise la page ---
    async function initializeDashboard() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        // Protection de la page et redirection
        if (!authResult.isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }
        if (authResult.user.role === 'admin') {
            window.location.href = 'dashboard-admin.html';
            return;
        }

        // Si c'est un client, on charge les données
        displayUserInfo(authResult.user);
        loadAndDisplayReservations();
    }

    // --- Affiche les infos dans la sidebar ---
    function displayUserInfo(user) {
        if (userInfoSidebarDiv) {
            userInfoSidebarDiv.innerHTML = `
                <h4>${user.prenom} ${user.nom}</h4>
                <p>${user.email}</p>
            `;
        }
    }

    // --- Charge, trie et affiche les réservations ---
    async function loadAndDisplayReservations() {
        if (!upcomingReservationsDiv || !pastReservationsDiv) return;

        const reservationsResponse = await fetch(`${API_URL}?action=getUserReservations`);
        const result = await reservationsResponse.json();

        if (result.success && result.data.length > 0) {
            const allReservations = result.data;
            const today = new Date();
            today.setHours(0, 0, 0, 0); // On met l'heure à minuit pour comparer les dates

            // On sépare les réservations en deux listes
            const upcoming = allReservations.filter(res => new Date(res.date_fin) >= today);
            const past = allReservations.filter(res => new Date(res.date_fin) < today);

            // On affiche chaque liste dans sa section
            renderReservations(upcoming, upcomingReservationsDiv, "Vous n'avez aucune réservation à venir.");
            renderReservations(past, pastReservationsDiv, "Vous n'avez pas encore d'historique de réservation.");

        } else {
            // Si l'utilisateur n'a aucune réservation
            upcomingReservationsDiv.innerHTML = `<div class="no-data-message"><p>Vous n'avez aucune réservation à venir.</p><a href="../../index.html#car-list-section" class="btn">Louer une voiture</a></div>`;
            pastReservationsDiv.innerHTML = `<div class="no-data-message"><p>Vous n'avez pas encore d'historique de réservation.</p></div>`;
        }
    }

    // --- Fonction réutilisable pour afficher une liste de réservations ---
    function renderReservations(reservations, container, emptyMessage) {
        container.innerHTML = ''; // On vide le conteneur

        if (reservations.length > 0) {
            reservations.forEach(res => {
                let actionButton = '';
                if (res.statut_reservation === 'terminée') {
                    actionButton = `<button class="btn-review" data-car-id="${res.id_voiture}" data-car-name="${res.marque} ${res.modele}">Laisser un avis</button>`;
                }

                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                reservationCard.innerHTML = `
                    <img src="../../uploads/cars/${res.image}" alt="${res.marque}">
                    <div class="reservation-details">
                        <h4>${res.marque} ${res.modele}</h4>
                        <p>Du <strong>${res.date_debut}</strong> au <strong>${res.date_fin}</strong></p>
                        <p>Statut : <span class="status status-${res.statut_reservation.replace(' ', '-')}">${res.statut_reservation}</span></p>
                        <div class="reservation-actions">${actionButton}</div>
                    </div>
                `;
                container.appendChild(reservationCard);
            });
        } else {
            container.innerHTML = `<div class="no-data-message"><p>${emptyMessage}</p></div>`;
        }
    }
    
    // --- Lancement de l'initialisation de la page ---
    initializeDashboard();
    
    // NOTE : La logique pour le clic sur "Laisser un avis" a été déplacée 
    // dans la fonction renderReservations ou doit être attachée au conteneur principal.
    // Pour la simplicité, on l'attache au <main>
    document.querySelector('.dashboard-content').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-review')) {
            // ... collez ici l'intégralité de la logique de la popup d'avis que nous avions avant ...
            const button = e.target;
            const carId = button.dataset.carId;
            const carName = button.dataset.carName;
            
            const note = prompt(`Quelle note (de 1 à 5) donnez-vous à la ${carName} ?`);
            if (!note || isNaN(note) || note < 1 || note > 5) {
                alert('Action annulée ou note invalide.');
                return;
            }
            const commentaire = prompt("Laissez un commentaire (optionnel) :");

            const response = await fetch(`${API_URL}?action=leaveReview`, {
                method: 'POST',
                body: JSON.stringify({ id_voiture: carId, note: parseInt(note), commentaire: commentaire })
            });
            const result = await response.json();
            if (result.success) {
                alert('Merci ! Votre avis a été enregistré.');
                button.textContent = 'Avis envoyé';
                button.disabled = true;
            } else {
                alert('Une erreur est survenue.');
            }
        }
    });
});
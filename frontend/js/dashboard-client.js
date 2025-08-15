// frontend/js/dashboard-client.js - VERSION FINALE, PROPRE ET COMBINÉE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Sélecteurs pour les éléments du DOM
    const userInfoSidebarDiv = document.getElementById('user-info-sidebar');
    const upcomingReservationsDiv = document.getElementById('upcoming-reservations-list');
    const pastReservationsDiv = document.getElementById('past-reservations-list');
    const logoutBtn = document.getElementById('logout-btn'); // Cible pour le bouton de déconnexion

    // --- Fonction principale qui initialise la page ---
    async function initializeDashboard() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        // Protection de la page et redirection
        if (!authResult.isLoggedIn) {
            // Si l'utilisateur n'est pas connecté, le rediriger
            window.location.href = 'auth.html';
            return;
        }
        if (authResult.user.role === 'admin') {
            // Si c'est un admin, le rediriger vers son propre dashboard
            window.location.href = 'dashboard-admin.html';
            return;
        }

        // Si c'est bien un client, on charge toutes les données de la page
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

    // --- GESTION DE LA DÉCONNEXION ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch(`${API_URL}?action=logout`);
            alert("Vous avez été déconnecté.");
            // Rediriger vers la page d'accueil après la déconnexion
            window.location.href = 'index.html'; 
        });
    }

    // --- Charge, trie et affiche les réservations ---
    async function loadAndDisplayReservations() {
        if (!upcomingReservationsDiv || !pastReservationsDiv) return;

        const reservationsResponse = await fetch(`${API_URL}?action=getUserReservations`);
        const result = await reservationsResponse.json();

        if (result.success && result.data.length > 0) {
            const allReservations = result.data;
            
            // Logique de tri par statut (la plus fiable)
            // "À venir" ou "En cours" : Statuts 'en attente' ou 'confirmée'
            const upcoming = allReservations.filter(res => 
                res.statut_reservation === 'en attente' || res.statut_reservation === 'confirmée'
            );

            // "Historique" : Statuts 'terminée' ou 'annulée'
            const past = allReservations.filter(res => 
                res.statut_reservation === 'terminée' || res.statut_reservation === 'annulée'
            );
            
            // On affiche chaque liste dans sa section
            renderReservations(upcoming, upcomingReservationsDiv, "Vous n'avez aucune réservation en cours ou à venir.");
            renderReservations(past, pastReservationsDiv, "Vous n'avez pas encore d'historique de réservation.");

        } else {
            // Si l'utilisateur n'a aucune réservation du tout
            upcomingReservationsDiv.innerHTML = `<div class="no-data-message"><p>Vous n'avez aucune réservation à venir.</p><a href="cars-list.html" class="btn">Louer une voiture</a></div>`;
            pastReservationsDiv.innerHTML = `<div class="no-data-message"><p>Vous n'avez pas encore d'historique de réservation.</p></div>`;
        }
    }

    // --- Fonction réutilisable pour afficher une liste de réservations ---
    function renderReservations(reservations, container, emptyMessage) {
        container.innerHTML = '';

        if (reservations.length > 0) {
            reservations.forEach(res => {
                let actionButtons = ''; // Conteneur pour les boutons

                // --- NOUVEAU : Logique d'affichage du bouton "Annuler" ---
                const startDate = new Date(res.date_debut);
                const now = new Date();
                const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (res.statut_reservation === 'confirmée' && hoursUntilStart > 24) {
                    actionButtons += `<button class="btn-action btn-cancel" data-id="${res.id_reservation}">Annuler</button>`;
                }

                // --- Logique du bouton "Laisser un avis" (inchangée) ---
                if (res.statut_reservation === 'terminée') {
                    actionButtons += `<button class="btn-action btn-review" data-id="${res.id_reservation}" data-car-id="${res.id_voiture}" data-car-name="${res.marque} ${res.modele}">Laisser un avis</button>`;
                }

                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                
                // On utilise un chemin absolu pour l'image pour plus de robustesse
                const imagePath = `/autoloc/uploads/cars/${res.image}`;

                reservationCard.innerHTML = `
                    <img src="${imagePath}" alt="${res.marque}">
                    <div class="reservation-details">
                        <h4>${res.marque} ${res.modele}</h4>
                        <p>Du <strong>${new Date(res.date_debut).toLocaleDateString('fr-FR')}</strong> au <strong>${new Date(res.date_fin).toLocaleDateString('fr-FR')}</strong></p>
                        <p>Statut : <span class="status status-${res.statut_reservation.replace(' ', '-')}">${res.statut_reservation}</span></p>
                        <div class="reservation-actions">${actionButtons}</div>
                    </div>
                `; 
                container.appendChild(reservationCard);
            });
        } else {
            container.innerHTML = `<div class="no-data-message"><p>${emptyMessage}</p></div>`;
        }
    }
    
    // --- Écouteur global pour les boutons "Laisser un avis" ---
      document.querySelector('.dashboard-content').addEventListener('click', async (e) => {
        const target = e.target;
        if (e.target.classList.contains('btn-review')) {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_voiture: carId, note: parseInt(note), commentaire: commentaire })
            });
            const result = await response.json();
            if (result.success) {
                alert('Merci ! Votre avis a été enregistré.');
                button.textContent = 'Avis envoyé';
                button.disabled = true;
            } else {
                alert(result.message || 'Une erreur est survenue.');
            }
        }
         // --- NOUVEAU : Gère le clic sur "Annuler" ---
        if (target.classList.contains('btn-cancel')) {
            const reservationId = target.dataset.id;
            
            if (confirm("Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.")) {
                try {
                    const response = await fetch(`${API_URL}?action=cancelReservation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_reservation: reservationId })
                    });
                    const result = await response.json();

                    if (result.success) {
                        alert("Votre réservation a été annulée avec succès.");
                        loadAndDisplayReservations(); // On rafraîchit la liste
                    } else {
                        alert(`Erreur : ${result.message}`);
                    }
                } catch (error) {
                    alert("Une erreur de connexion est survenue.");
                }
            }
        }
    });
     

    // --- Lancement de l'initialisation de la page ---
    initializeDashboard();
});
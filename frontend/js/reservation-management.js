// frontend/js/reservation-management.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const reservationsTableBody = document.querySelector('#reservations-table tbody');

    // Fonction pour charger la liste des réservations
    async function loadReservations() {
        // Protection de la page
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        if (!authResult.isLoggedIn || authResult.user.role !== 'admin') {
            window.location.href = 'auth.html';
            return;
        }

        const response = await fetch(`${API_URL}?action=adminGetAllReservations`);
        const result = await response.json();

        if (result.success && reservationsTableBody) {
            reservationsTableBody.innerHTML = '';
            result.data.forEach(res => {
                const row = document.createElement('tr');
                row.innerHTML = `
               <td>${res.id_reservation}</td>
    <td class="client-info">${res.prenom} ${res.nom}</td>
    <td class="car-info">${res.marque} ${res.modele}</td>
    <td>Du ${res.date_debut} au ${res.date_fin}</td>
    <td>${res.montant_total} €</td>
    <td>
        <select class="status-select" data-id="${res.id_reservation}">
            <option value="en attente" ${res.statut_reservation === 'en attente' ? 'selected' : ''}>En attente</option>
            <option value="confirmée" ${res.statut_reservation === 'confirmée' ? 'selected' : ''}>Confirmée</option>
            <option value="annulée" ${res.statut_reservation === 'annulée' ? 'selected' : ''}>Annulée</option>
            <option value="terminée" ${res.statut_reservation === 'terminée' ? 'selected' : ''}>Terminée</option>
        </select>
    </td>
                `;
                reservationsTableBody.appendChild(row);
            });
        }
    }

    // Écouteur pour le changement de statut
    if (reservationsTableBody) {
        reservationsTableBody.addEventListener('change', async (e) => {
            if (e.target.classList.contains('status-select')) {
                const id_reservation = e.target.dataset.id;
                const statut = e.target.value;

                const response = await fetch(`${API_URL}?action=adminUpdateReservationStatus`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_reservation, statut })
                });

                const result = await response.json();
                // On peut afficher une notification plus subtile qu'une alerte
                alert(result.message); 
            }
        });
    }

    // Lancer le chargement
    loadReservations();
});
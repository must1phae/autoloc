// frontend/js/user-management.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const usersTableBody = document.querySelector('#users-table tbody');

    // Fonction principale pour charger les utilisateurs
    async function loadUsers() {
        // Protection de la page
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        if (!authResult.isLoggedIn || authResult.user.role !== 'admin') {
            window.location.href = 'auth.html';
            return;
        }

        // Récupérer la liste des utilisateurs
        const usersResponse = await fetch(`${API_URL}?action=adminGetAllUsers`);
        const usersResult = await usersResponse.json();

        if (usersResult.success && usersTableBody) {
            usersTableBody.innerHTML = '';
            usersResult.data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id_user}</td>
                    <td>${user.nom} ${user.prenom}</td>
                    <td>${user.email}</td>
                    <td>
                        <select class="role-select" data-id="${user.id_user}">
                            <option value="client" ${user.role === 'client' ? 'selected' : ''}>Client</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn-delete-user" data-id="${user.id_user}">Supprimer</button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });
        }
    }

    // Écouteur d'événements pour le tableau
    if (usersTableBody) {
        usersTableBody.addEventListener('change', async (e) => {
            // Gérer le changement de rôle
            if (e.target.classList.contains('role-select')) {
                const id_user = e.target.dataset.id;
                const role = e.target.value;
                
                const response = await fetch(`${API_URL}?action=adminUpdateUserRole`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_user, role })
                });
                const result = await response.json();
                alert(result.message);
            }
        });

        usersTableBody.addEventListener('click', async (e) => {
            // Gérer la suppression
            if (e.target.classList.contains('btn-delete-user')) {
                const id_user = e.target.dataset.id;
                if (confirm(`Voulez-vous vraiment supprimer cet utilisateur (ID: ${id_user}) ? Toutes ses données (réservations, etc.) seront perdues.`)) {
                    const response = await fetch(`${API_URL}?action=adminDeleteUser`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_user })
                    });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) {
                        loadUsers(); // Recharger la liste
                    }
                }
            }
        });
    }

    // Lancer le chargement au démarrage
    loadUsers();
});
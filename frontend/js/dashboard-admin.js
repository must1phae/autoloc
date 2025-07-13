// frontend/js/dashboard-admin.js - VERSION CORRIGÉE

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // == 1. DÉCLARATIONS DES CONSTANTES (une seule fois en haut)
    // =========================================================
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const carsTableBody = document.querySelector('#admin-cars-table tbody');
    const logoutBtn = document.getElementById('logout-btn');


    // =========================================================
    // == 2. DÉFINITION DES FONCTIONS
    // =========================================================

    // Fonction pour charger les données du tableau de bord
    async function loadAdminDashboard() {
        // Sécurité : si l'élément du tableau n'existe pas, on arrête pour éviter une erreur
        if (!carsTableBody) {
            console.error("L'élément '#admin-cars-table tbody' n'a pas été trouvé.");
            return;
        }

        // Vérification de l'authentification
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        
        if (!authResult.isLoggedIn || authResult.user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        // Chargement de la liste des voitures
        const carsResponse = await fetch(`${API_URL}?action=adminGetAllCars`);
        const carsResult = await carsResponse.json();

        if (carsResult.success) {
            carsTableBody.innerHTML = '';
            carsResult.data.forEach(car => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${car.id_voiture}</td>
                    <td><img src="../../uploads/cars/${car.image}" alt="${car.marque}" width="100"></td>
                    <td>${car.marque} ${car.modele}</td>
                    <td>${car.prix_par_jour} €</td>
                    <td><span class="status status-${car.statut.replace(' ', '-')}">${car.statut}</span></td>
                    <td>
                        <a href="edit-car.html?id=${car.id_voiture}" class="btn-edit">Modifier</a>
                        <button class="btn-delete" data-id="${car.id_voiture}">Supprimer</button>
                    </td>
                `;
                carsTableBody.appendChild(row);
            });
        }
    }


    // =========================================================
    // == 3. MISE EN PLACE DES ÉCOUTEURS D'ÉVÉNEMENTS
    // =========================================================

    // Écouteur pour la déconnexion
    

    // Écouteur pour les clics dans le tableau (pour la suppression)
    if (carsTableBody) {
        carsTableBody.addEventListener('click', async (e) => {
            // On vérifie si la cible du clic est bien un bouton "Supprimer"
            if (e.target.classList.contains('btn-delete')) {
                const carId = e.target.dataset.id;
                
                if (confirm(`Voulez-vous vraiment supprimer la voiture n°${carId} ? Cette action est irréversible.`)) {
                    const response = await fetch(`${API_URL}?action=adminDeleteCar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_voiture: carId })
                    });
                    const result = await response.json();
                    alert(result.message); // Affiche le message de succès ou d'erreur

                    if (result.success) {
                        loadAdminDashboard(); // Recharge le tableau pour refléter la suppression
                    }
                }
            }
        });
    }


    // =========================================================
    // == 4. APPEL INITIAL
    // =========================================================
    loadAdminDashboard();

});
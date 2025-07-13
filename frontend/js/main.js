// main.js - fichier de structure pour AutoLoc
// frontend/js/main.js - VERSION FINALE POUR index.html

document.addEventListener('DOMContentLoaded', () => {
    // L'URL de l'API reste la même.
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Cibles pour les éléments de la page d'accueil
    const carListContainer = document.getElementById('car-list');
    const mainNav = document.getElementById('main-navigation');

    // --- 1. GESTION DE LA NAVBAR DYNAMIQUE ---
    async function setupNavbar() {
        if (!mainNav) return;

        // On vérifie si un utilisateur est connecté
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        if (authResult.isLoggedIn) {
            // Utilisateur CONNECTÉ
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' 
                ? '../pages/dashboard-admin.html' 
                : '../pages/dashboard-client.html';

            mainNav.innerHTML = `
                <ul>
                    <li><a href="${dashboardLink}">Mon Tableau de Bord</a></li>
                </ul>
                <div class="user-actions">
                    <span class="welcome-text">Bonjour, ${user.prenom} !</span>
                    <button id="logout-btn" class="btn btn-secondary">Déconnexion</button>
                </div>
            `;
            // On attache l'événement de déconnexion
            document.getElementById('logout-btn').addEventListener('click', async () => {
                await fetch(`${API_URL}?action=logout`);
                window.location.reload(); // On recharge la page pour voir les changements
            });
        } else {
            // Utilisateur NON CONNECTÉ (visiteur)
            mainNav.innerHTML = `
                <ul>
                    <li><a href="../pages/login.html">Connexion</a></li>
                    <li><a href="../pages/register.html" class="btn btn-primary">Inscription</a></li>
                </ul>
            `;
        }
    }

    // --- 2. CHARGEMENT DE LA LISTE DES VOITURES ---
    async function fetchAndDisplayCars() {
        if (!carListContainer) return;

        try {
            const response = await fetch(`${API_URL}?action=getAllCars`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                carListContainer.innerHTML = '';
                result.data.forEach(car => {
                    const carCard = document.createElement('div');
                    carCard.className = 'car-card';
                    // Les chemins vers les images et les pages doivent être complets
                    carCard.innerHTML = `
                        <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}">
                        <h3>${car.marque} ${car.modele}</h3>
                        <p>À partir de <strong>${car.prix_par_jour} €/jour</strong></p>
                        <a href="../pages/car-details.html?id=${car.id_voiture}" class="btn">Voir détails et réserver</a>
                    `;
                    carListContainer.appendChild(carCard);
                });
            } else {
                carListContainer.innerHTML = '<p>Aucune voiture disponible pour le moment.</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des voitures:', error);
            carListContainer.innerHTML = '<p>Impossible de charger les voitures. Veuillez réessayer plus tard.</p>';
        }
    }

    // --- 3. LANCEMENT DES FONCTIONS ---
    setupNavbar();
    fetchAndDisplayCars();
});
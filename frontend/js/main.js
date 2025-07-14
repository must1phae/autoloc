// frontend/js/main.js - VERSION AVEC NAVBAR AMÉLIORÉE ET CHEMINS CONSERVÉS

document.addEventListener('DOMContentLoaded', () => {
    // L'URL de l'API reste la même.
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Cibles pour les éléments de la page d'accueil
    const carListContainer = document.getElementById('car-list');
    const mainNav = document.getElementById('main-navigation');

    // --- 1. GESTION DE LA NAVBAR DYNAMIQUE ---
    async function setupNavbar() {
        if (!mainNav) return;

        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        // On définit les liens de base de la navigation
        let baseNavLinks = `
            <li><a href="index.html" class="active">Accueil</a></li>
            <li><a href="cars-list.html">Louer une Voiture</a></li>
            <li><a href="contact.html">Contact</a></li>
        `;
        
        let userActionsHtml = '';

        if (authResult.isLoggedIn) {
            // --- CAS UTILISATEUR CONNECTÉ ---
            const user = authResult.user;
            // Chemin vers le dashboard tel que vous l'aviez, partant du dossier 'pages' implicitement
            const dashboardLink = user.role === 'admin' 
                ? 'dashboard-admin.html' 
                : 'dashboard-client.html';

            // On crée le cercle de profil
            userActionsHtml = `
                <div class="user-profile-icon">
                    <a href="pages/${dashboardLink}">
                        <span>${user.prenom.charAt(0).toUpperCase()}</span>
                    </a>
                </div>
            `;
            
        } else {
            // --- CAS UTILISATEUR NON CONNECTÉ (visiteur) ---
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="pages/login.html" class="btn btn-secondary">Connexion</a>
                    <a href="pages/register.html" class="btn btn-primary">Inscription</a>
                </div>
            `;
        }
        
        // On assemble la navbar complète
        mainNav.innerHTML = `
            <ul>${baseNavLinks}</ul>
            <div class="nav-actions-container">
                ${userActionsHtml}
            </div>
        `;
    }

    // --- 2. CHARGEMENT DE LA LISTE DES VOITURES ---
    // Cette section est modifiée pour utiliser les chemins que vous avez fournis.
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
                    
                    // ===============================================
                    // == CHEMINS CONSERVÉS TELS QUE VOUS LES AVIEZ ==
                    // ===============================================
                    carCard.innerHTML = `
                        <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}">
                        <div class="car-card-content">
                            <h3>${car.marque} ${car.modele}</h3>
                            <p>À partir de <strong>${car.prix_par_jour} €/jour</strong></p>
                            <a href="car-details.html?id=${car.id_voiture}" class="btn">Voir détails et réserver</a>
                        </div>
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
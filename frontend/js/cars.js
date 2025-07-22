// frontend/js/cars.js - VERSION AVEC NAVBAR DYNAMIQUE ET CHEMINS D'ORIGINE CONSERVÉS

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Sélecteurs pour les éléments de la page
    const carsContainer = document.getElementById('cars-container'); // Votre HTML doit avoir cet ID
    const mainNav = document.getElementById('main-navigation');      // Votre HTML doit aussi avoir cet ID pour la navbar

    // =========================================================
    // == 1. GESTION DE LA NAVBAR DYNAMIQUE (Logique ajoutée)
    // =========================================================
    async function setupNavbar() {
        if (!mainNav) return;

        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        // Liens de base pour la navigation
        let baseNavLinks = `
            <li><a href="index.html">Accueil</a></li>
            <li><a href="cars-list.html" class="active">Louer une Voiture</a></li>
            <li><a href="contact.html">Contact</a></li>
        `;
        
        let userActionsHtml = '';

        if (authResult.isLoggedIn) {
            // --- CAS UTILISATEUR CONNECTÉ ---
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' 
                ? 'dashboard-admin.html' 
                : 'dashboard-client.html';

            userActionsHtml = `
                <div class="user-profile-icon">
                    <a href="${dashboardLink}">
                        <span>${user.prenom.charAt(0).toUpperCase()}</span>
                    </a>
                </div>
            `;
            
        } else {
            // --- CAS UTILISATEUR NON CONNECTÉ ---
               const authLink = isSubPage ? 'auth.html' : 'auth.html';
            
            // On génère un seul bouton qui mène vers la page d'authentification
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="${authLink}" class="btn btn-primary">Connexion / Inscription</a>
                </div>
            `;
        }
        
        // On assemble la navbar
        mainNav.innerHTML = `
            <ul>${baseNavLinks}</ul>
            <div class="nav-actions-container">
                ${userActionsHtml}
            </div>
        `;
    }

    // =========================================================
    // == 2. CHARGEMENT DE LA LISTE DES VOITURES (Votre logique d'origine)
    // =========================================================
    async function fetchAndDisplayCars() {
        if (!carsContainer) return;

        try {
            const response = await fetch(`${API_URL}?action=getAllCars`);
            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
                carsContainer.innerHTML = ''; 
                result.data.forEach(car => {
                    const carCard = document.createElement('div');
                    carCard.className = 'car-card';
                    
                    // ===============================================
                    // ==   CES CHEMINS SONT CONSERVÉS COMME DEMANDÉ  ==
                    // ===============================================
                    carCard.innerHTML = `
                        <img src="../../uploads/cars/${car.image || 'default.jpg'}" alt="${car.marque} ${car.modele}">
                        <div class="car-card-content">
                            <h3>${car.marque} ${car.modele}</h3>
                            <p>Type : ${car.type}</p>
                            <p class="price"><strong>${car.prix_par_jour} €</strong> / jour</p>
                                                    <button class="btn btn-primary btn-view-details" data-id="${car.id_voiture}">Voir détails et réserver</button>

                        </div>
                    `;
                    carsContainer.appendChild(carCard);
                });
            } else {
                carsContainer.innerHTML = '<p>Aucune voiture disponible pour le moment.</p>';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des voitures:', error);
            carsContainer.innerHTML = '<p>Une erreur critique est survenue.</p>';
        }
    }

    // --- 3. LANCEMENT DES FONCTIONS ---
    setupNavbar();
    fetchAndDisplayCars();
});
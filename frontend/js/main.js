// frontend/js/main.js - VERSION FINALE AVEC LOGIQUE DE NAVBAR ET REDIRECTION CORRECTES

document.addEventListener('DOMContentLoaded', () => {
    // L'URL de l'API reste la même.
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Cibles pour les éléments de la page
    const carListContainer = document.getElementById('car-list');
    const mainNav = document.getElementById('main-navigation');

    // --- 1. GESTION DE LA NAVBAR DYNAMIQUE (Avec la logique de redirection corrigée) ---
    async function setupNavbar() {
        if (!mainNav) return;

        const currentPage = window.location.pathname.split('/').pop();
        const navLinksData = [
            { href: 'index.html', label: 'Accueil' },
            { href: 'cars-list.html', label: 'Louer une Voiture' },
            { href: 'contact.html', label: 'Contact' }
        ];
        let baseNavLinks = navLinksData.map(link => {
            const isActive = (currentPage === link.href || (currentPage === '' && link.href === 'index.html')) ? 'active' : '';
            return `<li><a href="${link.href}" class="${isActive}">${link.label}</a></li>`;
        }).join('');

        // On vérifie le statut de connexion auprès de l'API
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        
        let userActionsHtml = '';

        // =========================================================================
        // === DÉBUT DE LA LOGIQUE D'AFFICHAGE CONDITIONNEL (Connexion/Profil) ===
        // =========================================================================

        if (authResult.success && authResult.isLoggedIn) {
            // --- CAS 1: L'UTILISATEUR EST CONNECTÉ ---
            const user = authResult.user;
            
            // On détermine le bon lien vers le dashboard en fonction du rôle
            const dashboardLink = user.role === 'admin' 
                ? 'dashboard-admin.html' 
                : 'dashboard-client.html';

            // On génère l'icône de profil qui redirige vers le bon dashboard.
            // Le chemin "pages/" est nécessaire car on part de index.html (à la racine).
            userActionsHtml = `
                <div class="user-profile-icon">
                    <a href="/${dashboardLink}">
                        <span>${user.prenom.charAt(0).toUpperCase()}</span>
                    </a>
                </div>
            `;
            
        } else {
            // --- CAS 2: L'UTILISATEUR N'EST PAS CONNECTÉ (Visiteur) ---
            
            // On génère les boutons "Connexion" et "Inscription".
            // Le chemin "pages/" est nécessaire pour pointer vers les fichiers dans le sous-dossier.
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="../pages/login.html" class="btn btn-secondary">Connexion</a>
                    <a href="../pages/register.html" class="btn btn-primary">Inscription</a>
                </div>
            `;
        }

        // =========================================================================
        // === FIN DE LA LOGIQUE D'AFFICHAGE CONDITIONNEL                          ===
        // =========================================================================
        
        // On assemble la navbar complète avec la bonne partie droite (profil ou boutons)
        mainNav.innerHTML = `
            <ul>${baseNavLinks}</ul>
            <div class="nav-actions-container">
                ${userActionsHtml}
            </div>
        `;
    }

    // --- 2. CHARGEMENT DE LA LISTE LIMITÉE DES VOITURES ---
    // Cette fonction reste inchangée.
    async function fetchAndDisplayCars() {
        if (!carListContainer) return;

        const seeMoreContainer = document.getElementById('see-more-container');

        try {
            const response = await fetch(`${API_URL}?action=getAllCars&limit=6`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                carListContainer.innerHTML = '';
                result.data.forEach(car => {
                    const carCard = document.createElement('div');
                    carCard.className = 'car-card';
                    
                    carCard.innerHTML = `
                        <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}">
                        <div class="car-card-content">
                            <h3>${car.marque} ${car.modele}</h3>
                            <p>À partir de <strong>${car.prix_par_jour} €/jour</strong></p>
                            <a href="../pages/car-details.html?id=${car.id_voiture}" class="btn ">Voir détails et réserver</a>
                        </div>
                    `;
                    carListContainer.appendChild(carCard);
                });

                if (seeMoreContainer) {
                    seeMoreContainer.innerHTML = `<a href="cars-list.html" class="btn btn-primary">Voir toutes nos voitures</a>`;
                }

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
// frontend/js/app.js - VERSION FINALE AVEC MENU MOBILE ET BOUTON AUTH UNIQUE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const mainHeader = document.querySelector('.main-header'); // On cible le header entier
    const mainNav = document.getElementById('main-navigation');

    // La fonction setupNavbar est maintenant intelligente et centralisée ici.
    async function setupNavbar() {
        if (!mainNav || !mainHeader) return; // Sécurité ajoutée pour mainHeader

        // --- Logique de liens et chemins ---
        const currentPage = window.location.pathname.split('/').pop();
        const navLinksData = [
            { href: 'index.html', label: 'Accueil' },
            { href: 'cars-list.html', label: 'Louer une Voiture' },
            { href: 'contact.html', label: 'Contact' }
        ];
        let baseNavLinks = navLinksData.map(link => {
            const isActive = (currentPage === link.href || (currentPage === '' && link.href === 'index.html')) ? 'active' : '';
            const finalHref = document.body.dataset.pageLevel === 'sub' ? `../${link.href}` : link.href;
            return `<li><a href="${finalHref}" class="${isActive}">${link.label}</a></li>`;
        }).join('');

        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        let userActionsHtml = '';
        const isSubPage = document.body.dataset.pageLevel === 'sub';

        if (authResult.isLoggedIn) {
            // --- CAS UTILISATEUR CONNECTÉ (INCHANGÉ) ---
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-client.html';
            // Le chemin est ajusté en fonction de la page
            const finalDashboardLink = isSubPage ? dashboardLink : `../pages/${dashboardLink}`;
            userActionsHtml = `<div class="user-profile-icon"><a href="${finalDashboardLink}"><span>${user.prenom.charAt(0).toUpperCase()}</span></a></div>`;
        
        } else {
            // =========================================================
            // ==      MODIFICATION DEMANDÉE : UN SEUL BOUTON AUTH    ==
            // =========================================================
            // Le chemin vers auth.html est ajusté en fonction de la page (racine ou sous-page)
            const authLink = isSubPage ? 'auth.html' : 'auth.html';
            
            // On génère un seul bouton qui mène vers la page d'authentification
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="${authLink}" class="btn btn-primary">Connexion / Inscription</a>
                </div>
            `;
            // =========================================================
        }
        
        mainNav.innerHTML = `
            <ul>${baseNavLinks}</ul>
            <div class="nav-actions-container">
                ${userActionsHtml}
            </div>
        `;

        // --- GESTION DU BOUTON HAMBURGER (INCHANGÉ) ---
        if (!mainHeader.querySelector('.nav-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'nav-toggle';
            toggleButton.setAttribute('aria-label', 'Ouvrir le menu');
            toggleButton.innerHTML = '<span></span><span></span><span></span>';
            mainHeader.querySelector('.header-container').appendChild(toggleButton);

            toggleButton.addEventListener('click', () => {
                mainHeader.classList.toggle('nav-open');
            });
        }
    }

    setupNavbar();
});
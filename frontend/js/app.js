// frontend/js/app.js - VERSION FINALE AVEC MENU MOBILE INTÉGRÉ

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const mainHeader = document.querySelector('.main-header'); // On cible le header entier
    const mainNav = document.getElementById('main-navigation');

    // La fonction setupNavbar est maintenant intelligente et centralisée ici.
    async function setupNavbar() {
        if (!mainNav || !mainHeader) return; // Sécurité ajoutée pour mainHeader

        // --- VOTRE LOGIQUE DE LIENS ET CHEMINS (INCHANGÉE) ---
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
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-client.html';
            userActionsHtml = `<div class="user-profile-icon"><a href="${isSubPage ? '' : '../pages/'}${dashboardLink}"><span>${user.prenom.charAt(0).toUpperCase()}</span></a></div>`;
        } else {
            userActionsHtml = `<div class="auth-buttons"><a href="${isSubPage ? '' : 'pages/'}login.html" class="btn btn-secondary">Connexion</a><a href="${isSubPage ? '' : 'pages/'}register.html" class="btn btn-primary">Inscription</a></div>`;
        }
        
        mainNav.innerHTML = `
            <ul>${baseNavLinks}</ul>
            <div class="nav-actions-container">
                ${userActionsHtml}
            </div>
        `;

        // ===============================================
        // ==  AJOUT DU BOUTON HAMBURGER ET DE SA LOGIQUE ==
        // ===============================================

        // Créer et insérer le bouton hamburger s'il n'existe pas déjà
        if (!mainHeader.querySelector('.nav-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'nav-toggle';
            toggleButton.setAttribute('aria-label', 'Ouvrir le menu');
            toggleButton.innerHTML = '<span></span><span></span><span></span>';
            mainHeader.querySelector('.header-container').appendChild(toggleButton);

            // Ajouter la logique de clic sur le bouton
            toggleButton.addEventListener('click', () => {
                // On ajoute/retire une classe sur le header pour contrôler l'état du menu
                mainHeader.classList.toggle('nav-open');
            });
        }
    }

    setupNavbar();
});
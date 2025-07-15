// frontend/js/app.js - S'occupe UNIQUEMENT de la barre de navigation pour TOUT le site.

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const mainNav = document.getElementById('main-navigation');

    // La fonction setupNavbar est maintenant intelligente et centralisée ici.
    async function setupNavbar() {
        if (!mainNav) return;

        // Détecte la page actuelle
        const currentPage = window.location.pathname.split('/').pop();

        // Définit les liens de navigation
        const navLinksData = [
            { href: 'index.html', label: 'Accueil' },
            { href: 'cars-list.html', label: 'Louer une Voiture' },
            { href: 'contact.html', label: 'Contact' }
        ];

        // Construit les liens en ajoutant la classe "active" dynamiquement
        let baseNavLinks = navLinksData.map(link => {
            const isActive = (currentPage === link.href || (currentPage === '' && link.href === 'index.html')) ? 'active' : '';
            // Le chemin href est relatif à la racine, les pages devront gérer cela
            const finalHref = document.body.dataset.pageLevel === 'sub' ? `../${link.href}` : link.href;
            return `<li><a href="${finalHref}" class="${isActive}">${link.label}</a></li>`;
        }).join('');

        // Le reste de la logique pour la connexion/déconnexion
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        
        let userActionsHtml = '';
        const isSubPage = document.body.dataset.pageLevel === 'sub';

        if (authResult.isLoggedIn) {
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-client.html';
            userActionsHtml = `
                <div class="user-profile-icon">
                    <a href="${isSubPage ? '' : '../pages/'}${dashboardLink}">
                        <span>${user.prenom.charAt(0).toUpperCase()}</span>
                    </a>
                </div>
            `;
        } else {
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="${isSubPage ? '' : 'pages/'}login.html" class="btn btn-secondary">Connexion</a>
                    <a href="${isSubPage ? '' : 'pages/'}register.html" class="btn btn-primary">Inscription</a>
                </div>
            `;
        }
        
        mainNav.innerHTML = `
            <ul>${baseNavLinks}</ul>
            <div class="nav-actions-container">
                ${userActionsHtml}
            </div>
        `;
    }

    setupNavbar();
});
// frontend/js/admin-nav.js - VERSION FINALE AVEC NAVIGATION DYNAMIQUE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Sélecteurs pour la navbar
    const adminNavContainer = document.getElementById('main-navigation-admin');
    const logoutBtn = document.getElementById('logout-btn');

    /**
     * Construit la barre de navigation admin dynamiquement.
     */
    function setupAdminNavbar() {
        if (!adminNavContainer) return; // Ne fait rien si la nav n'est pas sur la page

        const currentPage = window.location.pathname.split('/').pop();

        // =========================================================
        // ==  LA LISTE CENTRALE DE TOUS VOS LIENS ADMIN EST ICI  ==
        // =========================================================
        const navLinks = [
            { href: 'dashboard-admin.html', label: 'Voitures' },
            { href: 'reservations-list.html', label: 'Réservations' },
            { href: 'user-list.html', label: 'Utilisateurs' },
            { href: 'admin-messages.html', label: 'Messages' },
            { href: 'verify-documents.html', label: 'Documents' }
        ];

        // On génère le HTML pour les liens et on ajoute la classe 'active' au bon
        const navHtml = navLinks.map(link => {
            const isActive = (currentPage === link.href) ? 'active' : '';
            return `<li><a href="${link.href}" class="${isActive}">${link.label}</a></li>`;
        }).join('');

        // On injecte la liste de liens dans le conteneur de navigation
        adminNavContainer.innerHTML = `<ul>${navHtml}</ul>`;
    }

    /**
     * Gère la logique du bouton de déconnexion.
     */
    function setupLogoutButton() {
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch(`${API_URL}?action=logout`);
                alert("Vous avez été déconnecté.");
                // Redirige vers la page de connexion, ce qui est plus logique
                window.location.href = 'auth.html'; 
            });
        }
    }

    // --- Lancement des fonctions ---
    setupAdminNavbar();
    setupLogoutButton();
});
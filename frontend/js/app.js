// frontend/js/app.js - VERSION FINALE AVEC NOTIFICATIONS INTÉGRÉES

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const mainHeader = document.querySelector('.main-header');
    const mainNav = document.getElementById('main-navigation');

    async function setupNavbar() {
        if (!mainNav || !mainHeader) return;

        // --- Logique de liens et chemins (INCHANGÉE) ---
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
            // --- CAS UTILISATEUR CONNECTÉ (AVEC AJOUT DES NOTIFICATIONS) ---
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-client.html';
            const finalDashboardLink = isSubPage ? dashboardLink : `${dashboardLink}`;
            
            // =========================================================
            // ==      AJOUT : On génère le HTML pour la cloche       ==
            // ==      uniquement si l'utilisateur est un client.     ==
            // =========================================================
            let notificationBellHtml = '';
            if (user.role === 'client') {
                notificationBellHtml = `
                    <div class="notification-bell" id="notification-bell">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 0013.484 0 .75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zM8.5 16a1.5 1.5 0 103 0h-3z" clip-rule="evenodd" /></svg>
                        <span id="notification-count" class="notification-count" style="display: none;">0</span>
                    </div>
                    <div id="notification-panel" class="notification-panel"><p>Chargement...</p></div>
                `;
            }

            // On assemble la cloche (si elle existe) et l'icône de profil
            userActionsHtml = `
                ${notificationBellHtml}
                <div class="user-profile-icon"><a href="${finalDashboardLink}"><span>${user.prenom.charAt(0).toUpperCase()}</span></a></div>
            `;
        
        } else {
            // --- CAS UTILISATEUR NON CONNECTÉ (INCHANGÉ) ---
            const authLink = isSubPage ? 'auth.html' : `pages/auth.html`;
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="${authLink}" class="btn btn-primary">Connexion / Inscription</a>
                </div>
            `;
        }
        
        mainNav.innerHTML = `<ul>${baseNavLinks}</ul><div class="nav-actions-container">${userActionsHtml}</div>`;

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
        
        // =========================================================
        // ==      AJOUT : On exécute la logique des notifications  ==
        // =========================================================
        if (authResult.isLoggedIn && authResult.user.role === 'client') {
            initializeNotifications();
        }
    }

    /**
     * NOUVELLE FONCTION qui contient toute la logique des notifications.
     */
    function initializeNotifications() {
        const bellIcon = document.getElementById('notification-bell');
        const countSpan = document.getElementById('notification-count');
        const panel = document.getElementById('notification-panel');

        if (!bellIcon || !panel) return;

        bellIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('is-visible');
            if (panel.classList.contains('is-visible') && countSpan.textContent > 0) {
                markAsRead();
            }
        });

        document.addEventListener('click', () => panel.classList.remove('is-visible'));
        panel.addEventListener('click', (e) => e.stopPropagation());

        async function markAsRead() {
            countSpan.textContent = '0';
            countSpan.style.display = 'none';
            await fetch(`${API_URL}?action=markNotificationsAsRead`, { method: 'POST' });
        }

        async function fetchNotifications() {
            try {
                const response = await fetch(`${API_URL}?action=getUserNotifications`);
                const result = await response.json();
                if (result.success) {
                    if (result.unreadCount > 0) {
                        countSpan.textContent = result.unreadCount;
                        countSpan.style.display = 'flex';
                    } else {
                        countSpan.style.display = 'none';
                    }
                    panel.innerHTML = '';
                    if (result.data.length > 0) {
                        result.data.forEach(notif => {
                            const linkPath = document.body.dataset.pageLevel === 'sub' ? notif.lien : `../${notif.lien}`;
                            const notifDiv = document.createElement('a');
                            notifDiv.href = notif.lien ? linkPath : '#';
                            notifDiv.className = `notification-item ${!notif.est_lu ? 'is-unread' : ''}`;
                            notifDiv.innerHTML = `<p>${notif.message}</p><span class="notif-date">${new Date(notif.date_creation).toLocaleDateString('fr-FR')}</span>`;
                            panel.appendChild(notifDiv);
                        });
                    } else {
                        panel.innerHTML = '<div class="notification-item"><p>Vous n\'avez aucune notification.</p></div>';
                    }
                }
            } catch (error) { console.error("Erreur notifications:", error); }
        }

        fetchNotifications();
        setInterval(fetchNotifications, 60000); // Vérifie toutes les minutes
    }

    setupNavbar();
});
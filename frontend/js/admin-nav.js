// frontend/js/admin-nav.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const logoutBtn = document.getElementById('logout-btn');
    
    // --- GESTION DE LA DÉCONNEXION ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            // On appelle l'action de déconnexion de l'API
            await fetch(`${API_URL}?action=logout`);
            // On redirige vers la page d'accueil après la déconnexion
            alert("Vous avez été déconnecté.");
            window.location.href = 'auth.html';
        });
    }

    // --- GESTION DE LA CLASSE 'ACTIVE' (BONUS) ---
    // Cette partie met en surbrillance le lien de la page actuelle.
    const navLinks = document.querySelectorAll('.main-nav a');
    const currentPage = window.location.pathname.split('/').pop(); // Récupère le nom du fichier (ex: 'user-list.html')
    

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});
// frontend/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // L'URL de notre API backend
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // --- LOGIQUE POUR LE FORMULAIRE D'INSCRIPTION ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Empêche le rechargement de la page

            // Récupérer les valeurs du formulaire
            const nom = document.getElementById('nom').value;
            const prenom = document.getElementById('prenom').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');

            // Envoyer les données à l'API
            const response = await fetch(`${API_URL}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom, prenom, email, password })
            });

            const result = await response.json();

            if (result.success) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = result.message;
                // Rediriger vers la page de connexion après un court délai
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = result.message;
            }
        });
    }


    // --- LOGIQUE POUR LE FORMULAIRE DE CONNEXION (MISE À JOUR) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');

            const response = await fetch(`${API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = result.message;

                // ---- C'EST LA NOUVELLE PARTIE INTELLIGENTE ----
                // On vérifie le rôle renvoyé par l'API
                if (result.user.role === 'admin') {
                    // Si c'est un admin, on redirige vers le dashboard admin
                    setTimeout(() => {
                        window.location.href = 'dashboard-admin.html'; 
                    }, 1500);
                } else {
                    // Sinon (c'est un client), on redirige vers le dashboard client
                    setTimeout(() => {
                        window.location.href = 'dashboard-client.html';
                    }, 1500);
                }
                // ---------------------------------------------

            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = result.message;
            }
        });
    }
});
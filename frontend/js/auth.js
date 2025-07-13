// frontend/js/auth.js - VERSION FINALE

document.addEventListener('DOMContentLoaded', () => {
    // On définit l'URL de l'API une seule fois pour tout le script.
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // =========================================================
    // ==         GESTION DU FORMULAIRE D'INSCRIPTION         ==
    // =========================================================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche le rechargement de la page.

            // On cible les éléments une seule fois pour la performance.
            const nomInput = document.getElementById('nom');
            const prenomInput = document.getElementById('prenom');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const messageDiv = document.getElementById('message');
            const submitButton = registerForm.querySelector('button[type="submit"]');

            // On désactive le bouton pour éviter les doubles clics.
            submitButton.disabled = true;
            submitButton.textContent = 'Enregistrement...';
            
            try {
                // On envoie les données à l'API.
                const response = await fetch(`${API_URL}?action=register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        nom: nomInput.value, 
                        prenom: prenomInput.value, 
                        email: emailInput.value, 
                        password: passwordInput.value 
                    })
                });

                const result = await response.json();

                if (result.success) {
                    messageDiv.className = 'message-success'; // Utilise les classes CSS pour le style.
                    messageDiv.textContent = result.message + " Vous allez être redirigé...";
                    // On redirige vers la page de connexion après un court délai.
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2500);
                } else {
                    messageDiv.className = 'message-error';
                    messageDiv.textContent = result.message;
                    // On réactive le bouton en cas d'erreur.
                    submitButton.disabled = false;
                    submitButton.textContent = 'S\'inscrire';
                }
            } catch (error) {
                console.error("Erreur lors de l'inscription:", error);
                messageDiv.className = 'message-error';
                messageDiv.textContent = 'Une erreur de communication est survenue. Veuillez réessayer.';
                submitButton.disabled = false;
                submitButton.textContent = 'S\'inscrire';
            }
        });
    }

    // =========================================================
    // ==           GESTION DU FORMULAIRE DE CONNEXION          ==
    // =========================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const messageDiv = document.getElementById('message');
            const submitButton = loginForm.querySelector('button[type="submit"]');

            submitButton.disabled = true;
            submitButton.textContent = 'Connexion...';

            try {
                const response = await fetch(`${API_URL}?action=login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: emailInput.value, 
                        password: passwordInput.value 
                    })
                });

                const result = await response.json();

                if (result.success) {
                    messageDiv.className = 'message-success';
                    messageDiv.textContent = result.message;

                    // Redirection intelligente basée sur le rôle renvoyé par l'API.
                    const destination = result.user.role === 'admin' 
                        ? 'dashboard-admin.html' 
                        : 'dashboard-client.html';
                    
                    setTimeout(() => {
                        window.location.href = destination; 
                    }, 1500);

                } else {
                    messageDiv.className = 'message-error';
                    messageDiv.textContent = result.message;
                    submitButton.disabled = false;
                    submitButton.textContent = 'Se connecter';
                }
            } catch (error) {
                console.error("Erreur lors de la connexion:", error);
                messageDiv.className = 'message-error';
                messageDiv.textContent = 'Une erreur de communication est survenue. Veuillez réessayer.';
                submitButton.disabled = false;
                submitButton.textContent = 'Se connecter';
            }
        });
    }
});
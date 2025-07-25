// frontend/js/auth.js - VERSION FINALE AVEC GESTION DES ERREURS AMÉLIORÉE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // =========================================================
    // ==         GESTION DE L'ANIMATION DU PANNEAU           ==
    // =========================================================
    const container = document.getElementById('container');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    if (container && signUpButton && signInButton) {
        signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
        signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
    }

    // =========================================================
    // ==         GESTION DU FORMULAIRE D'INSCRIPTION         ==
    // =========================================================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nomInput = document.getElementById('register-nom');
            const prenomInput = document.getElementById('register-prenom');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            const messageDiv = document.getElementById('register-message');
            const submitButton = registerForm.querySelector('button[type="submit"]');

            submitButton.disabled = true;
            submitButton.textContent = 'Enregistrement...';
            messageDiv.textContent = '';

            try {
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

                if (response.ok && result.success) {
                    window.location.href = `verify-code.html?email=${encodeURIComponent(emailInput.value)}`;
                } else {
                    throw new Error(result.message || "Une erreur inconnue est survenue lors de l'inscription.");
                }

            } catch (error) {
                messageDiv.className = 'message message-error';
                messageDiv.textContent = error.message;
                submitButton.disabled = false;
                submitButton.textContent = 'S\'inscrire';
            }
        });
    }

    // =========================================================
    // ==         GESTION DU FORMULAIRE DE CONNEXION          ==
    // =========================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const messageDiv = document.getElementById('login-message');
            const submitButton = loginForm.querySelector('button[type="submit"]');
            
            submitButton.disabled = true;
            submitButton.textContent = 'Connexion...';
            messageDiv.textContent = '';

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

                if (response.ok && result.success) {
                    // Succès, on redirige.
                    const destination = result.user.role === 'admin' 
                        ? 'dashboard-admin.html' 
                        : 'dashboard-client.html';
                    window.location.href = destination;
                } else {
                    // Échec logique (ex: mauvais mdp) ou erreur serveur (ex: 500)
                    // On affiche le message spécifique renvoyé par le backend.
                    throw new Error(result.message || "Une erreur est survenue.");
                }
            } catch (error) {
                // Ce bloc gère les erreurs de connexion réseau (ex: pas d'internet)
                // ET les erreurs logiques que nous avons "lancées" avec "throw new Error".
                console.error("Erreur de connexion:", error);
                messageDiv.className = 'message message-error';
                messageDiv.textContent = error.message;
                
                // On réactive le bouton seulement en cas d'erreur pour que l'utilisateur puisse réessayer.
                submitButton.disabled = false;
                submitButton.textContent = 'Se Connecter';
            }
        });
    }
});
// frontend/js/auth.js - VERSION FINALE POUR LA PAGE D'AUTHENTIFICATION ANIMÉE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // =========================================================
    // ==         GESTION DE L'ANIMATION DU PANNEAU           ==
    // =========================================================
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
const mobileSignUpButton = document.getElementById('mobileSignUp');
    const mobileSignInButton = document.getElementById('mobileSignIn');
    if (signUpButton && signInButton && container) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
        });
    }

    // =========================================================
    // ==         GESTION DU FORMULAIRE D'INSCRIPTION         ==
    // =========================================================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // On cible les nouveaux ID du formulaire d'inscription
            const nomInput = document.getElementById('register-nom');
            const prenomInput = document.getElementById('register-prenom');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            const messageDiv = document.getElementById('register-message');
            const submitButton = registerForm.querySelector('button[type="submit"]');

            submitButton.disabled = true;
            submitButton.textContent = 'Enregistrement...';
            
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

                if (result.success) {
                    messageDiv.className = 'message message-success';
                    messageDiv.textContent = result.message + " Veuillez vous connecter.";
                    // On bascule automatiquement sur le panneau de connexion après succès
                    setTimeout(() => {
                        container.classList.remove("right-panel-active");
                    }, 2500);
                } else {
                    throw new Error(result.message || "Une erreur est survenue.");
                }
            } catch (error) {
                console.error("Erreur lors de l'inscription:", error);
                messageDiv.className = 'message message-error';
                messageDiv.textContent = error.message;
            } finally {
                // On réactive le bouton
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

            // On cible les nouveaux ID du formulaire de connexion
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const messageDiv = document.getElementById('login-message');
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
                    messageDiv.className = 'message message-success';
                    messageDiv.textContent = result.message;

                    // Redirection intelligente basée sur le rôle
                    const destination = result.user.role === 'admin' 
                        ? 'dashboard-admin.html' 
                        : 'dashboard-client.html';
                    
                    setTimeout(() => {
                        window.location.href = destination; 
                    }, 1500);

                } else {
                    throw new Error(result.message || "Email ou mot de passe incorrect.");
                }
            } catch (error) {
                console.error("Erreur lors de la connexion:", error);
                messageDiv.className = 'message message-error';
                messageDiv.textContent = error.message;
                submitButton.disabled = false;
                submitButton.textContent = 'Se connecter';
            }
        });
    }
     if (container) {
        // Clic sur les boutons du panneau desktop
        if (signUpButton) signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
        if (signInButton) signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

        // Clic sur les liens de basculement mobile
        if (mobileSignUpButton) mobileSignUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
        if (mobileSignInButton) mobileSignInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
    }
});
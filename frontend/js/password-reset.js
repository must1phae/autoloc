// frontend/js/password-reset.js - VERSION AMÉLIORÉE AVEC COMPTEUR DYNAMIQUE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const messageDiv = document.getElementById('message');

    // --- LOGIQUE POUR LA PAGE forgot-password.html (PARTIE MODIFIÉE) ---
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        const resendContainer = document.getElementById('resend-container');
        const resendBtn = document.getElementById('resend-email-btn');
        let countdownInterval;

        // Fonction réutilisable pour appeler l'API et gérer la réponse
        async function requestPasswordResetAPI(email) {
            return await fetch(`${API_URL}?action=requestPasswordReset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
        }

        // =========================================================
        // ==     MODIFICATION DE LA FONCTION DE COOLDOWN         ==
        // =========================================================
        function startResendCooldown() {
            if (!resendContainer || !resendBtn) return;
            
            resendContainer.style.display = 'block';
            resendBtn.disabled = true;
            let timeLeft = 60;
            
            // Nettoyer tout ancien timer pour éviter les conflits
            if (countdownInterval) clearInterval(countdownInterval);

            // On démarre un intervalle qui s'exécute toutes les secondes
            countdownInterval = setInterval(() => {
                timeLeft--;
                // On met à jour le texte du bouton à chaque seconde
                resendBtn.innerHTML = `Renvoyer (<span id="countdown-timer">${timeLeft}</span>s)`;

                if (timeLeft <= 0) {
                    // Quand le temps est écoulé, on arrête le timer
                    clearInterval(countdownInterval);
                    // On réactive le bouton et on change son texte
                    resendBtn.disabled = false;
                    resendBtn.textContent = "Renvoyer l'e-mail";
                }
            }, 1000); // Exécute toutes les 1000ms (1 seconde)
        }

        // Événement pour la soumission initiale
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = forgotForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';

            const email = document.getElementById('email').value;
            const response = await requestPasswordResetAPI(email);
            const result = await response.json();
            
            messageDiv.textContent = result.message;
            messageDiv.className = result.success ? 'message message-success' : 'message message-error';
            
            if (result.success) {
                startResendCooldown();
            }

            submitButton.disabled = false;
            submitButton.textContent = 'Envoyer le lien';
        });

        // Événement pour le clic sur "Renvoyer"
        if (resendBtn) {
            resendBtn.addEventListener('click', async () => {
                const email = document.getElementById('email').value;
                if (!email) return;
                
                resendBtn.disabled = true;
                resendBtn.textContent = 'Envoi...';
                
                const response = await requestPasswordResetAPI(email);
                const result = await response.json();

                messageDiv.textContent = result.message;
                messageDiv.className = result.success ? 'message message-success' : 'message message-error';
                
                if (result.success) {
                    startResendCooldown();
                } else {
                    resendBtn.disabled = false;
                    resendBtn.textContent = "Renvoyer l'e-mail";
                }
            });
        }
    }


    // --- LOGIQUE POUR LA PAGE reset-password.html (INCHANGÉE) ---
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        // ... (votre code existant pour cette partie reste le même)
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
            resetForm.innerHTML = '<p class="message message-error">Lien invalide.</p>';
            return;
        }
        document.getElementById('token').value = token;
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const password_confirm = document.getElementById('password_confirm').value;
            if (password.length < 6) { /* ... */ return; }
            if (password !== password_confirm) { /* ... */ return; }
            const response = await fetch(`${API_URL}?action=resetPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, password_confirm })
            });
            const result = await response.json();
            if (result.success) {
                resetForm.style.display = 'none';
                messageDiv.textContent = result.message + " Vous allez être redirigé...";
                messageDiv.className = 'message message-success';
                setTimeout(() => window.location.href = 'auth.html', 4000);
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message message-error';
            }
        });
    }
});
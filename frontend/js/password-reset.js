// frontend/js/password-reset.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const messageDiv = document.getElementById('message');

    // --- LOGIQUE POUR LA PAGE forgot-password.html ---
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = forgotForm.querySelector('button');
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';

            const email = document.getElementById('email').value;
            const response = await fetch(`${API_URL}?action=requestPasswordReset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            
            messageDiv.textContent = result.message;
            messageDiv.className = result.success ? 'message message-success' : 'message message-error';
            
            if(result.success) {
                forgotForm.reset();
            }

            submitButton.disabled = false;
            submitButton.textContent = 'Envoyer le lien';
        });
    }


    // --- LOGIQUE POUR LA PAGE reset-password.html ---
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        // 1. Récupérer le token depuis l'URL
        const token = new URLSearchParams(window.location.search).get('token');

        // 2. Vérifier si le token existe et le mettre dans le champ caché
        if (!token) {
            resetForm.innerHTML = '<p class="message message-error">Lien de réinitialisation invalide ou token manquant.</p>';
            return;
        }
        document.getElementById('token').value = token;

        // 3. Gérer la soumission du formulaire
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const password_confirm = document.getElementById('password_confirm').value;
            
            // Validation côté client
            if (password.length < 6) {
                messageDiv.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
                messageDiv.className = 'message message-error';
                return;
            }
            if (password !== password_confirm) {
                messageDiv.textContent = "Les mots de passe ne correspondent pas.";
                messageDiv.className = 'message message-error';
                return;
            }

            // Envoi des données à l'API
            const response = await fetch(`${API_URL}?action=resetPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, password_confirm })
            });
            const result = await response.json();

            if (result.success) {
                resetForm.style.display = 'none'; // Cacher le formulaire
                messageDiv.textContent = result.message + " Vous allez être redirigé vers la page de connexion...";
                messageDiv.className = 'message message-success';
                // Redirection après 4 secondes
                setTimeout(() => window.location.href = 'auth.html', 4000);
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message message-error';
            }
        });
    }
});
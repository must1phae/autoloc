// frontend/js/verify.js
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const verifyForm = document.getElementById('verify-code-form');
    const messageDiv = document.getElementById('message');
    
    // Récupérer l'email de l'URL et le mettre dans le champ caché
    const emailFromUrl = new URLSearchParams(window.location.search).get('email');
    if (emailFromUrl) {
        document.getElementById('email').value = emailFromUrl;
    } else {
        verifyForm.innerHTML = '<p class="message message-error">Information utilisateur manquante.</p>';
        return;
    }
    
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('verification_code').value;
        const email = document.getElementById('email').value;

        const response = await fetch(`${API_URL}?action=verifyCode`, {
            method: 'POST',
            body: JSON.stringify({ email, code })
        });
        const result = await response.json();

        if (result.success) {
            verifyForm.style.display = 'none';
            messageDiv.textContent = result.message + " Redirection vers la page de connexion...";
            messageDiv.className = 'message message-success';
            setTimeout(() => window.location.href = 'auth.html?verified=true', 3000);
        } else {
            messageDiv.textContent = result.message;
            messageDiv.className = 'message message-error';
        }
    });
});
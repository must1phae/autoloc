// frontend/js/modifier-profile.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Sélecteurs du DOM
    const userInfoSidebarDiv = document.getElementById('user-info-sidebar');
    const profileForm = document.getElementById('profile-form');
    const nomInput = document.getElementById('nom');
    const prenomInput = document.getElementById('prenom');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('profile-message');

    // --- Initialisation de la page ---
    async function initializePage() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        if (!authResult.isLoggedIn || authResult.user.role !== 'client') {
            window.location.href = 'login.html';
            return;
        }

        // Pré-remplir le formulaire et la sidebar
        const user = authResult.user;
        displayUserInfo(user);
        populateForm(user);
    }

    function displayUserInfo(user) {
        if (userInfoSidebarDiv) {
            userInfoSidebarDiv.innerHTML = `<h4>${user.prenom} ${user.nom}</h4><p>${user.email}</p>`;
        }
    }

    function populateForm(user) {
        if (profileForm) {
            nomInput.value = user.nom;
            prenomInput.value = user.prenom;
            emailInput.value = user.email;
        }
    }

    // --- Gérer la soumission du formulaire ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                nom: nomInput.value,
                prenom: prenomInput.value
            };

            // On n'ajoute le mot de passe que s'il n'est pas vide
            if (passwordInput.value) {
                updateData.password = passwordInput.value;
            }

            const response = await fetch(`${API_URL}?action=updateUserProfile`, {
                method: 'POST',
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            messageDiv.className = result.success ? 'message-success' : 'message-error';
            messageDiv.textContent = result.message;

            if(result.success) {
                // On met à jour le nom dans la sidebar
                displayUserInfo({ ...updateData, email: emailInput.value });
            }
        });
    }

    initializePage();
});
// frontend/js/my-documents.js - VERSION MODIFIÉE AVEC ALERT()

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Sélecteurs du DOM
    const userInfoSidebarDiv = document.getElementById('user-info-sidebar');
    const documentsListContainer = document.getElementById('documents-list-container');
    const uploadForm = document.getElementById('upload-doc-form');
    // const uploadMessageDiv = document.getElementById('upload-message'); // On n'en a plus besoin

    // --- Fonction principale d'initialisation ---
    async function initializePage() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        if (!authResult.isLoggedIn || authResult.user.role !== 'client') {
            window.location.href = 'login.html';
            return;
        }

        displayUserInfo(authResult.user);
        loadUserDocuments();
    }

    // --- Affiche les infos dans la sidebar ---
    function displayUserInfo(user) {
        if (userInfoSidebarDiv) {
            userInfoSidebarDiv.innerHTML = `<h4>${user.prenom} ${user.nom}</h4><p>${user.email}</p>`;
        }
    }

    // --- Charge et affiche la liste des documents de l'utilisateur ---
    async function loadUserDocuments() {
        if (!documentsListContainer) return;
        const response = await fetch(`${API_URL}?action=getUserDocuments`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            documentsListContainer.innerHTML = '';
            const list = document.createElement('ul');
            list.className = 'document-list';
            result.data.forEach(doc => {
                const listItem = document.createElement('li');
                listItem.className = 'document-item';
                listItem.innerHTML = `<span class="doc-type">${doc.type_doc}</span><span class="doc-date">Envoyé le : ${doc.date_upload}</span><span class="status status-${doc.statut.replace(' ', '-')}">${doc.statut}</span>`;
                list.appendChild(listItem);
            });
            documentsListContainer.appendChild(list);
        } else {
            documentsListContainer.innerHTML = `<div class="no-data-message"><p>Vous n'avez envoyé aucun document pour le moment.</p></div>`;
        }
    }
    
    // =========================================================
    // ==     GESTION DE L'UPLOAD AVEC ALERT()
    // =========================================================
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitButton = uploadForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';

            const formData = new FormData(uploadForm);
            
            try {
                const response = await fetch(`${API_URL}?action=uploadDocument`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();

                if (result.success) {
                    // ON AFFICHE UNE ALERTE DE SUCCÈS
                    alert(result.message);
                    
                    // On rafraîchit la liste et on réinitialise le formulaire
                    loadUserDocuments();
                    uploadForm.reset();
                } else {
                    // ON AFFICHE UNE ALERTE D'ERREUR
                    throw new Error(result.message || 'Une erreur est survenue.');
                }
            } catch (error) {
                console.error("Erreur lors de l'upload:", error);
                // ON AFFICHE UNE ALERTE D'ERREUR DE COMMUNICATION
                alert('Erreur : ' + error.message);
            } finally {
                // On réactive le bouton dans tous les cas
                submitButton.disabled = false;
                submitButton.textContent = 'Envoyer le document';
            }
        });
    }

    // Lancement de l'initialisation de la page
    initializePage();
});
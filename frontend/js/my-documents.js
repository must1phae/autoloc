// frontend/js/my-documents.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    const userInfoSidebarDiv = document.getElementById('user-info-sidebar');
    const documentsListContainer = document.getElementById('documents-list-container');

    // --- Fonction principale d'initialisation ---
    async function initializePage() {
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();

        // Protection de la page
        if (!authResult.isLoggedIn || authResult.user.role !== 'client') {
            window.location.href = 'login.html';
            return;
        }

        // Afficher les infos utilisateur et charger les documents
        displayUserInfo(authResult.user);
        loadUserDocuments();
    }

    // --- Affiche les infos dans la sidebar ---
    function displayUserInfo(user) {
        if (userInfoSidebarDiv) {
            userInfoSidebarDiv.innerHTML = `
                <h4>${user.prenom} ${user.nom}</h4>
                <p>${user.email}</p>
            `;
        }
    }

    // --- Charge et affiche la liste des documents de l'utilisateur ---
    async function loadUserDocuments() {
        if (!documentsListContainer) return;

        const response = await fetch(`${API_URL}?action=getUserDocuments`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            documentsListContainer.innerHTML = ''; // On vide le conteneur
            const list = document.createElement('ul');
            list.className = 'document-list';

            result.data.forEach(doc => {
                const listItem = document.createElement('li');
                listItem.className = 'document-item';
                listItem.innerHTML = `
                    <span class="doc-type">${doc.type_doc}</span>
                    <span class="doc-date">Envoyé le : ${doc.date_upload}</span>
                    <span class="status status-${doc.statut.replace(' ', '-')}">${doc.statut}</span>
                `;
                list.appendChild(listItem);
            });
            documentsListContainer.appendChild(list);
        } else {
            documentsListContainer.innerHTML = `<div class="no-data-message"><p>Vous n'avez envoyé aucun document pour le moment.</p></div>`;
        }
    }
    
    // Lancement
    initializePage();
});
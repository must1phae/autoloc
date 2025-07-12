// frontend/js/document-client.js
document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const listDiv = document.getElementById('documents-list');

    const response = await fetch(`${API_URL}?action=getUserDocuments`);
    const result = await response.json();

    if (result.success && listDiv) {
        listDiv.innerHTML = '';
        if (result.data.length > 0) {
            result.data.forEach(doc => {
                listDiv.innerHTML += `
                    <div class="document-item">
                        <span>${doc.type_doc} (envoyé le ${doc.date_upload})</span>
                        <span class="status status-${doc.statut.replace(' ', '-')}">${doc.statut}</span>
                    </div>
                `;
            });
        } else {
            listDiv.innerHTML = "<p>Vous n'avez envoyé aucun document.</p>";
        }
    }
});
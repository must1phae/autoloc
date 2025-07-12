// frontend/js/document-admin.js
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const tableBody = document.querySelector('#documents-table tbody');

    async function loadPendingDocs() {
        const response = await fetch(`${API_URL}?action=adminGetPendingDocuments`);
        const result = await response.json();
        
        if (result.success && tableBody) {
            tableBody.innerHTML = '';
            result.data.forEach(doc => {
                tableBody.innerHTML += `
                    <tr id="doc-row-${doc.id_doc}">
                        <td>${doc.prenom} ${doc.nom}</td>
                        <td>${doc.type_doc}</td>
                        <td><a href="../uploads/documents/${doc.nom_fichier}" target="_blank">Voir le fichier</a></td>
                        <td>
                            <button class="btn-approve" data-id="${doc.id_doc}">Valider</button>
                            <button class="btn-reject" data-id="${doc.id_doc}">Rejeter</button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    tableBody.addEventListener('click', async (e) => {
        if (e.target.matches('.btn-approve, .btn-reject')) {
            const id_doc = e.target.dataset.id;
            const statut = e.target.matches('.btn-approve') ? 'validé' : 'rejeté';
            
            await fetch(`${API_URL}?action=adminUpdateDocumentStatus`, {
                method: 'POST',
                body: JSON.stringify({ id_doc, statut })
            });
            // On retire la ligne du tableau pour un effet immédiat
            document.getElementById(`doc-row-${id_doc}`).remove();
        }
    });

    loadPendingDocs();
});
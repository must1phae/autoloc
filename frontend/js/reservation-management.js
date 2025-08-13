// frontend/js/reservation-management.js - VERSION FINALE AVEC HISTORIQUE GLOBAL

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // --- SÉLECTEURS ---
    const reservationsTableBody = document.querySelector('#reservations-table tbody');
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const modalOverlay = document.getElementById('history-modal-overlay');
    const modalContent = document.getElementById('history-content');
    const closeModalBtn = document.getElementById('history-modal-close-btn');
    const exportPdfBtn = document.getElementById('export-pdf-history-btn');
    const exportExcelBtn = document.getElementById('export-excel-history-btn');
    
    let currentHistoryData = []; // Variable pour stocker les données pour l'export Excel

    // --- FONCTION POUR CHARGER LA LISTE DES RÉSERVATIONS ---
    async function loadReservations() {
        if (!reservationsTableBody) return;
        
        // Protection de la page
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        if (!authResult.isLoggedIn || authResult.user.role !== 'admin') {
            window.location.href = 'auth.html'; // Redirige si non admin
            return;
        }

        try {
            const response = await fetch(`${API_URL}?action=adminGetAllReservations`);
            const result = await response.json();

            reservationsTableBody.innerHTML = '';
            if (result.success) {
                result.data.forEach(res => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${res.id_reservation}</td>
                        <td class="client-info">${res.prenom} ${res.nom}</td>
                        <td class="car-info">${res.marque} ${res.modele}</td>
                        <td>Du ${res.date_debut} au ${res.date_fin}</td>
                        <td>${res.montant_total} €</td>
                        <td>
                            <select class="status-select" data-id="${res.id_reservation}">
                                <option value="en attente" ${res.statut === 'en attente' ? 'selected' : ''}>En attente</option>
                                <option value="confirmée" ${res.statut === 'confirmée' ? 'selected' : ''}>Confirmée</option>
                                <option value="annulée" ${res.statut === 'annulée' ? 'selected' : ''}>Annulée</option>
                                <option value="terminée" ${res.statut === 'terminée' ? 'selected' : ''}>Terminée</option>
                            </select>
                        </td>
                        <!-- Rappel : Le bouton "Historique" par ligne n'est plus nécessaire ici -->
                    `;
                    reservationsTableBody.appendChild(row);
                });
            }
        } catch (error) {
            reservationsTableBody.innerHTML = '<tr><td colspan="6">Erreur de chargement des réservations.</td></tr>';
        }
    }

    // --- ÉVÉNEMENTS & INITIALISATION ---

    // Écouteur pour le changement de statut
    if (reservationsTableBody) {
        reservationsTableBody.addEventListener('change', async (e) => {
            if (e.target.classList.contains('status-select')) {
                const id_reservation = e.target.dataset.id;
                const statut = e.target.value;

                const response = await fetch(`${API_URL}?action=adminUpdateReservationStatus`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_reservation, statut })
                });
                const result = await response.json();
                alert(result.message); 
            }
        });
    }

    // --- OUVRE LA MODALE D'HISTORIQUE ---
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', async () => {
            if (!modalOverlay || !modalContent) return;
            modalContent.innerHTML = '<p class="loader">Chargement de l\'historique...</p>';
            modalOverlay.classList.remove('modal-hidden');

            try {
                const response = await fetch(`${API_URL}?action=getGlobalHistory`);
                const result = await response.json();

                if (result.success && result.data.length > 0) {
                    currentHistoryData = result.data;
                    let tableHtml = '<table class="history-table"><thead><tr><th>Date</th><th>Client</th><th>Voiture</th><th>Changement de Statut</th></tr></thead><tbody>';
                    result.data.forEach(item => {
                        tableHtml += `
                            <tr>
                                <td>${new Date(item.date_modification).toLocaleString('fr-FR')}</td>
                                <td>${item.info_client}</td>
                                <td>${item.info_voiture}</td>
                                <td>
                                    <span class="status status-${item.ancien_statut || 'none'}">${item.ancien_statut || 'Création'}</span> → 
                                    <span class="status status-${item.nouveau_statut}">${item.nouveau_statut}</span>
                                </td>
                            </tr>
                        `;
                    });
                    tableHtml += '</tbody></table>';
                    modalContent.innerHTML = tableHtml;
                } else {
                    modalContent.innerHTML = '<p>Aucun historique de changement de statut trouvé.</p>';
                }
            } catch (error) {
                modalContent.innerHTML = '<p>Erreur lors du chargement de l\'historique.</p>';
            }
        });
    }

    // --- GÈRE LA FERMETURE DE LA MODALE ---
    function closeModal() {
        if (modalOverlay) modalOverlay.classList.add('modal-hidden');
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && !modalOverlay.classList.contains('modal-hidden')) closeModal(); });

    // --- GÈRE LES EXPORTS ---
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
                alert("Erreur : Les librairies PDF ne sont pas chargées.");
                return;
            }
            alert("Génération du PDF en cours...");
            const { jsPDF } = window.jspdf;
            html2canvas(document.querySelector("#history-modal #history-content")).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('historique-reservations.pdf');
            });
        });
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            if (typeof XLSX === 'undefined') {
                alert("Erreur : La librairie Excel n'est pas chargée.");
                return;
            }
            if (currentHistoryData.length === 0) {
                alert("Aucune donnée à exporter.");
                return;
            }
            alert("Génération du fichier Excel en cours...");
            const dataToExport = currentHistoryData.map(item => ({
                'Date': new Date(item.date_modification).toLocaleString('fr-FR'),
                'Client': item.info_client,
                'Voiture': item.info_voiture,
                'Ancien_Statut': item.ancien_statut || 'Création',
                'Nouveau_Statut': item.nouveau_statut
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");
            XLSX.writeFile(workbook, "historique-reservations.xlsx");
        });
    }

    // --- Lancement au chargement de la page ---
    loadReservations();
});
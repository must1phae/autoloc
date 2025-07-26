// frontend/js/dashboard-admin.js - VERSION MISE À JOUR AVEC STATS

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Éléments de la page principale
    const carListTableBody = document.querySelector('#admin-cars-table tbody');
    const addCarBtn = document.getElementById('add-car-btn');

    // NOUVEAU : Sélecteurs pour les cartes de statistiques
    const totalBookingsSpan = document.getElementById('total-bookings-stat');
    const availableCarsSpan = document.getElementById('available-cars-stat');
    const activeUsersSpan = document.getElementById('active-users-stat');

    // Éléments de la modale (inchangés)
    const modalOverlay = document.getElementById('admin-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('admin-modal-close-btn');
    const carForm = document.getElementById('car-form-modal');

    
    // =========================================================
    // ==     NOUVELLE FONCTION POUR CHARGER LES STATISTIQUES   ==
    // =========================================================
    async function loadStats() {
        if (!totalBookingsSpan || !availableCarsSpan || !activeUsersSpan) return;

        try {
            const response = await fetch(`${API_URL}?action=getDashboardStats`);
            const result = await response.json();

            if (result.success) {
                const stats = result.data;
                totalBookingsSpan.textContent = stats.totalBookings;
                availableCarsSpan.textContent = stats.availableCars;
                activeUsersSpan.textContent = stats.activeUsers;
            } else {
                console.error("Erreur lors de la récupération des stats:", result.message);
            }
        } catch (error) {
            console.error("Erreur réseau lors du chargement des stats:", error);
        }
    }


    // --- CHARGEMENT INITIAL DES VOITURES (INCHANGÉ) ---
    async function loadCars() {
        if (!carListTableBody) return;
        try {
            const response = await fetch(`${API_URL}?action=getAllCars`);
            const result = await response.json();
            
            carListTableBody.innerHTML = '';
            if (result.success && result.data) {
                result.data.forEach(car => {
                    const row = document.createElement('tr');
                    // Vos chemins et liens sont conservés
                    row.innerHTML = `
                        <td><img src="../../uploads/cars/${car.image}" alt="${car.marque}" class="table-car-image"></td>
                        <td><strong>${car.marque}</strong> ${car.modele}</td>
                        <td>${car.prix_par_jour} €</td>
                        <td><span class="status status-${car.statut}">${car.statut}</span></td>
                        <td class="action-buttons">
                            <button class="btn-action btn-edit" data-id="${car.id_voiture}">Modifier</button>
                            <button class="btn-action btn-delete" data-id="${car.id_voiture}">Supprimer</button>
                        </td>
                    `;
                    carListTableBody.appendChild(row);
                });
            }
        } catch (error) {
            carListTableBody.innerHTML = '<tr><td colspan="5">Erreur de chargement des données.</td></tr>';
        }
    }

    // --- GESTION DE LA MODALE (INCHANGÉ) ---
    function openModal() { modalOverlay.classList.remove('modal-hidden'); }
    function closeModal() { modalOverlay.classList.add('modal-hidden'); carForm.reset(); }

    addCarBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Ajouter une nouvelle voiture';
        carForm.reset();
        carForm.id_voiture_modal.value = '';
        openModal();
    });
    carListTableBody.addEventListener('click', async (e) => {
        const target = e.target;

        // Clic sur "Modifier"
        if (target.classList.contains('btn-edit')) {
            const carId = target.dataset.id;
            const response = await fetch(`${API_URL}?action=getCarDetails&id=${carId}`);
            const result = await response.json();
            if (result.success) {
                const car = result.data;
                modalTitle.textContent = `Modifier : ${car.marque} ${car.modele}`;
                carForm.id_voiture_modal.value = car.id_voiture;
                carForm.marque_modal.value = car.marque;
                carForm.modele_modal.value = car.modele;
                carForm.type_modal.value = car.type;
                carForm.prix_par_jour_modal.value = car.prix_par_jour;
                carForm.annee_modal.value = car.annee;
                carForm.statut_modal.value = car.statut;
                openModal();
            }
        }

        // Clic sur "Supprimer"
        if (target.classList.contains('btn-delete')) {
            const carId = target.dataset.id;
            const carName = target.closest('tr').querySelector('td:nth-child(2)').textContent.trim();
            if (confirm(`Êtes-vous sûr de vouloir supprimer "${carName}" ?`)) {
                // =========================================================
                // == MODIFICATION : On envoie "id_voiture" au lieu de "id" ==
                // =========================================================
                const response = await fetch(`${API_URL}?action=adminDeleteCar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_voiture: carId }) // <-- MODIFIÉ
                });
                const result = await response.json();
                if (result.success) {
                    alert(result.message);
                    loadCars();
                } else {
                    alert(`Erreur : ${result.message}`);
                }
            }
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closeModal());

    // --- SOUMISSION DU FORMULAIRE (AJOUT OU MODIFICATION) ---
    carForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const carId = carForm.id_voiture_modal.value;
        const url = carId ? `${API_URL}?action=adminUpdateCar` : `${API_URL}?action=adminAddCar`;

        // =========================================================
        // == MODIFICATION : On utilise une soumission de formulaire classique
        // == pour gérer la redirection du backend.
        // =========================================================
        const form = e.target;
        form.action = url; // On définit l'URL d'action dynamiquement
        form.method = 'POST';
        form.enctype = 'multipart/form-data'; // Important pour l'upload de fichier
        
        // On soumet le formulaire de manière traditionnelle, ce qui suivra la redirection du PHP.
        form.submit(); 
    });
loadStats(); 
    loadCars();
});
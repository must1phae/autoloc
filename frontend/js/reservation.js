// frontend/js/reservation.js - VERSION FINALE AVEC MODALE ET CALENDRIER INTERACTIF

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Éléments de la modale de réservation
    const reservationModalOverlay = document.getElementById('reservation-modal-overlay');
    const reservationModalContent = document.getElementById('reservation-modal-content');
    const reservationModalCloseBtn = document.getElementById('reservation-modal-close-btn');

    // --- LOGIQUE D'OUVERTURE DE LA MODALE ---
    document.body.addEventListener('click', (e) => {
        const reserveButton = e.target.closest('.btn-reserve');
        if (reserveButton) {
            e.preventDefault();
            const carId = reserveButton.dataset.id;
            const carName = reserveButton.dataset.name;
            const carPrice = reserveButton.dataset.price;
            openReservationModal(carId, carName, carPrice);
        }
    });

    // --- Ouvre la modale, affiche le formulaire et initialise le calendrier ---
    async function openReservationModal(carId, carName, carPrice) {
        if (!reservationModalOverlay) return;
window.openReservationModal = openReservationModal;
        // 1. Afficher la modale et la structure du formulaire
        reservationModalOverlay.classList.remove('modal-hidden');
        reservationModalContent.innerHTML = `
            <div class="reservation-form-header">
                <h3>Réserver la ${carName}</h3>
                <p>Prix : <strong>${carPrice} €/jour</strong></p>
            </div>
            <form id="reservation-form-modal">
                <div class="form-row">
                    <div class="input-group">
                        <label for="date_debut">Date de début :</label>
                        <input type="text" id="date_debut" name="date_debut" placeholder="Choisir une date" required>
                    </div>
                    <div class="input-group">
                        <label for="date_fin">Date de fin :</label>
                        <input type="text" id="date_fin" name="date_fin" placeholder="Choisir une date" required>
                    </div>
                </div>
                <div id="reservation-summary"></div>
                <input type="hidden" name="id_voiture" value="${carId}">
                <input type="hidden" name="prix_par_jour" value="${carPrice}">
                <button type="submit" class="btn btn-primary">Confirmer la réservation</button>
            </form>
            <div id="reservation-message" class="message"></div>
        `;

        // 2. Initialiser les calendriers avec flatpickr
        await initializeCalendars(carId);

        // 3. Ajouter les écouteurs pour le calcul du prix
        const dateDebutInput = document.getElementById('date_debut');
        const dateFinInput = document.getElementById('date_fin');
        dateDebutInput._flatpickr.config.onChange.push(updateReservationSummary);
        dateFinInput._flatpickr.config.onChange.push(updateReservationSummary);
    }    window.openReservationModal = openReservationModal;

    // --- Initialise les calendriers Flatpickr avec les dates désactivées ---
    async function initializeCalendars(carId) {
        const dateDebutInput = document.getElementById('date_debut');
        const dateFinInput = document.getElementById('date_fin');

        const bookedDatesResponse = await fetch(`${API_URL}?action=getCarBookedDates&id=${carId}`);
        const bookedDatesResult = await bookedDatesResponse.json();
        
        let disabledRanges = [];
        if (bookedDatesResult.success) {
            disabledRanges = bookedDatesResult.data.map(range => ({
                from: range.date_debut,
                to: range.date_fin
            }));
        }
        
        const fpFin = flatpickr(dateFinInput, {
            locale: "fr",
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: disabledRanges
        });

        flatpickr(dateDebutInput, {
            locale: "fr",
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: disabledRanges,
            onChange: function(selectedDates) {
                if (selectedDates[0]) {
                    // La date de fin doit être au moins la date de début
                    fpFin.set('minDate', selectedDates[0]);
                }
            }
        });
    }
    
    // --- Met à jour le résumé du prix ---
    function updateReservationSummary() {
        const summaryDiv = document.getElementById('reservation-summary');
        const dateDebut = document.getElementById('date_debut')._flatpickr.selectedDates[0];
        const dateFin = document.getElementById('date_fin')._flatpickr.selectedDates[0];
        const pricePerDay = parseFloat(document.querySelector('#reservation-form-modal input[name="prix_par_jour"]').value);

        if (dateDebut && dateFin && dateFin >= dateDebut) {
            const timeDiff = dateFin.getTime() - dateDebut.getTime();
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 pour inclure le premier jour
            const totalPrice = days * pricePerDay;
            summaryDiv.innerHTML = `<p><strong>Durée :</strong> ${days} jour(s)</p><p><strong>Prix total estimé :</strong> ${totalPrice.toFixed(2)} €</p>`;
        } else {
            summaryDiv.innerHTML = '';
        }
    }
    
    // --- Gère la soumission du formulaire ---
    document.body.addEventListener('submit', async (e) => {
        if (e.target.id === 'reservation-form-modal') {
            e.preventDefault();
            const form = e.target;
            const messageDiv = document.getElementById('reservation-message');
            const data = Object.fromEntries(new FormData(form).entries());

            messageDiv.className = 'message';
            messageDiv.textContent = 'Envoi de votre demande...';
            
            const response = await fetch(`${API_URL}?action=createReservation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.success) {
                messageDiv.className = 'message message-success';
                messageDiv.innerHTML = `<strong>Réservation réussie !</strong><br>${result.message}`;
                form.style.display = 'none';
                setTimeout(() => { closeReservationModal(); }, 3000);
            } else {
                messageDiv.className = 'message message-error';
                messageDiv.textContent = result.message || "Une erreur est survenue.";
            }
        }
    });

    // --- LOGIQUE DE FERMETURE (INCHANGÉE) ---
    function closeReservationModal() {
        if (reservationModalOverlay) {
            reservationModalOverlay.classList.add('modal-hidden');
            reservationModalContent.innerHTML = '';
        }
    }
    if(reservationModalCloseBtn) { reservationModalCloseBtn.addEventListener('click', closeReservationModal); }
    if(reservationModalOverlay) { reservationModalOverlay.addEventListener('click', (e) => { if(e.target === reservationModalOverlay) closeReservationModal(); }); }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !reservationModalOverlay.classList.contains('modal-hidden')) closeReservationModal(); });
});
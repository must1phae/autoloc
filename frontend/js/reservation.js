// frontend/js/reservation.js - VERSION AVEC CALENDRIER INTERACTIF

document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    const carInfoDiv = document.getElementById('car-info');
    const form = document.getElementById('reservation-form');
    const idVoitureInput = document.getElementById('id_voiture');
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const totalPriceSpan = document.getElementById('total-price');
    const messageDiv = document.getElementById('message');

    let prixParJour = 0;

    // 1. Votre code de vérification d'authentification (INCHANGÉ)
    const authResponse = await fetch(`${API_URL}?action=checkAuth`);
    const authResult = await authResponse.json();
    if (!authResult.isLoggedIn) {
        window.location.href = 'auth.html';
        return;
    }
    if (authResult.user.role === 'admin') {
        window.location.href = 'dashboard-admin.html';
        return;
    }

    // 2. Votre code pour récupérer l'ID et les détails de la voiture (INCHANGÉ)
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (carId) {
        idVoitureInput.value = carId;
        const carResponse = await fetch(`${API_URL}?action=getCarDetails&id=${carId}`);
        const carResult = await carResponse.json();
        if (carResult.success) {
            const car = carResult.data;
            prixParJour = parseFloat(car.prix_par_jour);
            carInfoDiv.innerHTML = `<h3>${car.marque} ${car.modele}</h3><p>Prix: ${prixParJour.toFixed(2)} €/jour</p>`;
            
            // =========================================================
            // ==     NOUVELLE PARTIE : INITIALISATION DU CALENDRIER    ==
            // =========================================================
            initializeCalendars(carId);

        }
    } else {
        document.getElementById('reservation-container').innerHTML = "<p>Erreur: Aucune voiture sélectionnée.</p>";
        return;
    }
    
    // Nouvelle fonction pour initialiser les calendriers
    async function initializeCalendars(carId) {
        // On récupère les dates déjà réservées
        const bookedDatesResponse = await fetch(`${API_URL}?action=getCarBookedDates&id=${carId}`);
        const bookedDatesResult = await bookedDatesResponse.json();
        
        let disabledRanges = [];
        if (bookedDatesResult.success) {
            disabledRanges = bookedDatesResult.data.map(range => ({
                from: range.date_debut,
                to: range.date_fin
            }));
        }
        
        // Configuration de flatpickr pour le champ de début
        const fpDebut = flatpickr(dateDebutInput, {
            locale: "fr", // Langue française
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: disabledRanges,
            onChange: function(selectedDates, dateStr, instance) {
                // Quand on choisit une date de début, on met à jour la date minimale du champ de fin
                if (selectedDates[0]) {
                    fpFin.set('minDate', selectedDates[0]);
                }
            }
        });

        // Configuration de flatpickr pour le champ de fin
        const fpFin = flatpickr(dateFinInput, {
            locale: "fr",
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: disabledRanges
        });
    }

    // 3. Votre fonction pour calculer le prix total (INCHANGÉE)
    function calculatePrice() {
        // ... (votre code existant ici)
        const dateDebut = new Date(dateDebutInput.value);
        const dateFin = new Date(dateFinInput.value);
        if (dateDebutInput.value && dateFinInput.value && dateFin >= dateDebut) {
            const timeDiff = dateFin.getTime() - dateDebut.getTime();
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            const total = days * prixParJour;
            totalPriceSpan.textContent = `${total.toFixed(2)} €`;
        } else {
            totalPriceSpan.textContent = '0.00 €';
        }
    }

    // 4. Vos écouteurs d'événements (INCHANGÉS)
    dateDebutInput.addEventListener('change', calculatePrice);
    dateFinInput.addEventListener('change', calculatePrice);

    // 5. Votre logique de soumission du formulaire (INCHANGÉE)
    form.addEventListener('submit', async (e) => {
        // ... (votre code existant ici)
        e.preventDefault();
        const reservationData = { id_voiture: idVoitureInput.value, date_debut: dateDebutInput.value, date_fin: dateFinInput.value };
        const response = await fetch(`${API_URL}?action=createReservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservationData)
        });
        const result = await response.json();
        if (result.success) {
            messageDiv.className = 'message message-success';
            messageDiv.textContent = result.message + " Vous allez être redirigé...";
            setTimeout(() => { window.location.href = 'dashboard-client.html'; }, 3000);
        } else {
            messageDiv.className = 'message message-error';
            messageDiv.textContent = result.message;
        }
    });
});
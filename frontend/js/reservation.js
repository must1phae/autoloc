// frontend/js/reservation.js

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

    // 1. Vérifier si l'utilisateur est connecté
    const authResponse = await fetch(`${API_URL}?action=checkAuth`);
    const authResult = await authResponse.json();

   if (!authResult.isLoggedIn) {
    // Pas connecté -> login
    window.location.href = 'auth.html';
    return; // On arrête l'exécution du script
}

if (authResult.user.role === 'admin') {
    // C'est un admin, il n'a rien à faire ici
    window.location.href = 'dashboard-admin.html';
    return; // On arrête l'exécution
}


    // 2. Récupérer l'ID de la voiture depuis l'URL et charger ses infos
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
        }
    } else {
        document.getElementById('reservation-container').innerHTML = "<p>Erreur: Aucune voiture sélectionnée.</p>";
        return;
    }

    // 3. Fonction pour calculer le prix total
    function calculatePrice() {
        const dateDebut = new Date(dateDebutInput.value);
        const dateFin = new Date(dateFinInput.value);

        if (dateDebutInput.value && dateFinInput.value && dateFin >= dateDebut) {
            const timeDiff = dateFin.getTime() - dateDebut.getTime();
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 pour inclure le premier jour
            const total = days * prixParJour;
            totalPriceSpan.textContent = `${total.toFixed(2)} €`;
        } else {
            totalPriceSpan.textContent = '0.00 €';
        }
    }

    // 4. Mettre à jour le prix quand les dates changent
    dateDebutInput.addEventListener('change', calculatePrice);
    dateFinInput.addEventListener('change', calculatePrice);

    // 5. Gérer la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const reservationData = {
            id_voiture: idVoitureInput.value,
            date_debut: dateDebutInput.value,
            date_fin: dateFinInput.value
        };

        const response = await fetch(`${API_URL}?action=createReservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservationData)
        });

        const result = await response.json();

        if (result.success) {
            messageDiv.style.color = 'green';
            messageDiv.textContent = result.message + " Vous allez être redirigé...";
            setTimeout(() => {
                // Rediriger vers le tableau de bord du client
                window.location.href = 'dashboard-client.html';
            }, 3000);
        } else {
            messageDiv.style.color = 'red';
            messageDiv.textContent = result.message;
        }
    });
});

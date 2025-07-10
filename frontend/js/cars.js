// frontend/js/cars.js
document.addEventListener('DOMContentLoaded', () => {
    const carsContainer = document.getElementById('cars-container');
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    async function fetchAndDisplayCars() {
        try {
            const response = await fetch(`${API_URL}?action=getAllCars`);
            const result = await response.json();

            // ============ AJOUTEZ CETTE LIGNE D'ESPIONNAGE N°1 ============
            console.log("Données brutes reçues du serveur :", result); 
            // ==========================================================

            if (result.success && result.data && result.data.length > 0) {
                carsContainer.innerHTML = ''; 
                
                result.data.forEach(car => {

                    // ============ AJOUTEZ CETTE LIGNE D'ESPIONNAGE N°2 ============
                    console.log("Traitement de la voiture :", car);
                    // ==========================================================

                    const carCard = document.createElement('div');
                    carCard.className = 'car-card';
                    
                    carCard.innerHTML = `
                        <img src="../../uploads/cars/${car.image ? car.image : 'default.jpg'}" alt="${car.marque} ${car.modele}">

                        <h3>${car.marque} ${car.modele}</h3>
                        <p>Type : ${car.type}</p>
                        <p class="price"><strong>${car.prix_par_jour} €</strong> / jour</p>
                        <a href="car-details.html?id=${car.id_voiture}" class="btn">Voir les détails & Réserver</a>
                        
                    `;
                    carsContainer.appendChild(carCard);
                });
            } else {
                // Cette partie s'exécute si result.success est false ou si result.data est vide
                carsContainer.innerHTML = '<p>Aucune voiture disponible pour le moment.</p>';
                console.log("Raison de l'échec : ", result.message || "La liste de données est vide.");
            }
        } catch (error) {
            console.error('Erreur finale dans le bloc catch:', error);
            carsContainer.innerHTML = '<p>Impossible de charger les voitures.</p>';
        }
    }

    fetchAndDisplayCars();
});
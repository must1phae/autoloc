// frontend/js/edit-car.js

document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const formContainer = document.getElementById('edit-form-container');

    // 1. Récupérer l'ID de la voiture depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        formContainer.innerHTML = "<p>Erreur : ID de voiture manquant.</p>";
        return;
    }

    // 2. Récupérer les détails de la voiture
    const carResponse = await fetch(`${API_URL}?action=getCarDetails&id=${carId}`);
    const carResult = await carResponse.json();

    if (carResult.success) {
        const car = carResult.data;
        
        // 3. Construire le formulaire et le pré-remplir
        formContainer.innerHTML = `
            <form action="../../backend/routes/api.php?action=adminUpdateCar" method="POST">
                <input type="hidden" name="id_voiture" value="${car.id_voiture}">
                
                <label for="marque">Marque</label>
                <input type="text" name="marque" value="${car.marque}" required>
                
                <label for="modele">Modèle</label>
                <input type="text" name="modele" value="${car.modele}" required>
                
                <label for="type">Type</label>
                <input type="text" name="type" value="${car.type}" required>
                
                <label for="prix_par_jour">Prix/jour</label>
                <input type="number" name="prix_par_jour" value="${car.prix_par_jour}" step="0.01" required>
                
                <label for="annee">Année</label>
                <input type="number" name="annee" value="${car.annee}" required>
                
                <label for="statut">Statut</label>
                <select name="statut" required>
                    <option value="disponible" ${car.statut === 'disponible' ? 'selected' : ''}>Disponible</option>
                    <option value="réservée" ${car.statut === 'réservée' ? 'selected' : ''}>Réservée</option>
                    <option value="maintenance" ${car.statut === 'maintenance' ? 'selected' : ''}>En maintenance</option>
                    <option value="désactivée" ${car.statut === 'désactivée' ? 'selected' : ''}>Désactivée</option>
                </select>

                <button type="submit">Mettre à jour</button>
            </form>
        `;
    } else {
        formContainer.innerHTML = "<p>Impossible de charger les données de la voiture.</p>";
    }
});
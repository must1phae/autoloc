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
    
                <label for="description">Description</label>
                <textarea name="description" id="description-textarea" rows="5">${car.description || ''}</textarea>
                <button type="button" id="generate-desc-btn">Générer avec l'IA</button>

                <button type="submit">Mettre à jour</button>
            </form>
        `;
        // ===============================================
        // ==  ÉCOUTEUR D'ÉVÉNEMENT POUR LE NOUVEAU BOUTON
        // ===============================================
        const generateBtn = document.getElementById('generate-desc-btn');
        const descTextarea = document.getElementById('description-textarea');

        generateBtn.addEventListener('click', async () => {
            // On récupère les valeurs actuelles des champs
            const marque = document.querySelector('input[name="marque"]').value;
            const modele = document.querySelector('input[name="modele"]').value;
            const type = document.querySelector('input[name="type"]').value;
            const annee = document.querySelector('input[name="annee"]').value;

            if (!marque || !modele) {
                alert("Veuillez renseigner au moins la marque et le modèle.");
                return;
            }

            generateBtn.textContent = 'Génération en cours...';
            generateBtn.disabled = true;

            const response = await fetch(`${API_URL}?action=generateDescription`, {
                method: 'POST',
                body: JSON.stringify({ marque, modele, type, annee })
            });
            const result = await response.json();

            if (result.success) {
                descTextarea.value = result.description;
            } else {
                alert("Erreur lors de la génération.");
            }
            
            generateBtn.textContent = "Générer avec l'IA";
            generateBtn.disabled = false;
        });
    } else {
        formContainer.innerHTML = "<p>Impossible de charger les données de la voiture.</p>";
    }
    
});

// frontend/js/dashboard-client.js
document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    
    // Étape 1 : Vérifier l'authentification
    const response = await fetch(`${API_URL}?action=checkAuth`);
    const authResult = await response.json();

    if (!authResult.isLoggedIn || authResult.user.role !== 'client') {
        // Si l'utilisateur n'est PAS un client connecté, on le renvoie
        window.location.href = 'login.html';
        return; // Arrêter l'exécution du script
    }

    // Étape 2 : Si l'utilisateur est bien un client, on continue
    console.log("Bienvenue sur votre tableau de bord !");
    // C'est ici que vous ferez un autre fetch pour récupérer les réservations du client.
});
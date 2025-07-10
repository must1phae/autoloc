<?php 
// Fichier : backend/routes/api.php

// Headers pour autoriser les requêtes cross-origin (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();

require_once '../config/db.php';
require_once '../models/User.php';
require_once '../models/Car.php';
require_once '../models/Reservation.php';
$userModel = new User($pdo);
$carModel = new Car($pdo);
// Initialiser le nouveau modèle
$reservationModel = new Reservation($pdo);

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($action) {
    case 'getAllCars':
        if ($method == 'GET') {
            try {
                $cars = $carModel->getAllAvailable(); 
                echo json_encode(['success' => true, 'data' => $cars]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erreur interne du serveur: ' . $e->getMessage()]);
            }
        }
        break;

    case 'getCarDetails':
        if ($method == 'GET' && isset($_GET['id'])) {
            $car = $carModel->getById($_GET['id']);
            echo json_encode(['success' => true, 'data' => $car]);
        }
        break;

    case 'register':
        if ($method == 'POST') {
            // Validation simple des données
            if (!empty($data['nom']) && !empty($data['prenom']) && !empty($data['email']) && !empty($data['password'])) {
                $success = $userModel->register($data['nom'], $data['prenom'], $data['email'], $data['password']);
                if ($success) {
                    echo json_encode(['success' => true, 'message' => 'Inscription réussie. Vous pouvez maintenant vous connecter.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs.']);
            }
        }
        break;
        
   // Dans backend/routes/api.php

// ...

case 'login':
    if ($method == 'POST') {
        if (!empty($data['email']) && !empty($data['password'])) {
            $user = $userModel->login($data['email'], $data['password']);
            if ($user) {
                // Stocker les infos de l'utilisateur dans la session
                $_SESSION['user_id'] = $user['id_user'];
                $_SESSION['user_role'] = $user['role'];

                // On renvoie le nom et SURTOUT le rôle au frontend
                echo json_encode([
                    'success' => true, 
                    'message' => 'Connexion réussie.', 
                    'user' => [
                        'nom' => $user['nom'], 
                        'role' => $user['role'] // <-- LA PARTIE CRUCIALE !
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect.']);
            }
        }
    }
    break;

// ...
case 'createReservation':
        // On vérifie d'abord si l'utilisateur est connecté. C'est une route protégée.
        if ($method == 'POST' && isset($_SESSION['user_id'])) {
            
            // On récupère les données envoyées par le formulaire JS
            $id_user = $_SESSION['user_id'];
            $id_voiture = $data['id_voiture'];
            $date_debut = $data['date_debut'];
            $date_fin = $data['date_fin'];

            // SÉCURITÉ : Ne jamais faire confiance au prix envoyé par le client.
            // On le recalcule côté serveur.
            $carModel = new Car($pdo);
            $car = $carModel->getById($id_voiture);

            if (!$car) {
                echo json_encode(['success' => false, 'message' => 'Voiture non valide.']);
                exit();
            }

            // Calcul du nombre de jours
            $start = new DateTime($date_debut);
            $end = new DateTime($date_fin);
            $interval = $start->diff($end);
            $days = $interval->days + 1; // +1 pour inclure le premier jour

            $montant_total = $days * $car['prix_par_jour'];

            // On tente de créer la réservation
            $success = $reservationModel->create($id_user, $id_voiture, $date_debut, $date_fin, $montant_total);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Réservation enregistrée avec succès !']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement de la réservation.']);
            }
        } else {
            // Si l'utilisateur n'est pas connecté
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Accès refusé. Veuillez vous connecter.']);
        }
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Déconnexion réussie.']);
        break;

    case 'checkAuth': // Pour vérifier si l'utilisateur est toujours connecté
        if(isset($_SESSION['user_id'])) {
            $user = $userModel->findById($_SESSION['user_id']);
            echo json_encode(['success' => true, 'isLoggedIn' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => true, 'isLoggedIn' => false]);
        }
        break;
        

    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Action non reconnue.']);
        break;

}
?>
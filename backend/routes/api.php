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
function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}
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
         case 'getUserReservations':
        // On vérifie si l'utilisateur est bien connecté
        if ($method == 'GET' && isset($_SESSION['user_id'])) {
            $id_user = $_SESSION['user_id'];
            
            // On appelle la nouvelle fonction du modèle
            $reservations = $reservationModel->getByUserId($id_user);

            echo json_encode(['success' => true, 'data' => $reservations]);
        } else {
            // Si non connecté, on renvoie une erreur
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Accès non autorisé.']);
        }
        break;
    // Pour la déconnexion, on détruit simplement la session
    // On n'a pas besoin de vérifier le rôle ici, car c'est une action simple
    // qui ne nécessite pas de permissions spéciales.
    // On peut aussi renvoyer un message de succès.
    // On n'a pas besoin de vérifier le rôle ici, car c'est une action simple
    // qui ne nécessite pas de permissions spéciales.
      case 'adminGetAllCars':
        if (isAdmin()) {
            $cars = $carModel->getAllForAdmin();
            echo json_encode(['success' => true, 'data' => $cars]);
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
        }
        break;

    case 'adminAddCar':
        if (isAdmin() && $method == 'POST') {
            
            // On récupère les données du formulaire
            $marque = $_POST['marque'];
            $modele = $_POST['modele'];
            $type = $_POST['type'];
            $prix = $_POST['prix_par_jour'];
            $annee = $_POST['annee'];
            $statut = $_POST['statut']; // <-- ON RÉCUPÈRE LE NOUVEAU CHAMP

            $image_name = 'default.jpg'; 

            if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
                // ... (votre code d'upload d'image reste le même)
                $target_dir = "../../uploads/cars/";
                $image_name = uniqid() . '-' . basename($_FILES["image"]["name"]);
                $target_file = $target_dir . $image_name;
                move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
            }
            
            // On passe le statut à la fonction create()
            $success = $carModel->create($marque, $modele, $type, $prix, $annee, $image_name, $statut);

            if ($success) {
                header('Location: ../../frontend/pages/dashboard-admin.html?message=success');
            } else {
                header('Location: ../../frontend/pages/add-car.html?message=error');
            }
            exit();
        }
        break;
        
    // Vous ajouterez 'adminUpdateCar' et 'adminDeleteCar' sur le même principe.
     case 'adminUpdateCar':
        if (isAdmin() && $method == 'POST') {
            // On récupère les données du formulaire
            $id = $_POST['id_voiture'];
            $marque = $_POST['marque'];
            $modele = $_POST['modele'];
            $type = $_POST['type'];
            $prix = $_POST['prix_par_jour'];
            $annee = $_POST['annee'];
            $statut = $_POST['statut'];

            $success = $carModel->update($id, $marque, $modele, $type, $prix, $annee, $statut);

            if ($success) {
                header('Location: ../../frontend/pages/dashboard-admin.html?message=update_success');
            } else {
                header('Location: ../../frontend/pages/edit-car.html?id=' . $id . '&message=error');
            }
            exit();
        }
        break;

    case 'adminDeleteCar':
        if (isAdmin() && $method == 'POST') {
            // Les données sont envoyées en JSON par notre JS
            $data = json_decode(file_get_contents("php://input"), true);
            $id = $data['id_voiture'];

            $success = $carModel->delete($id);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Voiture supprimée avec succès.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression. La voiture est peut-être liée à une réservation existante.']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
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
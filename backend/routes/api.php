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
require_once '../models/Document.php';
// On suppose que vous avez déjà créé le modèle Avis.php
require_once '../models/Avis.php';
require_once '../ai/description.php';
 // Initialiser les modèles
$userModel = new User($pdo);
$carModel = new Car($pdo);
// Initialiser le nouveau modèle
$avisModel = new Avis($pdo);
$documentModel = new Document($pdo);
// Initialiser le modèle de réservation
// On suppose que vous avez déjà créé le modèle Reservation.php
// et que vous avez une méthode pour créer une réservation. 
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
            
            // ===============================================
            // == RÉCUPÉRATION DU NOUVEAU CHAMP DESCRIPTION ==
            // ===============================================
            $description = $_POST['description'];

            // On passe la nouvelle variable à la fonction du modèle
            $success = $carModel->update($id, $marque, $modele, $type, $prix, $annee, $statut, $description);

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
         // ===============================================
    // ==     NOUVELLES ROUTES GESTION UTILISATEURS   ==
    // ===============================================

    case 'adminGetAllUsers':
        if (isAdmin()) {
            $users = $userModel->getAll($_SESSION['user_id']); // On passe l'ID de l'admin
            echo json_encode(['success' => true, 'data' => $users]);
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
        }
        break;

    case 'adminUpdateUserRole':
        if (isAdmin() && $method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            $success = $userModel->updateRole($data['id_user'], $data['role']);
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Rôle mis à jour.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour.']);
            }
        }
        break;

    case 'adminDeleteUser':
        if (isAdmin() && $method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            $success = $userModel->delete($data['id_user']);
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression.']);
            }
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
         // ===============================================
    // ==   NOUVELLES ROUTES GESTION RÉSERVATIONS   ==
    // ===============================================

    case 'adminGetAllReservations':
        if (isAdmin()) {
            $reservations = $reservationModel->getAll();
            echo json_encode(['success' => true, 'data' => $reservations]);
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
        }
        break;

    case 'adminUpdateReservationStatus':
        if (isAdmin() && $method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            $success = $reservationModel->updateStatus($data['id_reservation'], $data['statut']);
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Statut de la réservation mis à jour.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour.']);
            }
        }
        break;
         // ===============================================
    // ==         NOUVELLES ROUTES DOCUMENTS        ==
    // ===============================================

    case 'uploadDocument': // Pour le client
        if (isset($_SESSION['user_id']) && $method == 'POST') {
            $id_user = $_SESSION['user_id'];
            $type_doc = $_POST['type_doc'];
            $file_name = 'default.pdf';

            if (isset($_FILES['document_file']) && $_FILES['document_file']['error'] == 0) {
                $target_dir = "../../uploads/documents/";
                // On préfixe avec l'ID de l'utilisateur pour l'organisation
                $file_name = $id_user . '-' . uniqid() . '-' . basename($_FILES["document_file"]["name"]);
                $target_file = $target_dir . $file_name;
                move_uploaded_file($_FILES["document_file"]["tmp_name"], $target_file);
            }

            $documentModel->create($id_user, $type_doc, $file_name);
            header('Location: ../../frontend/pages/upload-documents.html?message=success');
            exit();
        }
        break;

    case 'getUserDocuments': // Pour le client
        if (isset($_SESSION['user_id'])) {
            $docs = $documentModel->getByUserId($_SESSION['user_id']);
            echo json_encode(['success' => true, 'data' => $docs]);
        }
        break;

    case 'adminGetPendingDocuments': // Pour l'admin
        if (isAdmin()) {
            $docs = $documentModel->getPending();
            echo json_encode(['success' => true, 'data' => $docs]);
        }
        break;

    case 'adminUpdateDocumentStatus': // Pour l'admin
        if (isAdmin() && $method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            $success = $documentModel->updateStatus($data['id_doc'], $data['statut']);
            echo json_encode(['success' => $success]);
        }
        break;
        
   
case 'leaveReview':
    // L'utilisateur est-il bien connecté ?
    if (isset($_SESSION['user_id']) && $method == 'POST') {
        
        // On récupère le corps de la requête JSON envoyée par le JS
        $data = json_decode(file_get_contents("php://input"), true);

        // --- POINT DE DÉBOGAGE N°1 ---
        // Est-ce que les données sont bien reçues et décodées ?
        if ($data === null) {
            // Si $data est null, le JSON est mal formé ou vide.
            error_log("API leaveReview: Erreur de décodage JSON.");
            echo json_encode(['success' => false, 'message' => 'Données invalides.']);
            exit();
        }

        // --- POINT DE DÉBOGAGE N°2 ---
        // Est-ce que toutes les clés nécessaires sont présentes ?
        if (!isset($data['id_voiture'], $data['note'], $data['commentaire'])) {
            error_log("API leaveReview: Données manquantes. Reçu: " . print_r($data, true));
            echo json_encode(['success' => false, 'message' => 'Données manquantes.']);
            exit();
        }

        // Appel de la fonction du modèle
        $success = $avisModel->create(
            $_SESSION['user_id'],
            $data['id_voiture'],
            $data['note'],
            $data['commentaire']
        );

        // La fonction create() a renvoyé false.
        echo json_encode(['success' => $success]);

    } else {
        // L'utilisateur n'est pas connecté ou la méthode n'est pas POST
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    }
    break;
 case 'getCarReviews': // <-- Est-ce que le nom est EXACTEMENT celui-ci ?
        if (isset($_GET['id'])) {
            $avisModel = new Avis($pdo); // Assurez-vous que $avisModel est initialisé
            $reviews = $avisModel->getByCarId($_GET['id']);
            echo json_encode(['success' => true, 'data' => $reviews]);
        }
        break;
        
} 
?>
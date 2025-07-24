<?php 
// Fichier : backend/routes/api.php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
// Headers pour autoriser les requêtes cross-origin (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

 
session_start();
require '../../vendor/autoload.php';
require_once '../config/db.php';
require_once '../models/User.php';
require_once '../models/Car.php';
require_once '../models/Reservation.php';
require_once '../models/Document.php';
// On suppose que vous avez déjà créé le modèle Avis.php
require_once '../models/Avis.php';
// Inclure le nouveau modèle
require_once '../models/Message.php';
// ... (vos autres require_once)

// Initialiser le nouveau modèle
$messageModel = new Message($pdo);
// ... (vos autres initialisations)
 
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
 
function sendPasswordResetEmail($userEmail, $token) {
    $resetLink = "http://localhost/autoloc/frontend/pages/reset-password.html?token=" . $token;

    $mail = new PHPMailer(true);
    try {
        // --- CONFIGURATION DE VOTRE SERVEUR SMTP (EXEMPLE POUR GMAIL) ---
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'mostaphaelghazal102030@gmail.com';     // VOTRE ADRESSE GMAIL
        $mail->Password   = 'ojqv vktr hucv jkcp';        // VOTRE MOT DE PASSE D'APPLICATION GMAIL
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';

        // Destinataires
        $mail->setFrom('no-reply@autoloc.com', 'AutoLoc Support');
        $mail->addAddress($userEmail);

        // Contenu
        $mail->isHTML(true);
        $mail->Subject = 'Réinitialisation de votre mot de passe - AutoLoc';
        $mail->Body    = "<p>Bonjour,</p><p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expirera dans une heure.</p><a href='{$resetLink}' style='background-color:#111; color:white; padding:12px 25px; text-decoration:none; border-radius:50px;'>Réinitialiser mon mot de passe</a>";
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("PHPMailer Error: {$mail->ErrorInfo}");
        return false;
    }
}

function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}
switch ($action) {
    case 'getAllCars':
        if ($method == 'GET') {
            // On vérifie si un paramètre 'limit' est présent dans l'URL
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;
            
            // On appelle la fonction du modèle avec la limite (qui peut être null)
            $cars = $carModel->getAllAvailable($limit);

            echo json_encode(['success' => true, 'data' => $cars]);
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
   case 'updateUserProfile':
        if (isset($_SESSION['user_id']) && $method == 'POST') {
            $id_user = $_SESSION['user_id'];
            $data = json_decode(file_get_contents("php://input"), true);
            
            // On vérifie que les données de base sont là
            if (isset($data['nom'], $data['prenom'])) {
                // Le mot de passe est optionnel
                $password = $data['password'] ?? null;
                
                $success = $userModel->updateProfile($id_user, $data['nom'], $data['prenom'], $password);
                
                if ($success) {
                    echo json_encode(['success' => true, 'message' => 'Profil mis à jour avec succès.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour du profil.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Données manquantes.']);
            }
        }
        break;

// ...
case 'login':
    // 1. On vérifie d'abord que la méthode HTTP est bien POST.
    if ($method !== 'POST') {
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
        break; // Arrêt immédiat
    }

    // 2. On vérifie la présence des données nécessaires (plus sûr que !empty).
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Email et mot de passe sont requis.']);
        break;
    }

    // 3. On nettoie les entrées pour la sécurité.
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $password = $data['password'];

    // 4. On vérifie que les champs ne sont pas vides après nettoyage.
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Les champs ne peuvent pas être vides.']);
        break;
    }
 
    // 5. On tente de connecter l'utilisateur via le modèle.
    $user = $userModel->login($email, $password);

    if ($user) {
        // ---- SUCCÈS DE LA CONNEXION ----
        
        // 6. Mesure de sécurité : on régénère l'ID de session.
        session_regenerate_id(true);

        // 7. On stocke les informations essentielles dans la session.
        $_SESSION['user_id'] = $user['id_user'];
        $_SESSION['user_role'] = $user['role'];
        // On peut aussi stocker le prénom pour un message d'accueil
        $_SESSION['user_prenom'] = $user['prenom'];

        // 8. On renvoie une réponse positive au frontend.
        // On inclut seulement les informations non-sensibles nécessaires.
        echo json_encode([
            'success' => true, 
            'message' => 'Connexion réussie !', 
            'user' => [
                'prenom' => $user['prenom'], // On renvoie le prénom pour un message d'accueil
                'role' => $user['role']      // Et le rôle pour la redirection
            ]
        ]);
    } else {
        // ---- ÉCHEC DE LA CONNEXION ----
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect.']);
    }
    break;

// ...
case 'createReservation':
    // On s'assure que la requête est bien en POST et que l'utilisateur est connecté.
    if ($method !== 'POST' || !isset($_SESSION['user_id'])) {
        http_response_code(403); // Forbidden
        echo json_encode(['success' => false, 'message' => 'Accès refusé. Veuillez vous connecter.']);
        break;
    }

    // On récupère et on valide les données envoyées par le formulaire JS.
    $id_user = $_SESSION['user_id'];
    $id_voiture = $data['id_voiture'] ?? null;
    $date_debut = $data['date_debut'] ?? null;
    $date_fin = $data['date_fin'] ?? null;

    if (!$id_voiture || !$date_debut || !$date_fin) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Données de réservation manquantes.']);
        break;
    }
    
    // --- Validation des dates ---
    try {
        $start = new DateTime($date_debut);
        $end = new DateTime($date_fin);
        if ($end < $start) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La date de fin ne peut pas être antérieure à la date de début.']);
            break;
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format de date invalide.']);
        break;
    }


    // =========================================================
    // ==     NOUVELLE ÉTAPE : VÉRIFICATION DE DISPONIBILITÉ    ==
    // =========================================================
    // On appelle la nouvelle méthode du modèle Reservation.
    $isAvailable = $reservationModel->isCarAvailable($id_voiture, $date_debut, $date_fin);

    if (!$isAvailable) {
        // Si la voiture n'est PAS disponible, on arrête tout et on renvoie une erreur claire.
        http_response_code(409); // 409 Conflict (indique une collision de ressource)
        echo json_encode(['success' => false, 'message' => 'Désolé, cette voiture est déjà réservée sur les dates sélectionnées. Veuillez choisir une autre période.']);
        break; // On sort du case.
    }
    
    // --- Si on arrive ici, la voiture est disponible, on peut continuer. ---

    // SÉCURITÉ : Recalcul du prix côté serveur.
    $car = $carModel->getById($id_voiture);
    if (!$car) {
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'La voiture demandée n\'existe pas.']);
        break;
    }

    $interval = $start->diff($end);
    $days = $interval->days + 1; // +1 pour inclure le premier jour.
    $montant_total = $days * $car['prix_par_jour'];

    // On tente de créer la réservation.
    $success = $reservationModel->create($id_user, $id_voiture, $date_debut, $date_fin, $montant_total);

    if ($success) {
        // La réservation a été créée avec succès.
        echo json_encode(['success' => true, 'message' => 'Réservation enregistrée avec succès !']);
    } else {
        // Une erreur s'est produite lors de l'insertion en BDD.
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => 'Une erreur interne est survenue lors de l\'enregistrement de la réservation.']);
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

 // Dans api.php, modifiez ce case

case 'uploadDocument':
    if (isset($_SESSION['user_id']) && $method == 'POST') {
        $id_user = $_SESSION['user_id'];
        
        if (isset($_POST['type_doc']) && isset($_FILES['document_file']) && $_FILES['document_file']['error'] == 0) {
            $type_doc = $_POST['type_doc'];
            $target_dir = "../../uploads/documents/"; // Votre chemin conservé
            $file_name = $id_user . '-' . uniqid() . '-' . basename($_FILES["document_file"]["name"]);
            $target_file = $target_dir . $file_name;
            
            if (move_uploaded_file($_FILES["document_file"]["tmp_name"], $target_file)) {
                $success = $documentModel->create($id_user, $type_doc, $file_name);
                if ($success) {
                    // RENVOYER UNE RÉPONSE JSON
                    echo json_encode(['success' => true, 'message' => 'Document envoyé avec succès !']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload du fichier.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Données ou fichier manquant.']);
        }
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
        case 'getCarBookedDates':
    if (isset($_GET['id'])) {
        $dates = $reservationModel->getBookedDatesByCarId($_GET['id']);
        echo json_encode(['success' => true, 'data' => $dates]);
    }
    break;
     case 'sendContactMessage':
        if ($method == 'POST') {
            // On s'attend à recevoir des données JSON
            $data = json_decode(file_get_contents("php://input"), true);

            // Validation simple des données
            if (!empty($data['email']) && filter_var($data['email'], FILTER_VALIDATE_EMAIL) && !empty($data['subject']) && !empty($data['message'])) {
                
                // On "nettoie" les données pour éviter les injections XSS
                $email = htmlspecialchars(strip_tags($data['email']));
                $subject = htmlspecialchars(strip_tags($data['subject']));
                $message = htmlspecialchars(strip_tags($data['message']));

                $success = $messageModel->create($email, $subject, $message);

                if ($success) {
                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Votre message a bien été enregistré.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Erreur interne du serveur lors de l\'enregistrement.']);
                }

            } else {
                http_response_code(400); // Bad Request
                echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs correctement.']);
            }
        }
        break;
          case 'getAllMessages':
        // Action protégée, on vérifiera si l'utilisateur est un admin (bonus)
        // Pour l'instant, on suppose que l'accès est sécurisé
        if ($method == 'GET') {
            $messages = $messageModel->getAll();
            echo json_encode(['success' => true, 'data' => $messages]);
        }
        break;

    case 'markMessageAsRead':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['id'])) {
                $success = $messageModel->markAsRead($data['id']);
                if ($success) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur de base de données.']);
                }
            }
        }
        break;
         case 'requestPasswordReset':
        $data = json_decode(file_get_contents("php://input"), true);
        $user = $userModel->findByEmail($data['email']);
        if ($user) {
            $token = $userModel->createPasswordResetToken($user['id_user']);
            sendPasswordResetEmail($user['email'], $token);
        }
        echo json_encode(['success' => true, 'message' => 'Si un compte est associé à cette adresse, un e-mail de réinitialisation a été envoyé.']);
        break;

    case 'resetPassword':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!empty($data['token']) && !empty($data['password']) && $data['password'] === $data['password_confirm']) {
            $success = $userModel->resetPassword($data['token'], $data['password']);
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Votre mot de passe a été mis à jour.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Lien invalide ou expiré.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Données invalides.']);
        }
        break;
        
} 
ini_set('display_errors', 1);
error_reporting(E_ALL);
?>
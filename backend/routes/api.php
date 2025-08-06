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
 
// Fichier : backend/routes/api.php

    function getProjectContext($pdo) {
    // 1. Contexte général sur l'entreprise
    $context = "Informations générales : AutoLoc est une agence de location de voitures. Pour réserver, le client doit fournir un permis de conduire et une pièce d'identité (CIN). L'annulation est flexible.\n\n";
    
    // 2. Contexte sur les voitures disponibles
    $context .= "Voici la liste des voitures actuellement disponibles et leurs prix par jour :\n";
    try {
        $stmt = $pdo->query("SELECT marque, modele, prix_par_jour, type FROM voiture WHERE statut = 'disponible'");
        $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cars as $car) {
            $context .= "- {$car['marque']} {$car['modele']} ({$car['type']}) à {$car['prix_par_jour']} €/jour.\n";
        }
    } catch (PDOException $e) {
        $context .= "Impossible de récupérer la liste des voitures en ce moment.\n";
    }

    // 3. Contexte sur l'utilisateur s'il est connecté
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        
        try {
            $stmtUser = $pdo->prepare("SELECT nom, prenom FROM utilisateur WHERE id_user = ?");
            $stmtUser->execute([$userId]);
            $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $context .= "\n--- CONTEXTE SPÉCIFIQUE À L'UTILISATEUR ---\n";
                $context .= "L'utilisateur actuel est connecté. Son nom est {$user['prenom']} {$user['nom']}.\n";
                
                $stmtRes = $pdo->prepare("
                    SELECT r.date_debut, r.date_fin, r.statut, v.marque, v.modele 
                    FROM reservation r JOIN voiture v ON r.id_voiture = v.id_voiture 
                    WHERE r.id_user = ? ORDER BY r.date_debut DESC LIMIT 3
                ");
                $stmtRes->execute([$userId]);
                $reservations = $stmtRes->fetchAll(PDO::FETCH_ASSOC);

                if ($reservations) {
                    $context .= "Voici ses 3 dernières réservations :\n";
                    foreach ($reservations as $res) {
                        $context .= "- Une réservation pour une {$res['marque']} {$res['modele']} du {$res['date_debut']} au {$res['date_fin']}. Statut : {$res['statut']}.\n";
                    }
                } else {
                    $context .= "L'utilisateur n'a aucune réservation pour le moment.\n";
                }
            }
        } catch (PDOException $e) {
            $context .= "Impossible de récupérer les informations de l'utilisateur.\n";
        }
    }
    return $context;
}

/**
 * Envoie un prompt à l'API Gemini en utilisant cURL (méthode robuste).
 * @param string $prompt Le prompt complet à envoyer à l'IA.
 * @return string La réponse textuelle de l'IA.
 */
function askGemini($prompt) {
    $apiKey = "AIzaSyBl9EtpKCE0OIJrdPnsdyoFZsibwNLgOhc"; // 🔐 REMPLACEZ PAR VOTRE VRAIE CLÉ API
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

    $data = ['contents' => [['parts' => [['text' => $prompt]]]]];
    $jsonData = json_encode($data);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Utile pour XAMPP en local
    
    $result = curl_exec($ch);

    if (curl_errno($ch)) {
        error_log("cURL Error: " . curl_error($ch));
        curl_close($ch);
        return "Désolé, une erreur de communication réseau est survenue.";
    }
    curl_close($ch);
    
    $response = json_decode($result, true);

    if (isset($response['error'])) {
        error_log("Gemini API Error: " . $response['error']['message']);
        return "Désolé, une erreur est survenue avec l'assistant IA.";
    }
    
    return $response['candidates'][0]['content']['parts'][0]['text'] ?? "Je n'ai pas pu formuler de réponse.";
}


// ====================================================================
// ==   FONCTION 1 : POUR LE MOT DE PASSE OUBLIÉ                     ==
// ====================================================================
function sendPasswordResetEmail($userEmail, $token) {
    $resetLink = "http://localhost/autoloc/frontend/pages/reset-password.html?token=" . $token;

    $mail = new PHPMailer(true);
      try {
        $mail->isSMTP(); $mail->Host = 'smtp.gmail.com'; $mail->SMTPAuth = true;
        $mail->Username = 'mostaphaelghazal102030@gmail.com'; $mail->Password = 'ojqv vktr hucv jkcp';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; $mail->Port = 465; $mail->CharSet = 'UTF-8';
        $mail->setFrom('no-reply@autoloc.com', 'AutoLoc Support');
        $mail->addAddress($userEmail);
        $mail->isHTML(true); $mail->Subject = 'Réinitialisation de votre mot de passe';
        $mail->Body = "<p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure):</p><a href='{$resetLink}'>Réinitialiser le mot de passe</a>";
        $mail->send(); return true;
    } catch (Exception $e) { error_log("PHPMailer Error: {$mail->ErrorInfo}"); return false; }
}



// ====================================================================
// ==   FONCTION 2 : POUR LA VÉRIFICATION DE COMPTE                  ==
// ====================================================================
function sendVerificationEmail($userEmail, $code) {
    $mail = new PHPMailer(true);
      
     try {
        $mail->isSMTP(); $mail->Host = 'smtp.gmail.com'; $mail->SMTPAuth = true;
        $mail->Username = 'mostaphaelghazal102030@gmail.com'; $mail->Password = 'ojqv vktr hucv jkcp';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; $mail->Port = 465; $mail->CharSet = 'UTF-8';
        $mail->setFrom('no-reply@autoloc.com', 'AutoLoc Inscription');
        $mail->addAddress($userEmail);
        $mail->isHTML(true); $mail->Subject = 'Votre code de vérification AutoLoc';
        $mail->Body = "<h1>Bienvenue !</h1><p>Votre code de vérification est :</p><h2 style='text-align:center;'>{$code}</h2>";
        $mail->send(); return true;
    } catch (Exception $e) { error_log("PHPMailer Error: {$mail->ErrorInfo}"); return false; }
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
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['nom']) && !empty($data['email']) && !empty($data['password'])) {
                $code = $userModel->register($data['nom'], $data['prenom'], $data['email'], $data['password']);
                if ($code) {
                    sendVerificationEmail($data['email'], $code);
                    echo json_encode(['success' => true, 'message' => 'Inscription réussie.']);
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
    // On vérifie si l'utilisateur est un admin et si la méthode est POST
    if (isAdmin() && $method == 'POST') {
        
        // 1. On récupère toutes les données du formulaire, y compris la nouvelle description
        $marque = $_POST['marque'] ?? '';
        $modele = $_POST['modele'] ?? '';
        $type = $_POST['type'] ?? '';
        $prix = $_POST['prix_par_jour'] ?? 0;
        $annee = $_POST['annee'] ?? 0;
        $statut = $_POST['statut'] ?? 'disponible';
        $description = $_POST['description'] ?? ''; // <-- NOUVEAU : On récupère la description

        // 2. On gère l'upload de l'image
        $image_name = 'default.jpg'; 
        if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $target_dir = "../../uploads/cars/"; // Assurez-vous que ce chemin est correct
            // Créer un nom de fichier unique pour éviter les conflits
            $image_name = uniqid('car_', true) . '.' . pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
            $target_file = $target_dir . $image_name;
            
            // On déplace le fichier uploadé
            if (!move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
                // En cas d'échec de l'upload, on renvoie une erreur
                echo json_encode(['success' => false, 'message' => "Erreur lors de l'upload de l'image."]);
                exit();
            }
        }
        
        // 3. On appelle la fonction create() du modèle avec TOUS les paramètres
        // Votre fonction create() dans Car.php n'a pas encore le paramètre description,
        // nous devons d'abord la mettre à jour. (Je vais supposer que vous avez la version que je vous ai donnée)
        $success = $carModel->create($marque, $modele, $type, $prix, $annee, $image_name, $statut, $description);

        // 4. CORRECTION : On renvoie une réponse JSON, pas une redirection
        if ($success) {
        echo json_encode(['success' => true, 'message' => 'Voiture ajoutée avec succès !']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout.']);
    }
    } else {
        // Si l'utilisateur n'est pas admin ou si la méthode n'est pas POST
        http_response_code(403); // Forbidden
        echo json_encode(['success' => false, 'message' => 'Accès non autorisé.']);
    }
    break;
        
    // Vous ajouterez 'adminUpdateCar' et 'adminDeleteCar' sur le même principe.
   case 'adminUpdateCar':
    if (isAdmin() && $method == 'POST' && !empty($_POST['id_voiture'])) {
        
        $carId = $_POST['id_voiture'];
        $newImageName = null;

        if (isset($_FILES['image']) && $_FILES['image']['error'] == 0 && !empty($_FILES['image']['name'])) {
            $target_dir = "../../uploads/cars/";
            $newImageName = uniqid('car_', true) . '.' . pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
            $target_file = $target_dir . $newImageName;
            move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
        }

        // CORRECTION : On utilise l'opérateur ?? pour éviter les erreurs "Undefined array key"
        $success = $carModel->update(
            $carId,
            $_POST['marque'] ?? '',
            $_POST['modele'] ?? '',
            $_POST['type'] ?? '',
            $_POST['prix_par_jour'] ?? 0,
            $_POST['annee'] ?? 0,
            $_POST['statut'] ?? 'disponible',
            $_POST['description'] ?? '', // <-- SÉCURISÉ
            $newImageName
        );

        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Voiture modifiée avec succès.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification de la voiture.']);
        }
    } else {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Accès non autorisé ou données manquantes.']);
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
        echo json_encode(['success' => true, 'message' => '  un e-mail de réinitialisation a été envoyé.']);
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
        // cerification de email 
        case 'verifyCode':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['email']) && !empty($data['code'])) {
                $success = $userModel->verifyCode($data['email'], $data['code']);
                if ($success) {
                    echo json_encode(['success' => true, 'message' => 'Votre compte a été activé !']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Code de vérification incorrect.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Email ou code manquant.']);
            }
        }
        break;
       // Fichier : backend/routes/api.php


    // ... (vos autres cases : getAllCars, adminAddCar, etc.)

    case 'getDashboardStats':
        // On vérifie si l'utilisateur est un admin pour sécuriser cette action
        if (isAdmin()) { 
            try {
                // Requête pour le total des réservations
                $totalBookings = $pdo->query("SELECT COUNT(*) FROM reservation")->fetchColumn();
                
                // Requête pour les voitures disponibles
                $availableCars = $pdo->query("SELECT COUNT(*) FROM voiture WHERE statut = 'disponible'")->fetchColumn();
                
                // Requête pour les utilisateurs "actifs" (tous les clients)
                $activeUsers = $pdo->query("SELECT COUNT(*) FROM utilisateur WHERE role = 'client'")->fetchColumn();
                
                // On renvoie les données en format JSON
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'totalBookings' => $totalBookings,
                        'availableCars' => $availableCars,
                        'activeUsers' => $activeUsers
                    ]
                ]);
            } catch (PDOException $e) {
                // En cas d'erreur avec la base de données
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erreur de base de données.']);
            }
        } else {
            // Si un non-admin essaie d'accéder aux stats
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
        }
        break;
 

// DANS VOTRE "switch ($action) { ... }"
// Fichier : backend/routes/api.php



case 'chatbotQuery':
    if ($method == 'POST') {
        // 1. Récupérer les données envoyées par le JavaScript
        $data = json_decode(file_get_contents("php://input"), true);
        $userQuestion = htmlspecialchars($data['question'] ?? '');
        $history = $data['history'] ?? [];

        // 2. Récupérer le contexte du projet (voitures, utilisateur, etc.)
        // (Assurez-vous que la fonction getProjectContext($pdo) est bien définie avant le switch)
        $context = getProjectContext($pdo); 

        // 3. Formater l'historique pour le prompt
        $historyString = "";
        foreach ($history as $message) {
            $role = ($message['role'] === 'user') ? 'Utilisateur' : 'AutoBot';
            $historyString .= "{$role}: {$message['text']}\n";
        }

        // 4. Construire le prompt final et détaillé pour l'IA
        $finalPrompt = "
        Tu es AutoBot, un assistant expert et amical de l'agence de location 'AutoLoc'.
        Ta mission est de répondre aux questions et de guider les utilisateurs.

        RÈGLES STRICTES POUR LES COMMANDES D'ACTION :
        1. Tu ne dois ajouter une commande que si l'intention de l'utilisateur est EXPLICITE et SANS AMBIGUÏTÉ.
        2. Pour les salutations simples comme 'Bonjour', 'Salut', 'hi', 'ça va ?', réponds simplement par une salutation SANS AJOUTER DE COMMANDE.
        3. La commande DOIT respecter ce format : [ACTION:NOM_ACTION:VALEUR]
        4. La VALEUR pour BOOK_CAR et SHOW_CAR_DETAILS doit être UNIQUEMENT le numéro de l'ID de la voiture trouvé dans le contexte.

        COMMANDES POSSIBLES :
        - [ACTION:BOOK_CAR:ID_NUMERIQUE] : Si l'utilisateur veut RÉSERVER une voiture spécifique.
        - [ACTION:SHOW_CAR_DETAILS:ID_NUMERIQUE] : Si l'utilisateur demande des DÉTAILS sur une voiture spécifique.
        - [ACTION:SHOW_ALL_CARS] : Si l'utilisateur demande à VOIR TOUTES les voitures.

        CONTEXTE:
        {$context}
        ---
        HISTORIQUE DE LA CONVERSATION:
        {$historyString}
        ---
        DERNIÈRE QUESTION DE L'UTILISATEUR:
        {$userQuestion}
        ";

        // 5. Appeler l'IA pour obtenir la réponse
        // (Assurez-vous que la fonction askGemini($prompt) est bien définie avant le switch)
        $botResponse = askGemini($finalPrompt);
        
        // 6. NOUVEAU : Enregistrer la conversation dans la base de données
        try {
            if (!isset($_SESSION['chatbot_session_id'])) {
                $_SESSION['chatbot_session_id'] = uniqid('chat_', true);
            }
            $sessionId = $_SESSION['chatbot_session_id'];
            $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

            $sql = "INSERT INTO conversation_chatbot (session_id, id_user, prompt_utilisateur, reponse_bot) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$sessionId, $userId, $userQuestion, $botResponse]);
        } catch (PDOException $e) {
            error_log("Erreur d'enregistrement de la conversation chatbot : " . $e->getMessage());
        }
        
        // 7. Analyser la réponse de l'IA pour extraire les actions
        $actionRegex = '/\[ACTION:([A-Z_]+):?([^\]]*)?\]/';
        preg_match($actionRegex, $botResponse, $match);

        // 8. Préparer la réponse JSON pour le frontend
        $responseData = [
            'success' => true,
            'answer' => trim(preg_replace($actionRegex, '', $botResponse)),
            'action' => null
        ];

        if ($match) {
            $action = $match[1];
            $value = $match[2];
            
            if (($action === 'SHOW_CAR_DETAILS' || $action === 'BOOK_CAR') && is_numeric($value)) {
                $carDetails = $carModel->getById($value);
                if ($carDetails) {
                    $responseData['action'] = [
                        'type' => 'DISPLAY_CAR_CARD',
                        'data' => $carDetails
                    ];
                }
            } else if ($action === 'SHOW_ALL_CARS') {
                $responseData['action'] = ['type' => 'SHOW_ALL_CARS'];
            }
        }
        
        // 9. Renvoyer la réponse finale au JavaScript
        echo json_encode($responseData);
    }
    break;
    
  // Fichier : backend/routes/api.php
// Fichier : backend/routes/api.php

case 'getChatbotContext':
    if ($method == 'GET') {
        // On initialise notre variable qui contiendra tout le contexte.
        $contextText = "Informations générales : AutoLoc est une agence de location de voitures. Pour réserver, le client a besoin d'un permis de conduire et d'une pièce d'identité (CIN). L'annulation est flexible.\n\n";
        $contextText .= "Voici la liste des voitures actuellement disponibles et leurs prix par jour :\n";

        try {
            // La requête est correcte, elle sélectionne bien id_voiture.
            $stmt = $pdo->query("SELECT id_voiture, marque, modele, prix_par_jour, type FROM voiture WHERE statut = 'disponible'");
            $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($cars) === 0) {
                $contextText .= "Actuellement, il n'y a pas de voitures spécifiques listées comme disponibles.";
            } else {
                foreach ($cars as $car) {
                    // ===============================================
                    // ==         LA CORRECTION EST ICI             ==
                    // ===============================================
                    // On ajoute les infos à la bonne variable : $contextText
                    $contextText .= "- (ID: {$car['id_voiture']}) {$car['marque']} {$car['modele']} ({$car['type']}) à {$car['prix_par_jour']} €/jour.\n";
                }
            }
            // On renvoie la variable qui contient TOUT.
            echo json_encode(['success' => true, 'context' => $contextText]);

        } catch (PDOException $e) {
            error_log("Database error in getChatbotContext: " . $e->getMessage());
            echo json_encode(['success' => false, 'context' => 'Erreur de base de données.']);
        }
    }
    break;
       case 'generateCarDescription':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);

            // On récupère les infos déjà saisies par l'admin
            $marque = htmlspecialchars($data['marque'] ?? '');
            $modele = htmlspecialchars($data['modele'] ?? '');
            $type = htmlspecialchars($data['type'] ?? '');
            $annee = htmlspecialchars($data['annee'] ?? '');

            if (empty($marque) || empty($modele)) {
                echo json_encode(['success' => false, 'description' => 'Veuillez au moins renseigner la marque et le modèle.']);
                exit();
            }

            // On construit un prompt spécifique pour la description
            $prompt = "
            Tu es un expert en marketing automobile pour une agence de location nommée AutoLoc.
            Rédige une description courte (2-3 phrases), attractive et engageante pour la voiture suivante.
            Mets en avant les points forts probables de ce type de véhicule (confort, sportivité, espace, économie...).
            
            Informations sur la voiture :
            - Marque : {$marque}
            - Modèle : {$modele}
            - Type : {$type}
            - Année : {$annee}

            Le ton doit être professionnel mais séduisant. Ne retourne que le texte de la description, sans introduction ni conclusion.
            ";
            
            // On réutilise notre fonction existante pour appeler Gemini
            $description = askGemini($prompt);

            echo json_encode(['success' => true, 'description' => trim($description)]);
        }
        break;

} ini_set('display_errors', 1);
error_reporting(E_ALL);
?>
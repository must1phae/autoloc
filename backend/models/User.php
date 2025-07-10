// User.php - fichier de structure pour AutoLoc
<?php
// backend/models/User.php

class User {
    private $pdo;

    // Le constructeur reçoit la connexion PDO
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Inscrire un nouvel utilisateur
     */
    public function register($nom, $prenom, $email, $mot_de_passe) {
        // Hasher le mot de passe pour la sécurité
        $hashed_password = password_hash($mot_de_passe, PASSWORD_DEFAULT);

        $sql = "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, 'client')";
        
        try {
            // On utilise des requêtes préparées pour éviter les injections SQL
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$nom, $prenom, $email, $hashed_password]);
        } catch (PDOException $e) {
            // Gérer le cas où l'email est déjà utilisé (contrainte UNIQUE)
            if ($e->errorInfo[1] == 1062) {
                return false; // Email déjà existant
            }
            throw $e; // Lancer une autre erreur
        }
    }

    /**
     * Tenter de connecter un utilisateur
     */
    public function login($email, $mot_de_passe) {
        $sql = "SELECT * FROM utilisateur WHERE email = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Vérifier si l'utilisateur existe ET si le mot de passe est correct
        if ($user && password_verify($mot_de_passe, $user['mot_de_passe'])) {
            return $user; // Succès, renvoyer les infos de l'utilisateur
        }

        return false; // Échec
    }

    /**
     * Trouver un utilisateur par son ID
     */
    public function findById($id) {
        $sql = "SELECT id_user, nom, prenom, email, role FROM utilisateur WHERE id_user = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
?>
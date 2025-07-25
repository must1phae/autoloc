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
    /**
     * MODIFIÉ : Inscrit un nouvel utilisateur avec un CODE de vérification.
     * @return string|false Le code de vérification si l'inscription réussit, false sinon.
     */
    public function register($nom, $prenom, $email, $mot_de_passe) {
        $hashed_password = password_hash($mot_de_passe, PASSWORD_DEFAULT);
        // On génère un code aléatoire à 6 chiffres
        $verification_code = random_int(100000, 999999);

        // La requête utilise maintenant la colonne "code_verification"
        $sql = "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, code_verification, est_verifie) 
                VALUES (?, ?, ?, ?, 'client', ?, FALSE)";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            if ($stmt->execute([$nom, $prenom, $email, $hashed_password, $verification_code])) {
                return $verification_code; // On retourne le code pour l'envoi de l'email
            }
            return false;
        } catch (PDOException $e) {
            if ($e->errorInfo[1] == 1062) { return false; }
            throw $e;
        }
    }
     /**
     * NOUVEAU : Vérifie le compte d'un utilisateur via son email et le code.
     */
    public function verifyCode($email, $code) {
        $sql = "SELECT id_user FROM utilisateur WHERE email = ? AND code_verification = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$email, $code]);
        $user = $stmt->fetch();

        if (!$user) {
            return false; // Email ou code incorrect
        }

        // Si le code est bon, on active le compte et on efface le code
        $sql = "UPDATE utilisateur SET est_verifie = TRUE, code_verification = NULL WHERE id_user = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$user['id_user']]);
    }

    /**
     * Tenter de connecter un utilisateur
     */
    public function login($email, $mot_de_passe) {
        $sql = "SELECT * FROM utilisateur WHERE email = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($mot_de_passe, $user['mot_de_passe'])) {
            return $user;
        }
        return false;
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

    /**
     * (POUR ADMIN) Récupère tous les utilisateurs
     */
    public function getAll($admin_id) {
        $sql = "SELECT id_user, nom, prenom, email, role FROM utilisateur WHERE id_user != ? ORDER BY nom, prenom";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$admin_id]);
        return $stmt->fetchAll();
    }

    /**
     * (POUR ADMIN) Met à jour le rôle d'un utilisateur.
     */
    public function updateRole($id_user, $new_role) {
        $sql = "UPDATE utilisateur SET role = ? WHERE id_user = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$new_role, $id_user]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    /**
     * (POUR ADMIN) Supprime un utilisateur.
     */
    public function delete($id_user) {
        $sql = "DELETE FROM utilisateur WHERE id_user = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$id_user]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // =========================================================
    // ==     VERSION FINALE ET CORRECTE DE updateProfile     ==
    // =========================================================
    /**
     * Met à jour le profil d'un utilisateur (nom, prénom).
     * Gère aussi la mise à jour du mot de passe si un nouveau est fourni.
     */
    public function updateProfile($id_user, $nom, $prenom, $nouveau_password = null) {
        // On prépare la requête et les paramètres
        $sql = "UPDATE utilisateur SET nom = ?, prenom = ? ";
        $params = [$nom, $prenom];

        // Si un nouveau mot de passe est fourni, on l'ajoute à la requête
        if (!empty($nouveau_password)) {
            $hashed_password = password_hash($nouveau_password, PASSWORD_DEFAULT);
            $sql .= ", mot_de_passe = ? ";
            $params[] = $hashed_password;
        }

        // On termine la requête
        $sql .= "WHERE id_user = ?";
        $params[] = $id_user;
        
        try {
            $stmt = $this->pdo->prepare($sql);
            // On exécute la requête avec tous les paramètres collectés
            return $stmt->execute($params);
        } catch (PDOException $e) {
            // En cas d'erreur SQL, on l'enregistre dans les logs et on renvoie false
            error_log("SQL Error in User::updateProfile: " . $e->getMessage());
            return false;
        }
    }
    // ... (fonctions existantes) ...

public function findByEmail($email) {
    $sql = "SELECT * FROM utilisateur WHERE email = ?";
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute([$email]);
    return $stmt->fetch();
}

public function createPasswordResetToken($userId) {
    $token = bin2hex(random_bytes(32));
    $expiresAt = (new DateTime())->add(new DateInterval('PT1H'))->format('Y-m-d H:i:s'); // Expire dans 1 heure
    $sql = "UPDATE utilisateur SET reset_token = ?, reset_token_expires_at = ? WHERE id_user = ?";
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute([$token, $expiresAt, $userId]);
    return $token;
}

public function resetPassword($token, $newPassword) {
    $sql = "SELECT * FROM utilisateur WHERE reset_token = ? AND reset_token_expires_at > NOW()";
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) { return false; } // Token invalide ou expiré

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $sql = "UPDATE utilisateur SET mot_de_passe = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id_user = ?";
    $stmt = $this->pdo->prepare($sql);
    return $stmt->execute([$hashedPassword, $user['id_user']]);
}
    
} // Fin de la classe User
?>
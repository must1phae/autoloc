<?php
// backend/models/Message.php

class Message {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Enregistre un nouveau message de contact dans la base de données.
     */
    public function create($email, $sujet, $message) {
        $sql = "INSERT INTO messages (email_expediteur, sujet, message) VALUES (?, ?, ?)";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$email, $sujet, $message]);
        } catch (PDOException $e) {
            // En cas d'erreur, on la renvoie pour la gérer dans le routeur
            return false;
        }
    }
  public function getAll() {
        $sql = "SELECT * FROM messages ORDER BY date_reception DESC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Met à jour le statut d'un message pour le marquer comme lu.
     */
    public function markAsRead($messageId) {
        $sql = "UPDATE messages SET est_lu = TRUE WHERE id_message = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$messageId]);
    }
}
?>
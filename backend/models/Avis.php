<?php
// backend/models/Avis.php

class Avis {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Crée un nouvel avis dans la base de données.
     */
    public function create($id_user, $id_voiture, $note, $commentaire) {
        $sql = "INSERT INTO avis (id_user, id_voiture, note, commentaire, date) VALUES (?, ?, ?, ?, CURDATE())";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$id_user, $id_voiture, $note, $commentaire]);
        } catch (PDOException $e) {
            // Gérer le cas où un utilisateur essaie de laisser un 2ème avis (si vous ajoutez une contrainte UNIQUE)
            error_log($e->getMessage());
            return false;
        }
    }

    /**
     * Récupère tous les avis pour une voiture spécifique, avec le nom du client.
     */
    public function getByCarId($id_voiture) {
        $sql = "SELECT a.note, a.commentaire, a.date, u.prenom 
                FROM avis AS a
                JOIN utilisateur AS u ON a.id_user = u.id_user
                WHERE a.id_voiture = ?
                ORDER BY a.date DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id_voiture]);
        return $stmt->fetchAll();
    }
}
?>
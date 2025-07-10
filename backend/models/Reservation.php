<?php
// backend/models/Reservation.php

class Reservation {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Crée une nouvelle réservation dans la base de données.
     */
    public function create($id_user, $id_voiture, $date_debut, $date_fin, $montant_total) {
        // Le statut par défaut est 'en attente' comme dans votre BDD
        $sql = "INSERT INTO reservation (id_user, id_voiture, date_debut, date_fin, montant_total, statut) 
                VALUES (?, ?, ?, ?, ?, 'en attente')";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            // On exécute la requête avec les données fournies
            return $stmt->execute([$id_user, $id_voiture, $date_debut, $date_fin, $montant_total]);
        } catch (PDOException $e) {
            // En cas d'erreur, on peut la journaliser ou la gérer ici
            error_log($e->getMessage());
            return false;
        }
    }

    // Plus tard, vous ajouterez ici des fonctions pour lister les réservations d'un utilisateur, etc.
}
?>
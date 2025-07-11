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
     /**
     * NOUVELLE FONCTION À AJOUTER
     * Récupère toutes les réservations d'un utilisateur spécifique,
     * avec les détails de la voiture associée.
     */
    public function getByUserId($id_user) {
        // La requête SQL utilise une jointure (JOIN) pour lier les tables
        // 'reservation' et 'voiture' sur la colonne 'id_voiture'.
        $sql = "SELECT 
                    r.id_reservation, 
                    r.date_debut, 
                    r.date_fin, 
                    r.montant_total, 
                    r.statut AS statut_reservation,
                    v.marque, 
                    v.modele, 
                    v.image
                FROM 
                    reservation AS r
                JOIN 
                    voiture AS v ON r.id_voiture = v.id_voiture
                WHERE 
                    r.id_user = ?
                ORDER BY 
                    r.date_debut DESC"; // On trie par date la plus récente d'abord

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id_user]);
        return $stmt->fetchAll();
    }

    // Plus tard, vous ajouterez ici des fonctions pour lister les réservations d'un utilisateur, etc.
}

?>

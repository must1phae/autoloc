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
   
/**
 * Récupère toutes les réservations d'un utilisateur spécifique,
 * avec les détails de la voiture associée.
 */
public function getByUserId($id_user) {
    // La requête SQL utilise une jointure (JOIN)
    $sql = "SELECT 
                r.id_reservation, 
                r.date_debut, 
                r.date_fin, 
                r.montant_total, 
                r.statut AS statut_reservation,
                v.marque, 
                v.modele, 
                v.image,
                v.id_voiture  --  <-- AJOUTEZ CETTE LIGNE IMPORTANTE
            FROM 
                reservation AS r
            JOIN 
                voiture AS v ON r.id_voiture = v.id_voiture
            WHERE 
                r.id_user = ?
            ORDER BY 
                r.date_debut DESC"; 

    $stmt = $this->pdo->prepare($sql);
    $stmt->execute([$id_user]);
    return $stmt->fetchAll();
}

    // Plus tard, vous ajouterez ici des fonctions pour lister les réservations d'un utilisateur, etc.
     /**
     * NOUVELLE FONCTION (POUR ADMIN)
     * Récupère TOUTES les réservations du système avec les détails
     * de l'utilisateur et de la voiture.
     */
    public function getAll() {
        $sql = "SELECT 
                    r.id_reservation, 
                    r.date_debut, 
                    r.date_fin, 
                    r.montant_total, 
                    r.statut AS statut_reservation,
                    v.marque, v.modele,
                    u.nom, u.prenom
                FROM 
                    reservation AS r
                JOIN 
                    voiture AS v ON r.id_voiture = v.id_voiture
                JOIN 
                    utilisateur AS u ON r.id_user = u.id_user
                ORDER BY 
                    r.id_reservation DESC";

        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * NOUVELLE FONCTION (POUR ADMIN)
     * Met à jour le statut d'une réservation spécifique.
     */
    public function updateStatus($id_reservation, $new_status) {
        $sql = "UPDATE reservation SET statut = ? WHERE id_reservation = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$new_status, $id_reservation]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }
}

?>

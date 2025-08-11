<?php
// backend/models/Reservation.php

class Reservation {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // =========================================================
    // ==         MÉTHODES UTILISÉES PAR LES CLIENTS          ==
    // =========================================================

    /**
     * Crée une nouvelle réservation dans la base de données.
     */
    public function create($id_user, $id_voiture, $date_debut, $date_fin, $montant_total) {
        $sql = "INSERT INTO reservation (id_user, id_voiture, date_debut, date_fin, montant_total, statut) 
                VALUES (?, ?, ?, ?, ?, 'en attente')";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$id_user, $id_voiture, $date_debut, $date_fin, $montant_total]);
        } catch (PDOException $e) {
            error_log("SQL Error in Reservation::create: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupère toutes les réservations d'un utilisateur spécifique.
     */
    public function getByUserId($id_user) {
        $sql = "SELECT 
                    r.id_reservation, r.date_debut, r.date_fin, r.montant_total, 
                    r.statut AS statut_reservation,
                    v.marque, v.modele, v.image, v.id_voiture
                FROM reservation AS r
                JOIN voiture AS v ON r.id_voiture = v.id_voiture
                WHERE r.id_user = ?
                ORDER BY r.date_debut DESC"; 

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id_user]);
        return $stmt->fetchAll();
    }
    
    // =========================================================
    // ==        NOUVELLES MÉTHODES DE VÉRIFICATION           ==
    // =========================================================

    /**
     * Vérifie si une voiture a des réservations qui se chevauchent avec les dates demandées.
     * Ne prend pas en compte les réservations annulées ou terminées.
     */
    public function isCarAvailable($id_voiture, $date_debut, $date_fin) {
        $sql = "SELECT COUNT(*) as count 
                FROM reservation 
                WHERE id_voiture = :id_voiture 
                  AND statut IN ('en attente', 'confirmée')
                  AND :date_debut < date_fin 
                  AND :date_fin > date_debut";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':id_voiture' => $id_voiture,
            ':date_debut' => $date_debut,
            ':date_fin' => $date_fin
        ]);
        $result = $stmt->fetch();
        return $result['count'] == 0;
    }

    /**
     * Récupère les plages de dates déjà réservées pour une voiture.
     */
    public function getBookedDatesByCarId($id_voiture) {
        $sql = "SELECT date_debut, date_fin 
                FROM reservation 
                WHERE id_voiture = ? AND statut IN ('en attente', 'confirmée')";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id_voiture]);
        return $stmt->fetchAll();
    }


    // =========================================================
    // ==         MÉTHODES UTILISÉES PAR L'ADMINISTRATEUR     ==
    // =========================================================

    /**
     * Récupère TOUTES les réservations du système.
     */
    public function getAll() {
        $sql = "SELECT 
                    r.id_reservation, r.date_debut, r.date_fin, r.montant_total, 
                    r.statut AS statut_reservation,
                    v.marque, v.modele,
                    u.nom, u.prenom
                FROM reservation AS r
                JOIN voiture AS v ON r.id_voiture = v.id_voiture
                JOIN utilisateur AS u ON r.id_user = u.id_user
                ORDER BY r.id_reservation DESC";

        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Met à jour le statut d'une réservation spécifique.
     */
    public function updateStatus($id_reservation, $new_status) {
        $sql = "UPDATE reservation SET statut = ? WHERE id_reservation = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$new_status, $id_reservation]);
        } catch (PDOException $e) {
            error_log("SQL Error in Reservation::updateStatus: " . $e->getMessage());
            return false;
        }
    }
    
    // =========================================================
    // ==         LA FONCTION MANQUANTE À AJOUTER ICI         ==
    // =========================================================
    /**
     * Récupère les détails complets d'une réservation par son ID.
     * Inclut les informations sur la voiture et l'utilisateur.
     * @param int $reservationId L'ID de la réservation à trouver.
     * @return array|false Les détails de la réservation, ou false si non trouvée.
     */
    public function getById($reservationId) {
        $sql = "SELECT 
                    r.*, 
                    v.marque, v.modele, 
                    u.prenom, u.nom 
                FROM 
                    reservation r
                JOIN 
                    voiture v ON r.id_voiture = v.id_voiture
                JOIN 
                    utilisateur u ON r.id_user = u.id_user
                WHERE 
                    r.id_reservation = ?";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$reservationId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur dans Reservation::getById() : " . $e->getMessage());
            return false;
        }
    }
}
?>
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
    // Fichier : backend/models/Reservation.php

/**
 * Met à jour automatiquement les statuts des réservations :
 * 1. Passe les réservations confirmées dont la date de fin est passée à "terminée".
 * 2. Annule les réservations en attente dont la date de début est passée.
 */
public function updateExpiredReservations() {
    $this->pdo->beginTransaction();
    try {
        // --- CAS 1 : Gérer les réservations terminées ---
        $sqlSelectFinished = "SELECT id_reservation, id_voiture FROM reservation WHERE statut = 'confirmée' AND date_fin < NOW()";
        $stmtSelectFinished = $this->pdo->query($sqlSelectFinished);
        $reservationsToFinish = $stmtSelectFinished->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($reservationsToFinish)) {
            $reservationIdsToFinish = array_column($reservationsToFinish, 'id_reservation');
            $carIdsToFree = array_unique(array_column($reservationsToFinish, 'id_voiture')); // array_unique pour éviter les doublons

            // Met à jour les réservations
            $placeholders = implode(',', array_fill(0, count($reservationIdsToFinish), '?'));
            $sqlFinish = "UPDATE reservation SET statut = 'terminée' WHERE id_reservation IN ({$placeholders})";
            $stmtFinish = $this->pdo->prepare($sqlFinish);
            $stmtFinish->execute($reservationIdsToFinish);
            
            // Met à jour les voitures, en s'assurant qu'elles ne sont pas dans une autre réservation active
            $placeholdersCars = implode(',', array_fill(0, count($carIdsToFree), '?'));
            $sqlFreeCars = "UPDATE voiture v
                            SET v.statut = 'disponible'
                            WHERE v.id_voiture IN ({$placeholdersCars})
                            AND NOT EXISTS (
                                SELECT 1 FROM reservation r
                                WHERE r.id_voiture = v.id_voiture
                                AND r.statut = 'confirmée'
                            )";
            $stmtFreeCars = $this->pdo->prepare($sqlFreeCars);
            $stmtFreeCars->execute(array_values($carIdsToFree));
        }

        // --- CAS 2 : Gérer les réservations en attente et expirées ---
        $sqlSelectExpiredPending = "SELECT id_reservation FROM reservation WHERE statut = 'en attente' AND date_debut < CURDATE()";
        $stmtSelectExpiredPending = $this->pdo->query($sqlSelectExpiredPending);
        $reservationsToCancel = $stmtSelectExpiredPending->fetchAll(PDO::FETCH_COLUMN, 0);

        if (!empty($reservationsToCancel)) {
            $placeholders = implode(',', array_fill(0, count($reservationsToCancel), '?'));
            $sqlCancel = "UPDATE reservation SET statut = 'annulée' WHERE id_reservation IN ({$placeholders})";
            $stmtCancel = $this->pdo->prepare($sqlCancel);
            $stmtCancel->execute($reservationsToCancel);
        }

        $this->pdo->commit();
        
        return (isset($reservationsToFinish) ? count($reservationsToFinish) : 0) + (isset($reservationsToCancel) ? count($reservationsToCancel) : 0);

    } catch (Exception $e) {
        $this->pdo->rollBack();
        error_log("Erreur lors de la mise à jour automatique des statuts : " . $e->getMessage());
        return 0;
    }
}
/**
 * Annule une réservation pour un utilisateur donné, après avoir vérifié les conditions.
 */
public function cancelByUser($reservationId, $userId) {
    // 1. Récupérer la réservation pour vérifier qu'elle appartient bien à l'utilisateur et les conditions de date
    $sqlSelect = "SELECT * FROM reservation WHERE id_reservation = ? AND id_user = ?";
    $stmtSelect = $this->pdo->prepare($sqlSelect);
    $stmtSelect->execute([$reservationId, $userId]);
    $reservation = $stmtSelect->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        return ['success' => false, 'message' => 'Réservation non trouvée ou ne vous appartient pas.'];
    }

    // 2. Vérifier que le statut est bien "confirmée"
    if ($reservation['statut'] !== 'confirmée') {
        return ['success' => false, 'message' => 'Seules les réservations confirmées peuvent être annulées.'];
    }

    // 3. VÉRIFICATION DE SÉCURITÉ : La date de début doit être dans plus de 24 heures
    $startDate = new DateTime($reservation['date_debut']);
    $now = new DateTime();
    $interval = $now->diff($startDate);
    $hoursUntilStart = ($interval->days * 24) + $interval->h;
    
    if ($now > $startDate || $hoursUntilStart <= 24) {
        return ['success' => false, 'message' => "Il est trop tard pour annuler cette réservation (moins de 24h avant le départ)."];
    }

    // 4. Si toutes les conditions sont remplies, on met à jour le statut
    $sqlUpdate = "UPDATE reservation SET statut = 'annulée' WHERE id_reservation = ?";
    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
    if ($stmtUpdate->execute([$reservationId])) {
        // On peut aussi mettre à jour le statut de la voiture ici pour la rendre disponible
        $carId = $reservation['id_voiture'];
        $sqlCar = "UPDATE voiture SET statut = 'disponible' WHERE id_voiture = ?";
        $this->pdo->prepare($sqlCar)->execute([$carId]);

        return ['success' => true];
    } else {
        return ['success' => false, 'message' => 'Erreur de base de données.'];
    }}
}
?>
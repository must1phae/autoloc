<?php
// backend/models/Document.php

class Document {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Ajoute un nouveau document pour un utilisateur.
     */
    public function create($id_user, $type_doc, $nom_fichier) {
        // Le statut est 'en attente' par défaut
        $sql = "INSERT INTO document (id_user, type_doc, nom_fichier, date_upload, statut) VALUES (?, ?, ?, CURDATE(), 'en attente')";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$id_user, $type_doc, $nom_fichier]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    /**
     * Récupère les documents d'un utilisateur spécifique.
     */
    public function getByUserId($id_user) {
        $sql = "SELECT * FROM document WHERE id_user = ? ORDER BY date_upload DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id_user]);
        return $stmt->fetchAll();
    }
    
    /**
     * (POUR ADMIN) Récupère tous les documents en attente de validation.
     */
    public function getPending() {
        $sql = "SELECT d.*, u.nom, u.prenom FROM document d JOIN utilisateur u ON d.id_user = u.id_user WHERE d.statut = 'en attente' ORDER BY d.date_upload ASC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * (POUR ADMIN) Met à jour le statut d'un document.
     */
    public function updateStatus($id_doc, $new_status) {
        $sql = "UPDATE document SET statut = ? WHERE id_doc = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$new_status, $id_doc]);
    }
}
?>
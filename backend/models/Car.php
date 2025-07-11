<?php
// Fichier : backend/models/Car.php

class Car { 
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAllAvailable() {
        $sql = "SELECT * FROM voiture WHERE statut = 'disponible' ORDER BY marque, modele";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }

    public function getById($id) {
        $sql = "SELECT * FROM voiture WHERE id_voiture = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
     // ... (vos fonctions getAllAvailable() et getById() existent déjà)

    /**
     * NOUVELLE FONCTION (POUR ADMIN)
     * Récupère TOUTES les voitures, peu importe leur statut.
     */
    public function getAllForAdmin() {
        $sql = "SELECT * FROM voiture ORDER BY id_voiture DESC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * NOUVELLE FONCTION (POUR ADMIN)
     * Crée une nouvelle voiture dans la base de données.
     */
   /**
     * MODIFICATION ICI : On ajoute le paramètre $statut
     * Crée une nouvelle voiture dans la base de données.
     */
    public function create($marque, $modele, $type, $prix_par_jour, $annee, $image, $statut) {
        // La requête SQL insère maintenant le statut fourni par l'admin
        $sql = "INSERT INTO voiture (marque, modele, type, prix_par_jour, annee, image, statut) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try {
            $stmt = $this->pdo->prepare($sql);
            // On ajoute $statut à la liste des paramètres
            return $stmt->execute([$marque, $modele, $type, $prix_par_jour, $annee, $image, $statut]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }


    /**
     * NOUVELLE FONCTION (POUR ADMIN)
     * Met à jour les informations d'une voiture.
     */
    public function update($id_voiture, $marque, $modele, $type, $prix_par_jour, $annee, $statut) {
        $sql = "UPDATE voiture SET marque = ?, modele = ?, type = ?, prix_par_jour = ?, annee = ?, statut = ? WHERE id_voiture = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$marque, $modele, $type, $prix_par_jour, $annee, $statut, $id_voiture]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }
     
    public function delete($id_voiture) {
        // Avant de supprimer, on peut vouloir supprimer l'image associée du serveur
        $car = $this->getById($id_voiture);
        if ($car && $car['image'] !== 'default.jpg') {
            $image_path = "../../frontend/uploads/cars/" . $car['image'];
            if (file_exists($image_path)) {
                unlink($image_path); // Supprime le fichier image
            }
        }
        
        $sql = "DELETE FROM voiture WHERE id_voiture = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$id_voiture]);
        } catch (PDOException $e) {
            // Gérer les erreurs, par ex. si la voiture est dans une réservation active (contrainte de clé étrangère)
            error_log($e->getMessage());
            return false;
        }
    }
}

?>
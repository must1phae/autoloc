<?php
// Fichier : backend/models/Car.php - VERSION MISE À JOUR

class Car { 
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // --- Fonctions publiques (pour les clients) ---

    public function getAllAvailable($limit = null) {
        $sql = "SELECT * FROM voiture WHERE statut = 'disponible' ORDER BY id_voiture DESC";
        if ($limit !== null && is_numeric($limit)) {
            $sql .= " LIMIT " . intval($limit);
        }
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        // On s'assure de sélectionner la nouvelle colonne 'description'
        $sql = "SELECT * FROM voiture WHERE id_voiture = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // --- Fonctions d'administration ---

    public function getAllForAdmin() {
        $sql = "SELECT * FROM voiture ORDER BY id_voiture DESC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crée une nouvelle voiture dans la base de données.
     * @param string $description La description de la voiture.
     */
    // MODIFICATION : Ajout du paramètre $description
  public function create($marque, $modele, $type, $prix_par_jour, $annee, $image, $statut, $description) {
    // La requête SQL doit inclure la colonne 'description'
    $sql = "INSERT INTO voiture (marque, modele, type, prix_par_jour, annee, image, statut, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    try {
        $stmt = $this->pdo->prepare($sql);
        // On ajoute $description à la liste des paramètres à exécuter
        return $stmt->execute([$marque, $modele, $type, $prix_par_jour, $annee, $image, $statut, $description]);
    } catch (PDOException $e) {
        error_log($e->getMessage());
        return false;
    }
}

    /**
     * Met à jour les informations d'une voiture.
     * @param string $description La nouvelle description de la voiture.
     * @param string|null $newImageName Le nom du nouveau fichier image, ou null si l'image ne change pas.
     */
    // MODIFICATION : Ajout de $description et $newImageName pour plus de flexibilité
    public function update($id_voiture, $marque, $modele, $type, $prix_par_jour, $annee, $statut, $description, $newImageName = null) {
        // On construit la requête de base
        $sql = "UPDATE voiture 
                SET 
                    marque = ?, 
                    modele = ?, 
                    type = ?, 
                    prix_par_jour = ?, 
                    annee = ?, 
                    statut = ?, 
                    description = ? ";
        $params = [$marque, $modele, $type, $prix_par_jour, $annee, $statut, $description];

        // On ajoute la mise à jour de l'image SEULEMENT si un nouveau fichier est fourni
        if ($newImageName !== null) {
            $sql .= ", image = ? ";
            $params[] = $newImageName;
        }

        $sql .= "WHERE id_voiture = ?";
        $params[] = $id_voiture;

        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour de la voiture : " . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprime une voiture de la base de données.
     */
    public function delete($id_voiture) {
        // Logique de suppression de l'image (inchangée)
        $car = $this->getById($id_voiture);
        if ($car && isset($car['image']) && $car['image'] && $car['image'] !== 'default.jpg') {
            // Chemin plus robuste
            $image_path = dirname(__DIR__, 2) . "/uploads/cars/" . $car['image'];
            if (file_exists($image_path)) {
                @unlink($image_path); // Le @ supprime les warnings si la suppression échoue
            }
        }
        
        $sql = "DELETE FROM voiture WHERE id_voiture = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$id_voiture]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la voiture : " . $e->getMessage());
            return false;
        }
    }
}
?>
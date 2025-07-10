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
}
?>
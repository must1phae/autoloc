
-- -----------------------------------------------------
-- DATABASE: AutoLoc
-- -----------------------------------------------------

CREATE DATABASE IF NOT EXISTS autoloc CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE autoloc;

-- -----------------------------------------------------
-- Table: utilisateur
-- -----------------------------------------------------
CREATE TABLE utilisateur (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    mot_de_passe VARCHAR(255),
    role ENUM('client', 'admin') DEFAULT 'client'
);

-- -----------------------------------------------------
-- Table: voiture
-- -----------------------------------------------------
CREATE TABLE voiture (
    id_voiture INT AUTO_INCREMENT PRIMARY KEY,
    marque VARCHAR(100),
    modele VARCHAR(100),
    type VARCHAR(50),
    prix_par_jour DECIMAL(10,2),
    image VARCHAR(255),
    statut ENUM('disponible', 'réservée', 'désactivée', 'maintenance') DEFAULT 'disponible',
    annee INT
);

-- -----------------------------------------------------
-- Table: reservation
-- -----------------------------------------------------
CREATE TABLE reservation (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    date_debut DATE,
    date_fin DATE,
    statut ENUM('en attente', 'confirmée', 'annulée', 'terminée') DEFAULT 'en attente',
    montant_total DECIMAL(10,2),
    id_user INT,
    id_voiture INT,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_voiture) REFERENCES voiture(id_voiture) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: document
-- -----------------------------------------------------
CREATE TABLE document (
    id_doc INT AUTO_INCREMENT PRIMARY KEY,
    nom_fichier VARCHAR(255),
    type_doc ENUM('CIN', 'Permis', 'Autre'),
    date_upload DATE,
    statut ENUM('en attente', 'validé', 'rejeté') DEFAULT 'en attente',
    id_user INT,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: avis
-- -----------------------------------------------------
CREATE TABLE avis (
    id_avis INT AUTO_INCREMENT PRIMARY KEY,
    note INT CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    date DATE,
    id_user INT,
    id_voiture INT,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_voiture) REFERENCES voiture(id_voiture) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: historique_statut
-- -----------------------------------------------------
CREATE TABLE historique_statut (
    id_historique INT AUTO_INCREMENT PRIMARY KEY,
    statut ENUM('disponible', 'réservée', 'maintenance', 'panne'),
    date_modification DATE,
    id_voiture INT,
    FOREIGN KEY (id_voiture) REFERENCES voiture(id_voiture) ON DELETE CASCADE
);

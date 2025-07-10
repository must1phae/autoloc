<?php // Le fichier DOIT commencer ici.

// db.php - Fichier de connexion <-- Le commentaire est maintenant à l'intérieur, en sécurité.

$host = 'localhost';
$dbname = 'autoloc';
$user = 'root';
$pass = '';

$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion BDD: ' . $e->getMessage()]);
    exit();
}
?>
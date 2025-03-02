<?php
header('Content-Type: application/json');

// Connexion à la base de données
$host = 'localhost';
$dbname = 'nom_de_votre_base';
$user = 'votre_utilisateur';
$password = 'votre_mot_de_passe';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['erreur' => 'Erreur de connexion à la base de données']));
}

// Gérer les requêtes POST pour ajouter une notification
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['message']) || empty($data['utilisateur_id'])) {
        die(json_encode(['erreur' => 'Tous les champs sont obligatoires']));
    }

    $message = $data['message'];
    $utilisateur_id = $data['utilisateur_id'];
    $date_notification = date('Y-m-d H:i:s');

    $sql = "INSERT INTO notifications (message, utilisateur_id, date_notification) VALUES (:message, :utilisateur_id, :date_notification)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'message' => $message,
        'utilisateur_id' => $utilisateur_id,
        'date_notification' => $date_notification
    ]);

    echo json_encode(['message' => 'Notification ajoutée avec succès']);
    exit;
}

// Récupérer les notifications
$sql = "SELECT * FROM notifications";
$stmt = $pdo->query($sql);
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($notifications);
?>

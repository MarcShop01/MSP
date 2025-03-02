<?php
header('Content-Type: application/json');
require '../config.php';

// Récupérer les notifications
$sql = "SELECT * FROM notifications ORDER BY date_notification DESC";
$stmt = $pdo->query($sql);
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($notifications);
?>
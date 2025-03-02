<?php
header('Content-Type: application/json');
require '../config.php';

// Récupérer les données du formulaire
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['utilisateur_id']) || empty($data['produit_id']) || empty($data['commentaire'])) {
    die(json_encode(['erreur' => 'Tous les champs sont obligatoires']));
}

$utilisateur_id = $data['utilisateur_id'];
$produit_id = $data['produit_id'];
$commentaire = $data['commentaire'];
$date_commentaire = date('Y-m-d H:i:s');

// Insérer le commentaire dans la base de données
$sql = "INSERT INTO commentaires (utilisateur_id, produit_id, commentaire, date_commentaire) VALUES (:utilisateur_id, :produit_id, :commentaire, :date_commentaire)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'utilisateur_id' => $utilisateur_id,
    'produit_id' => $produit_id,
    'commentaire' => $commentaire,
    'date_commentaire' => $date_commentaire
]);

echo json_encode(['message' => 'Commentaire ajouté avec succès']);
?>
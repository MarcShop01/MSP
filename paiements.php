<?php
header('Content-Type: application/json');
require '../config.php';

// Récupérer les données du formulaire
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['utilisateur_id']) || empty($data['montant']) || empty($data['produits_achetes'])) {
    die(json_encode(['erreur' => 'Tous les champs sont obligatoires']));
}

$utilisateur_id = $data['utilisateur_id'];
$montant = $data['montant'];
$produits_achetes = $data['produits_achetes'];
$date_paiement = date('Y-m-d H:i:s');

// Insérer le paiement dans la base de données
$sql = "INSERT INTO paiements (utilisateur_id, montant, produits_achetes, date_paiement) VALUES (:utilisateur_id, :montant, :produits_achetes, :date_paiement)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'utilisateur_id' => $utilisateur_id,
    'montant' => $montant,
    'produits_achetes' => $produits_achetes,
    'date_paiement' => $date_paiement
]);

echo json_encode(['message' => 'Paiement enregistré avec succès']);
?>
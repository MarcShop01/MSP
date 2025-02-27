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
    die(json_encode(['message' => 'Erreur de connexion à la base de données']));
}

// Récupérer les données du formulaire
$data = json_decode(file_get_contents('php://input'), true);
$produit_nom = $data['produit_nom'];
$quantite = $data['quantite'];

// Insérer le produit dans le panier
$sql = "INSERT INTO panier (produit_nom, quantite) VALUES (:produit_nom, :quantite)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'produit_nom' => $produit_nom,
    'quantite' => $quantite
]);

// Envoyer un e-mail avec les informations du panier
$to = "votre_email@example.com"; // Remplacez par votre adresse e-mail
$subject = "Nouvel ajout au panier";
$message = "Un produit a été ajouté au panier :\n\n";
$message .= "Produit : $produit_nom\n";
$message .= "Quantité : $quantite\n";

$headers = "From: no-reply@votresite.com"; // Remplacez par l'adresse e-mail de votre site

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['message' => 'Produit ajouté au panier et e-mail envoyé']);
} else {
    echo json_encode(['message' => 'Produit ajouté au panier, mais échec de l\'envoi de l\'e-mail']);
}
?>
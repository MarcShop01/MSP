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

// Gérer les requêtes POST pour ajouter un commentaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['utilisateur_id']) || empty($data['produit_id']) || empty($data['commentaire'])) {
        die(json_encode(['erreur' => 'Tous les champs sont obligatoires']));
    }

    $utilisateur_id = $data['utilisateur_id'];
    $produit_id = $data['produit_id'];
    $commentaire = $data['commentaire'];
    $date_commentaire = date('Y-m-d H:i:s');

    $sql = "INSERT INTO commentaires (utilisateur_id, produit_id, commentaire, date_commentaire) VALUES (:utilisateur_id, :produit_id, :commentaire, :date_commentaire)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'utilisateur_id' => $utilisateur_id,
        'produit_id' => $produit_id,
        'commentaire' => $commentaire,
        'date_commentaire' => $date_commentaire
    ]);

    echo json_encode(['message' => 'Commentaire ajouté avec succès']);
    exit;
}

// Récupérer les commentaires
$sql = "SELECT * FROM commentaires";
$stmt = $pdo->query($sql);
$commentaires = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($commentaires);
?>

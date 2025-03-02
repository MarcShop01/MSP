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

// Vérifier si les données sont présentes
if (empty($data['nom']) || empty($data['telephone']) || empty($data['pays']) || empty($data['email']) || empty($data['adresse']) || empty($data['password'])) {
    die(json_encode(['message' => 'Tous les champs sont obligatoires']));
}

$nom = $data['nom'];
$telephone = $data['telephone'];
$pays = $data['pays'];
$email = $data['email'];
$adresse = $data['adresse'];
$password = password_hash($data['password'], PASSWORD_DEFAULT);

// Vérifier si l'email existe déjà
$sql = "SELECT * FROM utilisateurs WHERE email = :email";
$stmt = $pdo->prepare($sql);
$stmt->execute(['email' => $email]);
if ($stmt->rowCount() > 0) {
    die(json_encode(['message' => 'Cet email est déjà utilisé']));
}

// Insérer l'utilisateur dans la base de données
$sql = "INSERT INTO utilisateurs (nom, telephone, pays, email, adresse, mot_de_passe) VALUES (:nom, :telephone, :pays, :email, :adresse, :mot_de_passe)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'nom' => $nom,
    'telephone' => $telephone,
    'pays' => $pays,
    'email' => $email,
    'adresse' => $adresse,
    'mot_de_passe' => $password
]);

// Envoyer un e-mail avec les informations de l'utilisateur
$to = "votre_email@example.com"; // Remplacez par votre adresse e-mail
$subject = "Nouvelle inscription";
$message = "Un nouvel utilisateur s'est inscrit :\n\n";
$message .= "Nom : $nom\n";
$message .= "Téléphone : $telephone\n";
$message .= "Pays : $pays\n";
$message .= "Email : $email\n";
$message .= "Adresse : $adresse\n";

$headers = "From: no-reply@votresite.com"; // Remplacez par l'adresse e-mail de votre site

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['message' => 'Inscription réussie et e-mail envoyé']);
} else {
    echo json_encode(['message' => 'Inscription réussie, mais échec de l\'envoi de l\'e-mail']);
}
?>

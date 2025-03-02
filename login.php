<?php
session_start();
require 'config.php';

// Récupérer les données du formulaire
$email = $_POST['email'];
$password = $_POST['password'];

// Vérifier les identifiants
$sql = "SELECT * FROM utilisateurs WHERE email = :email";
$stmt = $pdo->prepare($sql);
$stmt->execute(['email' => $email]);
$utilisateur = $stmt->fetch(PDO::FETCH_ASSOC);

if ($utilisateur && password_verify($password, $utilisateur['mot_de_passe'])) {
    // Créer une session utilisateur
    $_SESSION['utilisateur_id'] = $utilisateur['id'];
    $_SESSION['nom'] = $utilisateur['nom'];
    echo json_encode(['message' => 'Connexion réussie']);
} else {
    echo json_encode(['message' => 'Email ou mot de passe incorrect']);
}
?>
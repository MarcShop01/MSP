<?php
session_start();

if (!isset($_SESSION['utilisateur_id'])) {
    // Rediriger vers la page de connexion
    header('Location: login.html');
    exit;
}
?>
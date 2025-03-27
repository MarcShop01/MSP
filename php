<?php
// config.php - Fichier de configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'marcshop_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Connexion à la base de données
function connectDB() {
    try {
        $pdo = new PDO(
            "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
            DB_USER, 
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        return $pdo;
    } catch (PDOException $e) {
        die("Erreur de connexion : " . $e->getMessage());
    }
}

// recherche.php - Gestion de la recherche
require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdo = connectDB();
    
    // Récupération du terme de recherche
    $searchTerm = isset($_GET['query']) ? '%'.trim($_GET['query']).'%' : '%%';
    
    // Requête sécurisée
    $stmt = $pdo->prepare("
        SELECT * FROM produits 
        WHERE nom LIKE :search 
        OR description LIKE :search
        ORDER BY nom ASC
        LIMIT 20
    ");
    
    $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => count($results),
        'results' => $results
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// panier.php - Gestion du panier
require_once 'config.php';

session_start();

function gestionPanier($action, $produitId = null) {
    $pdo = connectDB();
    
    switch ($action) {
        case 'ajouter':
            // Vérifier si le produit existe
            $stmt = $pdo->prepare("SELECT * FROM produits WHERE id = ?");
            $stmt->execute([$produitId]);
            $produit = $stmt->fetch();
            
            if ($produit) {
                $_SESSION['panier'][$produitId] = [
                    'quantite' => ($_SESSION['panier'][$produitId]['quantite'] ?? 0) + 1,
                    'produit' => $produit
                ];
                return true;
            }
            break;
            
        case 'supprimer':
            if (isset($_SESSION['panier'][$produitId])) {
                unset($_SESSION['panier'][$produitId]);
                return true;
            }
            break;
            
        case 'vider':
            $_SESSION['panier'] = [];
            return true;
            
        case 'recuperer':
            return $_SESSION['panier'] ?? [];
    }
    
    return false;
}

// contact.php - Gestion des emails
require_once 'config.php';
require 'vendor/autoload.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $mail = new PHPMailer\PHPMailer\PHPMailer();
    try {
        // Configuration SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'contact@marcshop.com';
        $mail->Password = 'votre_mot_de_passe';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        
        // Destinataires
        $mail->setFrom('no-reply@marcshop.com', 'MarcShop');
        $mail->addAddress('marcshop0705@gmail.com');
        
        // Contenu
        $mail->isHTML(true);
        $mail->Subject = 'Nouveau message de contact';
        $mail->Body = "
            <h1>Nouveau contact</h1>
            <p>Nom: {$data['nom']}</p>
            <p>Email: {$data['email']}</p>
            <p>Message: {$data['message']}</p>
        ";
        
        $mail->send();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// produits.php - API Produits
require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdo = connectDB();
    $stmt = $pdo->query("SELECT * FROM produits ORDER BY date_ajout DESC");
    $produits = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => count($produits),
        'produits' => $produits
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
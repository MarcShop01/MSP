<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Notifications</title>
</head>
<body>
    <h1>Gestion des Notifications</h1>
    <p>Cette page permet de gérer les notifications de votre site.</p>

    <!-- Section pour afficher les utilisateurs -->
    <h2>Liste des Utilisateurs Inscrits</h2>
    <div id="utilisateurs-container">
        <!-- Les utilisateurs seront chargés ici dynamiquement -->
    </div>

    <!-- Section pour afficher les commentaires -->
    <h2>Commentaires des Utilisateurs</h2>
    <div id="commentaires-container">
        <!-- Les commentaires seront chargés ici dynamiquement -->
    </div>

    <!-- Inclure Firebase -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
        const firebaseConfig = {
            apiKey: "AIzaSyBbWrhfvhFU7rxUqcwaXa0FF2C-f7Ti3Sk",
            authDomain: "marcshop-3a594.firebaseapp.com",
            projectId: "marcshop-3a594",
            storageBucket: "marcshop-3a594.firebasestorage.app",
            messagingSenderId: "330349520113",
            appId: "1:330349520113:web:24dcf3869c616e14b8f550"
        };
        const app = initializeApp(firebaseConfig);
    </script>
    <!-- Inclure le script admin -->
    <script src="admin.js" type="module"></script>
</body>
</html>

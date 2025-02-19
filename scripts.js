<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panier - MarcShop</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://www.paypal.com/sdk/js?client-id=ActOWDtEW7VcCkWDjChLthGFW3vlmi_AnhWBjGEk2nL7hYsCQ6O03H64tDXX6PliIW39E-OgIx1XQypx&components=buttons" defer></script>
    <script defer src="scripts.js"></script>
</head>
<body>
    <header>
        <div class="logo">MarcShop</div>
        <input type="text" id="search-bar" placeholder="Rechercher un produit...">
        <nav>
            <a href="index.html">Accueil</a>
            <a href="suivie.html">Suivi</a>
        </nav>
    </header>
    <h1>Votre Panier</h1>

    <div id="panier-indicateur">
        <p>Produits dans le panier : <span id="panier-count">0</span></p>
    </div>

    <div id="produits"></div>

    <div id="panier-container"></div>

    <div id="montant-total">
        <p><strong>Total : </strong><span id="total-panier">0$</span></p>
    </div>

    <button id="btn-payer">Payer</button>
    <button id="btn-vider" onclick="viderPanier()">Vider le panier</button>
    <button id="btn-valider-commande">Valider la commande</button>

    <div id="paypal-button-container" style="display:none;"></div>
</body>
</html>

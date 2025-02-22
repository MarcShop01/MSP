document.addEventListener("DOMContentLoaded", () => {
    const produitsContainer = document.getElementById('produits-container');

    if (produitsContainer) {
        // Code pour charger les produits sur index.html
        fetch('produits.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(produit => {
                    const produitDiv = document.createElement('div');
                    produitDiv.classList.add('produit');
                    produitDiv.id = `produit-${produit.id}`; // Ajouter un ID unique

                    const produitImage = document.createElement('img');
                    produitImage.src = produit.image;
                    produitImage.alt = produit.nom;
                    produitImage.onclick = () => showModal(produit.image, produit.description, `Prix: ${produit.prix} $`);

                    const produitPrix = document.createElement('p');
                    produitPrix.textContent = `Prix: ${produit.prix} $`;

                    produitDiv.appendChild(produitImage);
                    produitDiv.appendChild(produitPrix);

                    produitsContainer.appendChild(produitDiv);
                });
            })
            .catch(error => console.error('Erreur:', error));
    } else {
        afficherPanier();
    }
}); // Fin de document.addEventListener

function showModal(imgSrc, description, price) {
    var modal = document.getElementById("modal");
    var modalImg = document.getElementById("modalImage");
    var captionText = document.getElementById("caption");
    
    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = `${description}<br>${price}`;
}

function closeModal() {
    var modal = document.getElementById("modal");
    modal.style.display = "none";
}

// Reste des fonctions existantes...

function ajouterAuPanier(produit) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    produit.idUnique = `produit-${produit.id}`; // Ajouter un ID unique au produit
    panier.push(produit);
    localStorage.setItem("panier", JSON.stringify(panier));
    alert("Produit ajouté au panier !");
}

function afficherPanier() {
    const panierContainer = document.getElementById("panier-container");
    const totalPanierElement = document.getElementById("total-panier");
    const panierCountElement = document.getElementById("panier-count");
    const paypalContainer = document.getElementById("paypal-button-container");

    if (!panierContainer || !totalPanierElement || !panierCountElement || !paypalContainer) {
        console.error("Un ou plusieurs éléments DOM sont introuvables.");
        return;
    }

    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panierContainer.innerHTML = "";
    if (panier.length === 0) {
        panierContainer.innerHTML = "<p>Votre panier est vide.</p>";
        paypalContainer.style.display = "none";
        totalPanierElement.textContent = "0$";
        panierCountElement.textContent = "0";
        return;
    }

    panier.forEach((produit, index) => {
        let div = document.createElement("div");
        div.classList.add("produit-panier");

        let imgSrc = produit.image ? produit.image : 'path/to/default-image.jpg'; // Image par défaut si produit.image est indéfini
        let produitPrix = parseFloat(produit.prix); // Convertir le prix en nombre
        div.innerHTML = `
            <img src="${imgSrc}" alt="${produit.nom}" class="produit-image">
            <div class="details">
                <h3>${produit.nom}</h3>
                <p>ID: ${produit.idUnique}</p>
                <p><strong>${produitPrix.toFixed(2)} $</strong></p>
                <textarea placeholder="Commentaires : couleur, taille, mesure">${produit.commentaire || ""}</textarea>
                <button onclick="supprimerProduit(${index})">Retirer</button>
            </div>
        `;
        panierContainer.appendChild(div);
    });

    panierCountElement.textContent = panier.length;
    calculerTotal();
    afficherPaypalButton();
}

function calculerTotal() {
    const totalPanierElement = document.getElementById("total-panier");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    if (!totalPanierElement) return "0";
    let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
    totalPanierElement.textContent = `${total.toFixed(2)} $`;
    return total.toFixed(2);
}

function supprimerProduit(index) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier.splice(index, 1);
    localStorage.setItem("panier", JSON.stringify(panier));
    afficherPanier();
}

function afficherPaypalButton() {
    const paypalContainer = document.getElementById("paypal-button-container");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    if (typeof paypal === 'undefined') {
        console.error("PayPal SDK non chargé.");
        return;
    }
    if (!paypalContainer) return;
    if (panier.length === 0) return;
    paypalContainer.style.display = "block";
    paypalContainer.innerHTML = "";
    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{ amount: { value: calculerTotal() } }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                alert("Paiement réussi ! Merci " + details.payer.name.given_name);
                localStorage.removeItem("panier");
                window.location.href = "index.html";
            });
        },
        onError: function(err) {
            console.error("Erreur de paiement :", err);
            alert("Une erreur est survenue lors du paiement.");
        }
    }).render('#paypal-button-container');
}

function viderPanier() {
    localStorage.removeItem("panier");
    afficherPanier();
}

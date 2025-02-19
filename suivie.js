document.addEventListener("DOMContentLoaded", () => {
    function rechercherCommande() {
        let idCommande = document.getElementById("commande-id").value;
        if (!idCommande) {
            alert("Veuillez entrer un numéro de commande.");
            return;
        }

        let commandes = JSON.parse(localStorage.getItem("commandes")) || [];
        let commandeTrouvee = commandes.find(cmd => cmd.id === idCommande);

        let resultat = document.getElementById("resultat-suivi");
        if (commandeTrouvee) {
            resultat.innerHTML = <p>Statut : <strong>${commandeTrouvee.statut}</strong></p>;
        } else {
            resultat.innerHTML = "<p>Commande non trouvée.</p>";
        }
    }

    window.rechercherCommande = rechercherCommande;
});

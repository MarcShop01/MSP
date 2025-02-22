document.addEventListener("DOMContentLoaded", function() {
    const utilisateursContainer = document.getElementById("utilisateurs-container");

    let utilisateurs = JSON.parse(localStorage.getItem("utilisateurs")) || [];
    utilisateursContainer.innerHTML = "";
    
    if (utilisateurs.length === 0) {
        utilisateursContainer.innerHTML = "<p>Aucun utilisateur enregistré.</p>";
        return;
    }

    utilisateurs.forEach(utilisateur => {
        let div = document.createElement("div");
        div.classList.add("utilisateur");
        div.innerHTML = `
            <p><strong>Nom:</strong> ${utilisateur.nom}</p>
            <p><strong>Téléphone:</strong> ${utilisateur.telephone}</p>
            <p><strong>Pays:</strong> ${utilisateur.pays}</p>
            <p><strong>Email:</strong> ${utilisateur.email}</p>
            <p><strong>Adresse:</strong> ${utilisateur.adresse}</p>
        `;
        utilisateursContainer.appendChild(div);
    });
});

(function() {
   emailjs.init("VOTRE_ID_UTILISATEUR");
})();

function sendEmailNotification(templateParams) {
    emailjs.send('VOTRE_SERVICE_ID', 'VOTRE_TEMPLATE_ID', templateParams)
        .then(function(response) {
            console.log('Succès !', response.status, response.text);
        }, function(error) {
            console.error('Erreur :', error);
        });
}

function fetchNotifications() {
    let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    let notificationsContainer = document.getElementById('notifications');
    notificationsContainer.innerHTML = "";

    if (notifications.length === 0) {
        notificationsContainer.innerHTML = "<p>Aucune notification pour le moment.</p>";
        return;
    }

    notifications.forEach(notification => {
        let div = document.createElement("div");
        div.classList.add("notification");
        div.innerText = notification;
        notificationsContainer.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    afficherUtilisateurs();
    afficherCommentaires();
    fetchNotifications();
});

function afficherUtilisateurs() {
    const utilisateursContainer = document.getElementById("utilisateurs-container");

    let utilisateurs = JSON.parse(localStorage.getItem("utilisateurs")) || [];
    utilisateursContainer.innerHTML = "";

    if (utilisateurs.length === 0) {
        utilisateursContainer.innerHTML = "<p>Aucun utilisateur inscrit pour le moment.</p>";
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
}

function afficherCommentaires() {
    const commentairesContainer = document.getElementById("commentaires-container");

    let commentaires = JSON.parse(localStorage.getItem("commentaires")) || [];
    commentairesContainer.innerHTML = "";

    if (commentaires.length === 0) {
        commentairesContainer.innerHTML = "<p>Aucun commentaire envoyé pour le moment.</p>";
        return;
    }

    commentaires.forEach(comment => {
        let div = document.createElement("div");
        div.classList.add("commentaire");
        div.innerHTML = `
            <p><strong>Nom Utilisateur:</strong> ${comment.nomUtilisateur}</p>
            <p><strong>Produit ID ${comment.index}:</strong></p>
            <p>${comment.commentaire}</p>
        `;
        commentairesContainer.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    afficherUtilisateurs();
    afficherCommentaires();
    afficherNotifications();
});

async function afficherUtilisateurs() {
    try {
        const response = await fetch('/api/utilisateurs');
        const utilisateurs = await response.json();

        const container = document.getElementById("utilisateurs-container");
        container.innerHTML = '';

        if (utilisateurs.length === 0) {
            container.innerHTML = "<p>Aucun utilisateur inscrit pour le moment.</p>";
            return;
        }

        utilisateurs.forEach(utilisateur => {
            const div = document.createElement("div");
            div.classList.add("utilisateur");
            div.innerHTML = `
                <p><strong>Nom:</strong> ${utilisateur.nom}</p>
                <p><strong>Téléphone:</strong> ${utilisateur.telephone}</p>
                <p><strong>Pays:</strong> ${utilisateur.pays}</p>
                <p><strong>Email:</strong> ${utilisateur.email}</p>
                <p><strong>Adresse:</strong> ${utilisateur.adresse}</p>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs :', error);
    }
}

async function afficherCommentaires() {
    try {
        const response = await fetch('/api/commentaires');
        const commentaires = await response.json();

        const container = document.getElementById("commentaires-container");
        container.innerHTML = '';

        if (commentaires.length === 0) {
            container.innerHTML = "<p>Aucun commentaire pour le moment.</p>";
            return;
        }

        commentaires.forEach(commentaire => {
            const div = document.createElement("div");
            div.classList.add("commentaire");
            div.innerHTML = `
                <p><strong>Utilisateur:</strong> ${commentaire.nomUtilisateur}</p>
                <p><strong>Commentaire:</strong> ${commentaire.commentaire}</p>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires :', error);
    }
}

async function afficherNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const notifications = await response.json();

        const container = document.getElementById("notifications-container");
        container.innerHTML = '';

        if (notifications.length === 0) {
            container.innerHTML = "<p>Aucune notification pour le moment.</p>";
            return;
        }

        notifications.forEach(notification => {
            const div = document.createElement("div");
            div.classList.add("notification");
            div.innerHTML = `
                <p><strong>Message:</strong> ${notification.message}</p>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des notifications :', error);
    }
}

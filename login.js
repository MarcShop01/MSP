document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    let utilisateurs = JSON.parse(localStorage.getItem("utilisateurs")) || [];
    const utilisateur = utilisateurs.find(user => user.email === email);

    if (utilisateur) {
        localStorage.setItem("utilisateurConnecté", JSON.stringify(utilisateur));
        alert("Connexion réussie !");
        window.location.href = "index.html";
    } else {
        alert("Email ou mot de passe incorrect.");
    }
});

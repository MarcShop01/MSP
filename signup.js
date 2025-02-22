document.getElementById("signup-form").addEventListener("submit", function(event) {
    event.preventDefault();
    
    const nom = document.getElementById("nom").value;
    const telephone = document.getElementById("telephone").value;
    const pays = document.getElementById("pays").value;
    const email = document.getElementById("email").value;
    const adresse = document.getElementById("adresse").value;
    const password = document.getElementById("password").value;

    let utilisateurs = JSON.parse(localStorage.getItem("utilisateurs")) || [];
    utilisateurs.push({ nom, telephone, pays, email, adresse, password });
    localStorage.setItem("utilisateurs", JSON.stringify(utilisateurs));
    
    alert("Inscription réussie !");
    window.location.href = "login.html";
});

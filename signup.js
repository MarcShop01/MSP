document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nom = document.getElementById("nom").value;
    const telephone = document.getElementById("telephone").value;
    const pays = document.getElementById("pays").value;
    const email = document.getElementById("email").value;
    const adresse = document.getElementById("adresse").value;
    const password = document.getElementById("password").value;

    try {
        // Remplacez par l'URL publique de votre API
        const response = await fetch('https://votre-api-publique.com/api/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nom, telephone, pays, email, adresse, password }),
        });

        const text = await response.text();
        console.log("Contenu brut reçu :", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            console.error("La réponse n'est pas du JSON valide :", text);
            alert("Une erreur s'est produite lors de l'inscription. Veuillez réessayer.");
            return;
        }

        if (response.ok) {
            localStorage.setItem("userEmail", email);
            alert(data.message || "Inscription réussie !");
            window.location.href = "login.html";
        } else {
            alert(data.message || "Une erreur s'est produite lors de l'inscription.");
        }
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        alert("Une erreur est survenue. Veuillez vérifier votre connexion réseau ou contacter le support.");
    }
});

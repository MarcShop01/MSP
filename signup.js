document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nom = document.getElementById("nom").value;
    const telephone = document.getElementById("telephone").value;
    const pays = document.getElementById("pays").value;
    const email = document.getElementById("email").value;
    const adresse = document.getElementById("adresse").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('https://api.marcshop.com/api/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nom, telephone, pays, email, adresse, password }),
        });

        console.log("Réponse brute du serveur :", response);

        const text = await response.text(); // Lire la réponse comme texte brut
        console.log("Contenu de la réponse :", text);

        let data;
        try {
            data = JSON.parse(text); // Parser la réponse en JSON
            console.log("Données JSON parsées :", data);
        } catch (error) {
            console.error("La réponse n'est pas du JSON valide :", text);
            alert("Une erreur s'est produite. Veuillez réessayer.");
            return;
        }

        if (response.ok) {
            localStorage.setItem("userEmail", email);
            alert(data.message);
            window.location.href = "login.html";
        } else {
            alert(data.message || "Une erreur s'est produite lors de l'inscription.");
        }
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        alert('Une erreur s\'est produite lors de l\'inscription.');
    }
});

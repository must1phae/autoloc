// frontend/js/contact.js - VERSION FINALE AVEC MESSAGE QUI DISPARAÎT

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php?action=sendContactMessage';

    const contactForm = document.getElementById('contact-form');
    const feedbackDiv = document.getElementById('contact-message-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = contactForm.querySelector('button[type="submit"]');
            feedbackDiv.style.display = 'none';
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';

            const data = Object.fromEntries(new FormData(contactForm).entries());

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // --- CAS DE SUCCÈS ---
                    feedbackDiv.textContent = result.message || "Merci ! Votre message a bien été envoyé.";
                    feedbackDiv.className = 'message message-success';
                    contactForm.reset();
                    feedbackDiv.style.display = 'block';

                    // =========================================================
                    // ==   MODIFICATION : FAIRE DISPARAÎTRE LE MESSAGE       ==
                    // =========================================================
                    setTimeout(() => {
                        feedbackDiv.classList.add('fade-out');
                        setTimeout(() => {
                            feedbackDiv.style.display = 'none';
                            feedbackDiv.classList.remove('fade-out');
                        }, 500); // Durée de l'animation CSS
                    }, 5000); // 5 secondes avant de disparaître
                    // =========================================================

                } else {
                    // --- CAS D'ERREUR RENVOYÉE PAR LE SERVEUR ---
                    feedbackDiv.textContent = result.message || "Une erreur est survenue. Veuillez réessayer.";
                    feedbackDiv.className = 'message message-error';
                    feedbackDiv.style.display = 'block';
                }

            } catch (error) {
                // --- CAS D'ERREUR DE CONNEXION RÉSEAU ---
                console.error('Fetch Error:', error);
                feedbackDiv.textContent = "Erreur de connexion. Impossible de joindre le serveur.";
                feedbackDiv.className = 'message message-error';
                feedbackDiv.style.display = 'block';
            } finally {
                // On réactive le bouton seulement après que tout soit terminé
                submitButton.disabled = false;
                submitButton.textContent = 'Envoyer le Message';
            }
        });
    }
});
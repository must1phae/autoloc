// frontend/js/admin-messages.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const messagesContainer = document.querySelector('.messages-container');

    // --- Charge et affiche tous les messages ---
    async function loadAndDisplayMessages() {
        if (!messagesContainer) return;

        try {
            const response = await fetch(`${API_URL}?action=getAllMessages`);
            const result = await response.json();

            messagesContainer.innerHTML = ''; // Vider le message de chargement

            if (result.success && result.data.length > 0) {
                result.data.forEach(msg => {
                    const messageCard = document.createElement('div');
                    messageCard.className = `message-card ${msg.est_lu ? 'is-read' : 'is-unread'}`;
                    messageCard.dataset.id = msg.id_message;

                    messageCard.innerHTML = `
                        <div class="message-header">
                            <div class="sender-info">
                                <span class="sender-email">${msg.email_expediteur}</span>
                                <span class="message-subject">${msg.sujet}</span>
                            </div>
                            <div class="message-meta">
                                <span class="message-date">${new Date(msg.date_reception).toLocaleString('fr-FR')}</span>
                                <span class="read-status-icon"></span>
                            </div>
                        </div>
                        <div class="message-body">
                            <p>${msg.message.replace(/\n/g, '<br>')}</p>
                        </div>
                    `;
                    messagesContainer.appendChild(messageCard);
                });
            } else {
                messagesContainer.innerHTML = '<p>Votre boîte de réception est vide.</p>';
            }
        } catch (error) {
            messagesContainer.innerHTML = '<p>Erreur lors du chargement des messages.</p>';
        }
    }

    // --- Gère le clic sur un message ---
    if (messagesContainer) {
        messagesContainer.addEventListener('click', async (e) => {
            const card = e.target.closest('.message-card');
            if (card) {
                // Déplie/replie le corps du message
                card.classList.toggle('is-open');

                // Si le message n'est pas encore lu, on le marque comme lu
                if (card.classList.contains('is-unread')) {
                    const messageId = card.dataset.id;
                    card.classList.remove('is-unread');
                    card.classList.add('is-read');

                    // On envoie la requête à l'API en arrière-plan
                    await fetch(`${API_URL}?action=markMessageAsRead`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: messageId })
                    });
                }
            }
        });
    }

    // Lancement
    loadAndDisplayMessages();
});
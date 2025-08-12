// frontend/js/admin-messages.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const messagesContainer = document.querySelector('.messages-container');

    async function loadAndDisplayMessages() {
        if (!messagesContainer) return;
        try {
            const response = await fetch(`${API_URL}?action=getAllMessages`);
            const result = await response.json();
            messagesContainer.innerHTML = '';
            if (result.success && result.data.length > 0) {
                result.data.forEach(msg => {
                    const messageCard = document.createElement('div');
                    let cardClasses = 'message-card';
                    if (!msg.est_lu) cardClasses += ' is-unread';
                    if (msg.est_repondu) cardClasses += ' is-replied'; // NOUVELLE CLASSE
                    messageCard.className = cardClasses;
                    messageCard.dataset.id = msg.id_message;

                    messageCard.innerHTML = `
                        <div class="message-header">
                            <div class="sender-info">
                                <span class="sender-email">${msg.email_expediteur}</span>
                                <span class="message-subject">${msg.sujet}</span>
                            </div>
                            <div class="message-meta">
                                <span class="replied-status-icon">${msg.est_repondu ? '✓ Répondu' : ''}</span>
                                <span class="message-date">${new Date(msg.date_reception).toLocaleString('fr-FR')}</span>
                                <span class="read-status-icon"></span>
                            </div>
                        </div>
                        <div class="message-body">
                            <p>${msg.message.replace(/\n/g, '<br>')}</p>
                            <!-- NOUVEAU : Formulaire de réponse -->
                            <div class="reply-form-container">
                                <form class="reply-form">
                                    <textarea name="reply_text" rows="4" placeholder="Tapez votre réponse ici..." required></textarea>
                                    <button type="submit" class="btn btn-primary">Envoyer la réponse</button>
                                </form>
                                <div class="reply-feedback"></div>
                            </div>
                        </div>
                    `;
                    messagesContainer.appendChild(messageCard);
                });
            } else {
                messagesContainer.innerHTML = '<p>Votre boîte de réception est vide.</p>';
            }
        } catch (error) { /* ... */ }
    }

    // Gère le clic sur un message (pour le déplier et le marquer comme lu)
    messagesContainer.addEventListener('click', async (e) => {
        const header = e.target.closest('.message-header');
        if (header) {
            const card = header.closest('.message-card');
            card.classList.toggle('is-open');
            if (card.classList.contains('is-unread')) {
                const messageId = card.dataset.id;
                card.classList.remove('is-unread');
                card.classList.add('is-read');
                await fetch(`${API_URL}?action=markMessageAsRead`, {
                    method: 'POST', body: JSON.stringify({ id: messageId })
                });
            }
        }
    });

    // NOUVEAU : Gère la soumission du formulaire de réponse
    messagesContainer.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('reply-form')) {
            e.preventDefault();
            const form = e.target;
            const card = form.closest('.message-card');
            const messageId = card.dataset.id;
            const replyText = form.querySelector('textarea').value;
            const feedbackDiv = form.nextElementSibling;
            const submitButton = form.querySelector('button');

            submitButton.disabled = true;
            submitButton.textContent = 'Envoi...';

            const response = await fetch(`${API_URL}?action=adminReplyToMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_message: messageId, reply_text: replyText })
            });
            const result = await response.json();
            
            if (result.success) {
                feedbackDiv.textContent = result.message;
                feedbackDiv.style.color = 'green';
                card.classList.add('is-replied');
                card.querySelector('.replied-status-icon').textContent = '✓ Répondu';
                form.style.display = 'none';
            } else {
                feedbackDiv.textContent = result.message;
                feedbackDiv.style.color = 'red';
                submitButton.disabled = false;
                submitButton.textContent = 'Envoyer la réponse';
            }
        }
    });

    loadAndDisplayMessages();
});
// frontend/js/chatbot.js - VERSION COMPLÈTE AVEC CARTE RICHE INTÉGRÉE

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION ---
    const API_URL_AUTOLOC = 'http://localhost/autoloc/backend/routes/api.php';

    // Sélecteurs pour les éléments du DOM
    const chatbotContainer = document.getElementById('chatbot-fab');
    const fabButton = document.getElementById('fab-button');
    const messagesContainer = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    // Variable pour la mémoire de la conversation (court terme)
    let conversationHistory = [];

    // Si le chatbot n'existe pas sur la page, on arrête le script.
    if (!chatbotContainer || !fabButton) {
        return;
    }

    // --- 2. GESTION DE L'INTERFACE UTILISATEUR (UI) ---
    // Ouvre et ferme le chatbot en cliquant sur le bouton flottant
    fabButton.addEventListener('click', () => {
        chatbotContainer.classList.toggle('is-open');
        chatbotContainer.classList.toggle('is-closed');
    });

    /**
     * Affiche un message dans la fenêtre de chat.
     * Peut afficher du texte simple ou une "carte riche" pour une voiture.
     * @param {string|object} content - Le texte du message ou l'objet de la voiture.
     * @param {string} sender - 'user' ou 'bot'.
     * @param {string} type - 'text' ou 'card'.
     */
    function displayMessage(content, sender, type = 'text') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

        if (type === 'card' && sender === 'bot') {
            // Si le contenu est une "carte", on utilise une structure HTML spéciale
            messageDiv.classList.add('rich-card');
            const car = content;
            
            // On utilise un chemin absolu pour plus de fiabilité
            const imagePath = `/autoloc/uploads/cars/${car.image}`;
            
            messageDiv.innerHTML = `
                <img src="${imagePath}" alt="${car.marque} ${car.modele}" class="rich-card-image">
                <div class="rich-card-content">
                    <h4>${car.marque} ${car.modele}</h4>
                    <div class="rich-card-specs">
                        <span>Année: ${car.annee}</span>
                        <span>Type: ${car.type}</span>
                    </div>
                    <div class="rich-card-footer">
                        <span class="rich-card-price">${car.prix_par_jour} €/jour</span>
                        <button class="btn btn-primary btn-sm btn-reserve" data-id="${car.id_voiture}" data-name="${car.marque} ${car.modele}" data-price="${car.prix_par_jour}">Réserver</button>
                    </div>
                </div>
            `;
        } else {
            // Comportement normal pour l'affichage de texte
            const formattedText = content.replace(/\n/g, '<br>').replace(/- /g, '• ');
            messageDiv.innerHTML = `<p>${formattedText}</p>`;
        }

        messagesContainer.appendChild(messageDiv);
        // Fait défiler automatiquement jusqu'au dernier message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- 3. CŒUR DE LA LOGIQUE : ENVOI DU MESSAGE À VOTRE BACKEND ---
    async function sendMessage() {
        const userQuestion = input.value.trim();
        if (userQuestion === '') return;

        displayMessage(userQuestion, 'user');
        input.value = '';
        typingIndicator.style.display = 'flex';
        conversationHistory.push({ role: 'user', text: userQuestion });

        try {
            const response = await fetch(`${API_URL_AUTOLOC}?action=chatbotQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userQuestion,
                    history: conversationHistory
                })
            });
            const result = await response.json();
            
            if (result.success) {
                // On affiche d'abord la réponse textuelle de l'IA
                displayMessage(result.answer, 'bot');
                conversationHistory.push({ role: 'bot', text: result.answer });

                // ENSUITE, on vérifie s'il y a une action à effectuer
                if (result.action) {
                    const action = result.action;
                    
                    // Si le backend nous a envoyé les données d'une voiture, on affiche la carte
                    if (action.type === 'DISPLAY_CAR_CARD') {
                        setTimeout(() => { // On attend un instant pour un effet plus naturel
                            displayMessage(action.data, 'bot', 'card');
                        }, 500);
                    } 
                    // Si le backend demande une redirection
                    else if (action.type === 'SHOW_ALL_CARS') {
                        setTimeout(() => {
                            window.location.href = '../pages/cars-list.html';
                        }, 1200);
                    }
                }
            } else {
                displayMessage(result.message || "Désolé, une erreur est survenue.", 'bot');
            }
        } catch (error) {
            console.error("Erreur de connexion:", error);
            displayMessage("Erreur de connexion avec l'assistant.", 'bot');
        } finally {
            typingIndicator.style.display = 'none';
        }
    }

    // --- 4. ÉVÉNEMENTS ---
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
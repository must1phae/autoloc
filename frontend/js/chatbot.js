// frontend/js/chatbot.js - VERSION COMPLÈTE FINALE AVEC LOGIQUE D'ACTION SUR MODALES

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

    // Fonction pour afficher un message dans la fenêtre de chat
    function displayMessage(text, sender) {
        const formattedText = text.replace(/\n/g, '<br>').replace(/- /g, '• ');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.innerHTML = `<p>${formattedText}</p>`;
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
            // On envoie la question ET l'historique à notre propre API PHP
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
                let botResponseText = result.answer;
                const actionRegex = /\[ACTION:([A-Z_]+):?([^\]]*)?\]/;
                const match = botResponseText.match(actionRegex);

                if (match) {
                    // Si une action est détectée, on l'isole
                    botResponseText = botResponseText.replace(actionRegex, '').trim();
                    const action = match[1];
                    const value = match[2];

                    // On affiche d'abord la réponse textuelle du bot
                    displayMessage(botResponseText, 'bot');
                    conversationHistory.push({ role: 'bot', text: botResponseText });

                    // On exécute l'action après un court délai pour que l'utilisateur puisse lire
                    setTimeout(() => {
                        executeAction(action, value);
                    }, 1000);
                } else {
                    // Comportement normal si aucune action n'est détectée
                    displayMessage(botResponseText, 'bot');
                    conversationHistory.push({ role: 'bot', text: botResponseText });
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

    // --- 4. GESTIONNAIRE D'ACTIONS ---
    /**
     * Exécute les actions demandées par l'IA (comme ouvrir une modale).
     */
    
async function executeAction(action, value) {
    const chatbotContainer = document.getElementById('chatbot-fab');
    chatbotContainer.classList.remove('is-open');
    chatbotContainer.classList.add('is-closed');

    if (action === 'SHOW_ALL_CARS') {
        window.location.href = '../pages/cars-list.html';
        return;
    }
    
    if (action === 'BOOK_CAR' || action === 'SHOW_CAR_DETAILS') {
        // VALIDATION : On s'assure que la valeur est un nombre valide
        const carId = parseInt(value, 10);
        if (isNaN(carId) || carId <= 0) {
            console.error("L'IA a renvoyé une valeur d'ID invalide :", value);
            displayMessage("Je n'ai pas pu identifier la voiture. Pouvez-vous être plus précis ?", 'bot');
            return;
        }

        if (typeof window.openDetailsModal === 'function') {
            window.openDetailsModal(carId);
        } else {
            console.error("La fonction openDetailsModal n'est pas disponible.");
        }
    }
}

    // --- 5. ÉVÉNEMENTS ---
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
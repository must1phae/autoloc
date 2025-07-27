// frontend/js/chatbot.js - FINAL VERSION USING BACKEND AND TRIGGERING MODALS

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION ---
    const API_URL_AUTOLOC = 'http://localhost/autoloc/backend/routes/api.php';

    // Selectors
    const chatbotContainer = document.getElementById('chatbot-fab');
    const fabButton = document.getElementById('fab-button');
    const messagesContainer = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    // Conversation memory
    let conversationHistory = [];

    // --- 2. UI MANAGEMENT ---
    fabButton.addEventListener('click', () => {
        chatbotContainer.classList.toggle('is-open');
        chatbotContainer.classList.toggle('is-closed');
    });

    function displayMessage(text, sender) {
        const formattedText = text.replace(/\n/g, '<br>').replace(/- /g, '• ');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.innerHTML = `<p>${formattedText}</p>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- 3. CORE LOGIC: SEND MESSAGE TO OUR BACKEND ---
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
                body: JSON.stringify({ question: userQuestion, history: conversationHistory })
            });
            const result = await response.json();
            
            if (result.success) {
                let botResponseText = result.answer;
                const actionRegex = /\[ACTION:([A-Z_]+):?([^\]]*)?\]/;
                const match = botResponseText.match(actionRegex);

                if (match) {
                    botResponseText = botResponseText.replace(actionRegex, '').trim();
                    const action = match[1];
                    const value = match[2];

                    displayMessage(botResponseText, 'bot');
                    conversationHistory.push({ role: 'bot', text: botResponseText });

                    setTimeout(() => {
                        executeAction(action, value);
                    }, 1000);
                } else {
                    displayMessage(botResponseText, 'bot');
                    conversationHistory.push({ role: 'bot', text: botResponseText });
                }
            } else {
                displayMessage(result.message || "Sorry, an error occurred.", 'bot');
            }
        } catch (error) {
            console.error("Connection error:", error);
            displayMessage("Connection error with the assistant.", 'bot');
        } finally {
            typingIndicator.style.display = 'none';
        }
    }

    // --- 4. ACTION HANDLER ---
    async function executeAction(action, value) {
        const chatbotContainer = document.getElementById('chatbot-fab');

        if (action === 'BOOK_CAR') {
            const carId = value;
            chatbotContainer.classList.remove('is-open');
            chatbotContainer.classList.add('is-closed');
            
            try {
                const carResponse = await fetch(`${API_URL_AUTOLOC}?action=getCarDetails&id=${carId}`);
                const carResult = await carResponse.json();
                if (carResult.success) {
                    const car = carResult.data;
                    // Call the now-global function from reservation.js
                    if (typeof window.openReservationModal === 'function') {
                        window.openReservationModal(car.id_voiture, `${car.marque} ${car.modele}`, car.prix_par_jour);
                    } else {
                        console.error("The openReservationModal function is not available.");
                        alert("Reservation feature is temporarily unavailable.");
                    }
                }
            } catch (error) {
                alert("Could not retrieve information for the reservation.");
            }

        } else if (action === 'SHOW_ALL_CARS') {
            // Your existing logic for this is correct
            window.location.href = '../pages/cars-list.html';
        } else if (action === 'SHOW_CAR_DETAILS') {
            const carId = value;
            chatbotContainer.classList.remove('is-open');
            chatbotContainer.classList.add('is-closed');
            if (typeof window.openDetailsModal === 'function') {
                window.openDetailsModal(carId);
            } else {
                console.error("The openDetailsModal function is not available.");
            }
        }
    }

    // --- 5. EVENTS ---
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { sendMessage(); }
    });
});
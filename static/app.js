let socket = null;
const connectBtn = document.getElementById('connectbtn');
const disconnectBtn = document.getElementById('disconnectbtn');
const sendBtn = document.getElementById('sendbtn');
const messageInput = document.getElementById('messageinput');
const output = document.getElementById('incoming');
const username = document.getElementById('username');

function log(message) {
    output.value += message + '\n';
    output.scrollTop = output.scrollHeight;
}

connectBtn.onclick = () => {
    // Connect to your FastAPI server
    socket = new WebSocket('ws://localhost:8000/ws');
    
    socket.onopen = () => {
        log('Connected to server');
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
        
        // Send join message with username
        socket.send(JSON.stringify({ type: 'join', username: username.value }));
        log(`You joined as ${username.value}`);
        
        // Send log request
        log('Requesting chat history');
        socket.send(JSON.stringify({ type: 'request', content: 'log' }));
    };
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
            log('Chat history:');
            data.messages.forEach(msg => {
                log(`${msg.username}: ${msg.message}`);
            });
        } else if (data.type === 'message') {
            //skip if own message
            if (data.username === username.value) return;
            const formatted = `${data.username}: ${data.message}`;
            log(formatted);
        }
    };
    
    socket.onerror = () => {
        log('Connection error');
    };
    
    socket.onclose = () => {
        log('Disconnected');
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        sendBtn.disabled = true;
        messageInput.disabled = true;
        socket = null;
    };
};

disconnectBtn.onclick = () => {
    if (socket) socket.close();
};

sendBtn.onclick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const msg = messageInput.value.trim();
        if (msg) {
            socket.send(JSON.stringify({ "type": "message", "message": msg }));
            log(`You: ${msg}`);
            messageInput.value = '';
        }
    }
};
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevents newline in input
        sendBtn.click(); // Triggers the send button's click event
    }
});
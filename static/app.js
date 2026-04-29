let socket = null;
const connectBtn = document.getElementById('connectbtn');
const disconnectBtn = document.getElementById('disconnectbtn');
const sendBtn = document.getElementById('sendbtn');
const messageInput = document.getElementById('messageinput');
const output = document.getElementById('incoming');

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
    };
    
    socket.onmessage = (event) => {
        log(`<-- ${event.data}`);
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
            socket.send(msg);
            log(`You: ${msg}`);
            messageInput.value = '';
        }
    }
};
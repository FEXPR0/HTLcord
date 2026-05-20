let socket = null;
let currentchat = "broadcast";

const connectBtn = document.getElementById('connectbtn');
const disconnectBtn = document.getElementById('disconnectbtn');
const sendBtn = document.getElementById('sendbtn');
const messageInput = document.getElementById('messageinput');
const output = document.getElementById('incoming');
const username = document.getElementById('username');
const updateBtn = document.getElementById('updatebtn');
const broadcastBtn = document.getElementById('broadcastbtn');

function log(message) {
    output.value += message + '\n';
    output.scrollTop = output.scrollHeight;
}

function updateuserList(userlist) {
    const userListContainer = document.getElementById('userlist');
    userListContainer.innerHTML = ''; // Clear existing users

    
    userlist.forEach(user => {
        const userButton = document.createElement('button');
        userButton.className = 'user-button';
        if (user === username.value) {
            userButton.classList.add('current-user');
        }
        userButton.textContent = user;
        userButton.onclick = () => {
            // Optional: Add functionality when clicking a user
            // For example, set message input to "@username "
            if (user !== username.value) {
                incoming.value = "";
                currentchat = user;
                log(`Switched chat to ${currentchat}`);
                messageInput.focus();
            }
        };
        userListContainer.appendChild(userButton);
    });
}
connectBtn.onclick = () => {
    // Connect to your FastAPI server
    socket = new WebSocket('ws://localhost:8084/ws');
    
    socket.onopen = () => {
        log('Connected to server');
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        sendBtn.disabled = false;
        updateBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
        
        // Send join message with username
        socket.send(JSON.stringify({ type: 'join', username: username.value }));
        log(`You joined as ${username.value}`);
        
        // Send log request
        log('Requesting chat history');
        socket.send(JSON.stringify({ type: 'request', content: 'log' }));

        //request user list
        socket.send(JSON.stringify({ type: 'request', content: 'users' }));
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
        } else if (data.type === 'users') {
            const userlist = data.users;
            updateuserList(userlist);
        } else if (data.type === 'dm') {
            if (data.username === username.value) return;
            const formatted = `DM from ${data.username}: ${data.message}`;
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
        updateBtn.disabled = true;
        socket = null;
    };
};

disconnectBtn.onclick = () => {
    if (socket) socket.close();
};

sendBtn.onclick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        if (currentchat === "broadcast") {
            const msg = messageInput.value.trim();
            if (msg) {
                socket.send(JSON.stringify({ "type": "message", "message": msg }));
                log(`You: ${msg}`);
                messageInput.value = '';
            }
        } else {
            const msg = messageInput.value.trim();
            if (msg) {
                socket.send(JSON.stringify({ "type": "dm", "username": currentchat, "message": msg}));
                log(`You to ${currentchat}: ${msg}`);
                messageInput.value = '';
            }
        }
    }
};

updateBtn.onclick = () => {
    socket.send(JSON.stringify({ type: 'request', content: 'users' }));
};

broadcastBtn.onclick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        incoming.value = "";
        log("switched to broadcast mode");
        //request log
        socket.send(JSON.stringify({ type: 'request', content: 'log' }));
        currentchat = "broadcast";
        messageInput.focus();
    }
};
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevents newline in input
        sendBtn.click(); // Triggers the send button's click event
    }
});
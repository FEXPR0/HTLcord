let socket = null;
let currentchat = "broadcast";

const connectBtn = document.getElementById('connectbtn');
const registerBtn = document.getElementById('registerbtn');
const disconnectBtn = document.getElementById('disconnectbtn');
const sendBtn = document.getElementById('sendbtn');

const messageInput = document.getElementById('messageinput');
const output = document.getElementById('incoming');

const username = document.getElementById('username');
const password = document.getElementById('password');
const updateBtn = document.getElementById('updatebtn');

const broadcastBtn = document.getElementById('broadcastbtn');

let authToken = null;


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
                output.value = "";
                currentchat = user;
                log(`Switched chat to ${currentchat}`);
                messageInput.focus();
            }
        };
        userListContainer.appendChild(userButton);
    });
}
async function authRequest(endpoint) {
    if (!username.value) {
        throw new Error('Username required');
    }
    if (!password.value) {
        throw new Error('Password required');
    }

    const response = await fetch(`http://localhost:8084/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, password: password.value })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || data.message || `${endpoint} failed`);
    }
    return data.token;
}

registerBtn.onclick = async () => {
    try {
        const token = await authRequest('register');
        authToken = token;
        log(`Registered and authenticated as ${username.value}`);
    } catch (error) {
        log(`Register failed: ${error.message}`);
    }
};

connectBtn.onclick = async () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        log('Already connected');
        return;
    }

    try {
        authToken = await authRequest('login');
    } catch (error) {
        log(`Login failed: ${error.message}`);
        return;
    }

    socket = new WebSocket(`ws://localhost:8084/ws?token=${encodeURIComponent(authToken)}`);

    socket.onopen = () => {
        log('Connected to server');
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        sendBtn.disabled = false;
        updateBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();

        log(`You joined as ${username.value}`);
        log('Requesting chat history');
        socket.send(JSON.stringify({ type: 'request', content: 'log' }));
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
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'request', content: 'users' }));
    }
};

broadcastBtn.onclick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        output.value = "";
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
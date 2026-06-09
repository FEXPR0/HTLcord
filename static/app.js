let socket = null;
let currentchat = "broadcast";

const SERVER_IP = 'localhost'; // Change this to your server's IP
const SERVER_PORT = '8084';

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

// visual stuff
const darkmodeToggle = document.getElementById('darkmodeToggle');
const icon = darkmodeToggle.querySelector('i');

// function to update connection status UI
function updateConnectionStatus(isConnected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (isConnected) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
        statusText.textContent = 'Disconnected';
    }
}

// function to update the active chat label
function updateActiveChatLabel(chatName) {
    const activeChatLabel = document.getElementById('activeChatLabel');
    if (activeChatLabel) {
        if (chatName === "broadcast") {
            activeChatLabel.innerHTML = '<i class="fas fa-hashtag"></i> broadcast';
        } else {
            activeChatLabel.innerHTML = `<i class="fas fa-user"></i> ${chatName}`;
        }
    }
}



let authToken = null;


function log(message) {
    output.value += message + '\n';
    output.scrollTop = output.scrollHeight;
}

function updateuserList(userlist) {
    const userListContainer = document.getElementById('userlist');
    userListContainer.innerHTML = ''; // Clear existing users

    
    userlist.forEach(user => {
        if (user === username.value) {
            return;
        }
        const userButton = document.createElement('button');
        userButton.className = 'user-button';
        
        userButton.textContent = user;
        userButton.onclick = () => {
    if (user !== username.value) {
            output.value = "";
            currentchat = user;
            updateActiveChatLabel(user); // Add this line
            userButtons = document.getElementsByClassName('user-button');
            for (const btn of userButtons) {
                btn.classList.remove('dm-notification');
            }
            log(`Switched to ${currentchat}\n`);
            messageInput.focus();
            socket.send(JSON.stringify({ type: 'request', content: 'dmlog', username: currentchat }));
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

    const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/${endpoint}`, {
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

    socket = new WebSocket(`ws://${SERVER_IP}:${SERVER_PORT}/ws?token=${encodeURIComponent(authToken)}`);

    socket.onopen = () => {
        log('Connected to server');
        updateConnectionStatus(true); // Add this line
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        sendBtn.disabled = false;
        updateBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();

        log(`You joined as ${username.value}\n`);
        socket.send(JSON.stringify({ type: 'request', content: 'log' }));
        socket.send(JSON.stringify({ type: 'request', content: 'users' }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // log
        if (data.type === 'log') {
            
            data.messages.forEach(msg => {
                if (msg.username === username.value) {
                    log(`You: ${msg.message}`);
                } else {
                    log(`${msg.username}: ${msg.message}`);
                }
            });



        // normal Messages (broadcast)
        } else if (data.type === 'message') {
            //skip if own message
            if (data.username === username.value) return;
            if (currentchat == "broadcast") {
                const formatted = `${data.username}: ${data.message}`;
                log(formatted);
            }else {
                // make broadcast button turn blue
                broadcastBtn.classList.add('dm-notification');
            }

        // userlist update
        } else if (data.type === 'users') {
            const userlist = data.users;
            updateuserList(userlist);
        

        // direct message
        } else if (data.type === 'dm') {
            if (data.username === username.value) return;
            // make button of that user in userlist turn blue
            const userButtons = document.getElementsByClassName('user-button');
            for (const btn of userButtons) {
                if (btn.textContent === data.username) {
                    btn.classList.add('dm-notification');
                }
            if (currentchat === data.username) {
                log(`DM from ${data.username}: ${data.message}`);
            }
            }
        } else if (data.type === 'dmlog') {
            for (const msg of data.messages) {
                if (msg.username === username.value) {
                    log(`You: ${msg.message}`);
                } else if (msg.username === currentchat) {
                    log(`${msg.username}: ${msg.message}`);
                }
            }
        }
    };
    
    socket.onerror = () => {
    log('Connection error');
    updateConnectionStatus(false); // Add this line
    };
    
    socket.onclose = () => {
        log('Disconnected');
        updateConnectionStatus(false); // Add this line
        updateActiveChatLabel('broadcast'); // Reset the chat label
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
        log("Switched to broadcast\n");
        broadcastBtn.classList.remove('dm-notification');
        updateActiveChatLabel('broadcast'); // Add this line
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



// Check for saved preference
if (localStorage.getItem('darkmode') === 'enabled') {
    document.body.classList.add('dark-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

darkmodeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkmode', 'enabled');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        localStorage.setItem('darkmode', 'disabled');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
};
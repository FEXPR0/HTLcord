let socket = null;
let currentchat = "broadcast";

// Holt sich automatisch 'htlcord.app' (oder 'localhost' wenn du es lokal testest)
const SERVER_IP = window.location.hostname; 

// Falls kein Port in der URL steht (weil Nginx den Standard-Port nutzt), 
// nutzen wir je nach Verschlüsselung Port 443 oder 80, um den String-Aufbau nicht zu brechen.
const SERVER_PORT = window.location.port || (window.location.protocol === "https:" ? "443" : "80");

// Für die WebSockets (Nutzt wss:// wenn die Seite über https:// läuft)     ?brauch ich das?
const PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";

const SERVER_URL = `${window.location.protocol}//${window.location.host}`;

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

// Track user activity for sorting
let userActivity = new Map(); // Stores { username: timestamp }
let currentUserList = [];

// Session storage keys
const SESSION_TOKEN_KEY = 'htlcord_session_token';
const SESSION_USERNAME_KEY = 'htlcord_session_username';

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

// Save session to localStorage
function saveSession(username, token) {
    if (username && token) {
        localStorage.setItem(SESSION_USERNAME_KEY, username);
        localStorage.setItem(SESSION_TOKEN_KEY, token);
        console.log('Session saved');
    }
}

// Clear session from localStorage
function clearSession() {
    localStorage.removeItem(SESSION_USERNAME_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    console.log('Session cleared');
}

// Load saved session
function loadSavedSession() {
    const savedUsername = localStorage.getItem(SESSION_USERNAME_KEY);
    const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (savedUsername && savedToken) {
        return { username: savedUsername, token: savedToken };
    }
    return null;
}

// Sort users by activity (most recent first)
function sortUsersByActivity(users) {
    return users.sort((a, b) => {
        const timeA = userActivity.get(a) || 0;
        const timeB = userActivity.get(b) || 0;
        return timeB - timeA; // Descending order (newest first)
    });
}

// Update user activity timestamp
function updateUserActivity(username) {
    userActivity.set(username, Date.now());
    refreshUserList();
}

// Refresh the user list UI with sorted users
function refreshUserList() {
    if (!currentUserList.length) return;
    
    const userListContainer = document.getElementById('userlist');
    userListContainer.innerHTML = '';
    
    // Sort users by activity
    const sortedUsers = sortUsersByActivity([...currentUserList]);
    
    let hasUsers = false;
    sortedUsers.forEach(user => {
        if (user === username.value) {
            return;
        }
        hasUsers = true;
        const userButton = document.createElement('button');
        userButton.className = 'user-button';
        
        userButton.textContent = user;
        userButton.onclick = () => {
            if (user !== username.value) {
                // Update activity when clicking on user
                updateUserActivity(user);
                
                output.value = "";
                currentchat = user;
                updateActiveChatLabel(user);
                
                // Remove notification badge from all buttons
                const userButtons = document.getElementsByClassName('user-button');
                for (const btn of userButtons) {
                    btn.classList.remove('dm-notification');
                }
                
                log(`Switched to ${currentchat}\n`);
                messageInput.focus();
                socket.send(JSON.stringify({ type: 'request', content: 'dmlog', username: currentchat }));
                // make title of page current chat
                document.title = `HTLcord - ${currentchat}`;
            }
        };
        userListContainer.appendChild(userButton);
    });
    
    if (!hasUsers) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-message';
        placeholder.textContent = 'No other users online.';
        userListContainer.appendChild(placeholder);
    }
}

function updateuserList(userlist) {
    currentUserList = [...userlist];
    refreshUserList();
}

async function authRequest(endpoint) {
    if (!username.value) {
        throw new Error('Username required');
    }
    if (!password.value) {
        throw new Error('Password required');
    }

    const response = await fetch(`${window.location.origin}/${endpoint}`, {
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
        // Save session after successful registration
        saveSession(username.value, token);
        log(`Registered and authenticated as ${username.value}`);
        // Auto-connect after registration
        await connectToServer(token);
    } catch (error) {
        log(`Register failed: ${error.message}`);
    }
};

let authToken = null;

function log(message) {
    output.value += message + '\n';
    output.scrollTop = output.scrollHeight;
}

// Separate function for connecting with existing token
async function connectToServer(token) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        log('Already connected');
        return;
    }

    authToken = token;

    socket = new WebSocket(`${PROTOCOL}://${window.location.host}/ws?token=${encodeURIComponent(authToken)}`);

    socket.onopen = () => {
        log('Connected to server');
        updateConnectionStatus(true);
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
                
                // Update activity for the user who sent the DM
                updateUserActivity(data.username);
                
                // make button of that user in userlist turn blue
                const userButtons = document.getElementsByClassName('user-button');
                for (const btn of userButtons) {
                    if (btn.textContent === data.username) {
                        btn.classList.add('dm-notification');
                    }
                }
                
                // Only log the message if we're currently in that DM chat
                if (currentchat === data.username) {
                    log(`DM from ${data.username}: ${data.message}`);
                }
            }
            else if (data.type === 'dmlog') {
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
        log('Connection error - Token may be invalid or expired');
        updateConnectionStatus(false);
        // Clear invalid session
        clearSession();
        username.value = '';
        password.value = '';
        // Show login prompt in the message area
        log('========================================');
        log('Session expired or invalid!');
        log('Please enter your credentials and click Login');
        log('========================================\n');
    };
    
    socket.onclose = () => {
        log('Disconnected');
        updateConnectionStatus(false);
        updateActiveChatLabel('broadcast'); // Reset the chat label
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        sendBtn.disabled = true;
        messageInput.disabled = true;
        updateBtn.disabled = true;
        socket = null;
        
        // Clear user activity on disconnect
        userActivity.clear();
        currentUserList = [];
        
        const userListContainer = document.getElementById('userlist');
        userListContainer.innerHTML = '<div class="placeholder-message">No users yet. Connect to start.</div>';
    };
}

connectBtn.onclick = async () => {
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        log('Already connected');
        password.value = '';
        return;
    }

    try {
        authToken = await authRequest('login');
        // Save session after successful login
        saveSession(username.value, authToken);
        await connectToServer(authToken);
        password.value = '';
    } catch (error) {
        log(`Login failed: ${error.message}`);
        // Clear any saved session on login failure
        clearSession();
        password.value = '';
        return;
    }
    //clear password field on every login attempt for security
    password.value = '';
};

disconnectBtn.onclick = () => {
    if (socket) {
        socket.close();
        // Clear session when manually disconnecting
        clearSession();
        // Clear username and password fields
        //username.value = '';
        password.value = '';
        //clear message area
        output.value = '';
    }
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
        updateActiveChatLabel('broadcast');
        socket.send(JSON.stringify({ type: 'request', content: 'log' }));
        currentchat = "broadcast";
        messageInput.focus();
            // make title of page broadcast
        document.title = `HTLcord - broadcast`;
    }
};

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevents newline in input
        sendBtn.click(); // Triggers the send button's click event
    }
});

// Add Enter key login for password field
password.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        // Only trigger login if we're not already connected
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectBtn.click();
        }
    }
});

// Optional: Also add Enter key for username field (for convenience)
username.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        // Only trigger login if we're not already connected
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectBtn.click();
        }
    }
});

// Auto-login function for page load
async function tryAutoLogin() {
    const savedSession = loadSavedSession();
    
    if (savedSession) {
        
        username.value = savedSession.username;
        
        // Just try to connect - if token is invalid, the WebSocket error will handle it
        log('Attempting auto-login...');
        await connectToServer(savedSession.token);
    } else {
        // Show login prompt in message area
        log('Please enter your username and password,');

    }
}

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

// Try auto-login when page loads
window.addEventListener('load', () => {
    tryAutoLogin();
});
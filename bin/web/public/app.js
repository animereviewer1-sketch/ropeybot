// WebSocket connection
let ws;
let reconnectInterval;
const recentActivity = [];

// Connect to WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);
        clearInterval(reconnectInterval);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        reconnectInterval = setInterval(() => {
            connectWebSocket();
        }, 5000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
    };
}

// Handle WebSocket messages
function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'status':
            updateStatus(message.data);
            break;
        case 'players':
            updatePlayers(message.data);
            break;
        case 'chat':
            updateChat(message.data);
            break;
        case 'newMessage':
            addChatMessage(message.data);
            const content = message.data.content;
            const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
            addActivity(`Message: ${truncated}`);
            break;
        case 'playerJoined':
            addActivity(`Player joined: ${message.data.name}`);
            fetchPlayers();
            break;
        case 'playerLeft':
            addActivity(`Player left: ${message.data.name}`);
            fetchPlayers();
            break;
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');

    if (connected) {
        indicator.className = 'status-indicator connected';
        text.textContent = 'Connected';
    } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
    }
}

// Update bot status
function updateStatus(status) {
    document.getElementById('botStatus').textContent = status.connected ? '✅ Connected' : '❌ Disconnected';
    document.getElementById('gameName').textContent = status.game || 'None';
    document.getElementById('playerCount').textContent = `${status.playerCount}/${status.roomLimit}`;
    document.getElementById('uptime').textContent = formatUptime(status.uptime);
    document.getElementById('roomName').textContent = status.roomName;
    document.getElementById('roomDescription').textContent = status.roomDescription || 'No description';
    document.getElementById('roomPrivacy').textContent = status.roomPrivate ? '🔒 Private' : '🌐 Public';
}

// Format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Update players list
function updatePlayers(players) {
    const playerList = document.getElementById('playerList');
    const targetSelect = document.getElementById('targetPlayer');
    const actionSelect = document.getElementById('actionPlayer');

    playerList.innerHTML = '';
    targetSelect.innerHTML = '<option value="">Select a player...</option>';
    actionSelect.innerHTML = '<option value="">Select a player...</option>';

    players.forEach(player => {
        // Player card
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <div class="player-info">
                <div>
                    <div class="player-name">${escapeHtml(player.name)}</div>
                    <div class="player-member">#${player.memberNumber}</div>
                </div>
                ${player.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
            </div>
        `;
        playerList.appendChild(card);

        // Dropdown options
        const option = document.createElement('option');
        option.value = player.memberNumber;
        option.textContent = `${player.name} (#${player.memberNumber})`;
        targetSelect.appendChild(option.cloneNode(true));
        actionSelect.appendChild(option.cloneNode(true));
    });
}

// Update chat messages
function updateChat(messages) {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = '';

    messages.forEach(msg => {
        addChatMessageToDOM(msg);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Add single chat message
function addChatMessage(message) {
    addChatMessageToDOM(message);
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Add chat message to DOM
function addChatMessageToDOM(msg) {
    const chatContainer = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';

    const time = new Date(msg.timestamp).toLocaleTimeString();
    msgDiv.innerHTML = `
        <div>
            <span class="chat-sender">${escapeHtml(msg.sender)}</span>
            <span class="chat-type chat-type-${msg.type}">${msg.type}</span>
            <span class="chat-time">${time}</span>
        </div>
        <div class="chat-content">${escapeHtml(msg.content)}</div>
    `;
    chatContainer.appendChild(msgDiv);
}

// Add activity
function addActivity(text) {
    recentActivity.unshift({
        text,
        time: new Date()
    });

    if (recentActivity.length > 10) {
        recentActivity.pop();
    }

    updateActivityList();
}

// Update activity list
function updateActivityList() {
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';

    recentActivity.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div>${escapeHtml(activity.text)}</div>
            <div class="activity-time">${activity.time.toLocaleTimeString()}</div>
        `;
        activityList.appendChild(item);
    });
}

// Fetch data from API
async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showToast(`Error fetching ${endpoint}`);
        return null;
    }
}

async function fetchPlayers() {
    const players = await fetchData('players');
    if (players) updatePlayers(players);
}

async function fetchConfig() {
    const config = await fetchData('config');
    if (config) {
        document.getElementById('superusers').value = config.superusers.join(', ');
        document.getElementById('members').value = config.members.join(', ');
        document.getElementById('configRoomName').value = config.room.Name || '';
        document.getElementById('configRoomDescription').value = config.room.Description || '';
        document.getElementById('configRoomPrivate').checked = config.room.Private || false;
        document.getElementById('configRoomLimit').value = config.room.Limit || 10;
    }
}

async function fetchBanList() {
    const banList = await fetchData('banlist');
    if (banList) {
        const container = document.getElementById('banList');
        container.innerHTML = '';

        if (banList.length === 0) {
            container.innerHTML = '<div style="color: #888;">No banned players</div>';
        } else {
            banList.forEach(memberNumber => {
                const item = document.createElement('span');
                item.className = 'ban-item';
                item.textContent = `#${memberNumber}`;
                container.appendChild(item);
            });
        }
    }
}

// Send message
async function sendMessage() {
    const type = document.getElementById('messageType').value;
    const content = document.getElementById('messageContent').value;
    const target = document.getElementById('targetPlayer').value;

    if (!content) {
        showToast('Please enter a message');
        return;
    }

    if (type === 'Whisper' && !target) {
        showToast('Please select a target for whisper');
        return;
    }

    try {
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, content, target: target ? parseInt(target) : undefined })
        });

        if (response.ok) {
            showToast('Message sent successfully');
            document.getElementById('messageContent').value = '';
        } else {
            showToast('Failed to send message');
        }
    } catch (error) {
        showToast('Error sending message');
    }
}

// Kick player
async function kickPlayer() {
    const memberNumber = document.getElementById('actionPlayer').value;

    if (!memberNumber) {
        showToast('Please select a player');
        return;
    }

    if (!confirm(`Are you sure you want to kick player #${memberNumber}?`)) {
        return;
    }

    try {
        const response = await fetch('/api/kick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberNumber: parseInt(memberNumber) })
        });

        if (response.ok) {
            showToast('Player kicked successfully');
        } else {
            showToast('Failed to kick player');
        }
    } catch (error) {
        showToast('Error kicking player');
    }
}

// Ban player
async function banPlayer() {
    const memberNumber = document.getElementById('actionPlayer').value;

    if (!memberNumber) {
        showToast('Please select a player');
        return;
    }

    if (!confirm(`Are you sure you want to BAN player #${memberNumber}?`)) {
        return;
    }

    try {
        const response = await fetch('/api/ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberNumber: parseInt(memberNumber) })
        });

        if (response.ok) {
            showToast('Player banned successfully');
            fetchBanList();
        } else {
            showToast('Failed to ban player');
        }
    } catch (error) {
        showToast('Error banning player');
    }
}

// Save configuration
async function saveConfig() {
    const superusers = document.getElementById('superusers').value
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

    const members = document.getElementById('members').value
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

    const room = {
        Name: document.getElementById('configRoomName').value,
        Description: document.getElementById('configRoomDescription').value,
        Private: document.getElementById('configRoomPrivate').checked,
        Limit: parseInt(document.getElementById('configRoomLimit').value)
    };

    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ superusers, members, room })
        });

        if (response.ok) {
            showToast('Configuration saved successfully');
        } else {
            showToast('Failed to save configuration');
        }
    } catch (error) {
        showToast('Error saving configuration');
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tab navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active tab
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(tab).classList.add('active');

        // Load data for specific tabs
        if (tab === 'config') {
            fetchConfig();
            fetchBanList();
        } else if (tab === 'players') {
            fetchPlayers();
        }
    });
});

// Message type change handler
document.getElementById('messageType').addEventListener('change', (e) => {
    const targetGroup = document.getElementById('targetGroup');
    if (e.target.value === 'Whisper') {
        targetGroup.style.display = 'block';
    } else {
        targetGroup.style.display = 'none';
    }
});

// Initialize on page load
window.addEventListener('load', () => {
    connectWebSocket();
    fetchPlayers();
});

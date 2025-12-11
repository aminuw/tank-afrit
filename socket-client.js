// CLIENT JEU - SOCKET.IO
// Auto-detect URL: Si localhost mais pas port 3000 (ex: WAMP), forcer 3000. Sinon auto (Render/Heroku/LocalNode).
const socketUrl = (window.location.hostname === 'localhost' && window.location.port !== '3000')
    ? 'http://localhost:3000'
    : undefined;
const socket = io(socketUrl);

// Variables globales pour le jeu
let myPlayerId = null;
let currentGameCode = null;
let isHost = false;
let gameUpdateCallback = null;
let gameState = { players: {}, bullets: {} };

socket.on('connect', () => {
    console.log('✅ Connecté au serveur de jeu ! ID:', socket.id);
    myPlayerId = socket.id;
    window.currentPlayerId = socket.id;
});

// --- API PUBLIQUE (similaire à avant) ---

window.createGame = function (name, skin) {
    return new Promise((resolve) => {
        socket.emit('createGame', { name, skin });

        // Attendre la confirmation
        socket.once('gameJoined', (data) => {
            isHost = data.isHost;
            currentGameCode = data.code;
            resolve({ gameCode: data.code });
        });
    });
};

window.joinGame = function (code, name, skin) {
    return new Promise((resolve, reject) => {
        socket.emit('joinGame', { code, name, skin });

        socket.once('gameJoined', (data) => {
            isHost = data.isHost;
            currentGameCode = data.code;
            resolve({ gameCode: data.code });
        });

        socket.once('error', (err) => reject(err));
    });
};

window.listenToGame = function (cb) {
    gameUpdateCallback = cb;
};

// --- EVENTS DU SERVEUR ---

socket.on('updatePlayerList', (players) => {
    // Mise à jour du lobby (WaitingRoom hook)
    if (window.waitingRoomInstance) {
        window.waitingRoomInstance.updateList(players);
    }
    // Mise à jour du state jeu
    gameState.players = players;
});

socket.on('gameStarted', () => {
    if (window.waitingRoomInstance) {
        window.waitingRoomInstance.onGameStart();
    }
});

socket.on('playerMoved', ({ id, data }) => {
    if (!gameState.players[id]) gameState.players[id] = {};
    Object.assign(gameState.players[id], data);

    // Callback jeu
    if (gameUpdateCallback) gameUpdateCallback(gameState);
});

socket.on('bulletFired', (bullet) => {
    if (gameUpdateCallback) gameUpdateCallback({ bullets: { [bullet.id]: bullet } });
});


// --- ACTIONS JEU ---

window.updatePlayerPosition = function (code, id, data) {
    socket.emit('playerInput', data);
};

window.sendBullet = function (id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPlayerId };
    socket.emit('shoot', b);
};

window.launchGameSignal = function () {
    socket.emit('startGame');
};

// Stub inutile mais présent pour compatibilité
window.initFirebase = function () { return true; };
window.generatePlayerId = () => socket.id;
window.playersListHook = () => gameState.players; // Pour WaitingRoom poiling si besoin (mais on use events now)

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
            gameState.map = data.map; // Stockage de la map
            resolve({ gameCode: data.code, map: data.map });
        });
    });
};

window.joinGame = function (code, name, skin) {
    return new Promise((resolve, reject) => {
        socket.emit('joinGame', { code, name, skin });

        socket.once('gameJoined', (data) => {
            isHost = data.isHost;
            currentGameCode = data.code;
            gameState.map = data.map;
            resolve({ gameCode: data.code, map: data.map });
        });

        socket.once('error', (err) => reject(err));
    });
};

window.listenToGame = function (cb) {
    gameUpdateCallback = cb;
};

// --- EVENTS DU SERVEUR ---

socket.on('updatePlayerList', (players) => {
    if (window.waitingRoomInstance) {
        window.waitingRoomInstance.updateList(players);
    }
    gameState.players = players;
    if (gameUpdateCallback) gameUpdateCallback(gameState);
});

socket.on('gameStarted', () => {
    if (window.waitingRoomInstance) {
        window.waitingRoomInstance.onGameStart();
    }
});

socket.on('playerMoved', ({ id, data }) => {
    if (!gameState.players[id]) gameState.players[id] = {};
    Object.assign(gameState.players[id], data);
    if (gameUpdateCallback) gameUpdateCallback(gameState);
});

socket.on('bulletFired', (bullet) => {
    if (gameUpdateCallback) gameUpdateCallback({ bullets: { [bullet.id]: bullet } });
});

socket.on('playerKilled', ({ victimId, killerId }) => {
    console.log(`💀 ${victimId} tué par ${killerId}`);
    // On pourrait ajouter un effet visuel ici ou dans battle-royale.js via le state update
});

// --- ACTIONS JEU ---

window.updatePlayerPosition = function (code, id, data) {
    socket.emit('playerInput', data);
};

window.sendBullet = function (id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPlayerId };
    socket.emit('shoot', b);
};

window.packetHit = function (targetId, damage) {
    socket.emit('playerHit', { targetId, damage });
};

window.launchGameSignal = function () {
    socket.emit('startGame');
};

// Stub
window.initFirebase = function () { return true; };
window.generatePlayerId = () => socket.id;
window.playersListHook = () => gameState.players;
window.getMapHook = () => gameState.map;

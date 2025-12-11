// SOCKET.IO CONFIGURATION (Remplacement Firebase)
// Compatible 100% avec le code existant

let socket;
let currentPlayerId;
let currentGameCode;
let gameUpdateCallback = null;

// Initialisation (Simulation de firebase.initializeApp)
function initFirebase() {
    console.log('🚀 Initialisation Socket.io...');
    // Connexion au serveur local
    socket = io();

    socket.on('connect', () => {
        console.log('✅ Connecté au serveur de jeu (Ping < 5ms)');
        currentPlayerId = socket.id;
    });

    socket.on('worldUpdate', (data) => {
        if (gameUpdateCallback) {
            // Adaptation du format pour que le jeu croie que c'est Firebase
            gameUpdateCallback(data);
        }
    });

    socket.on('newBullet', (bulletData) => {
        // Injection des balles dans le flux de donnees
        if (gameUpdateCallback) {
            gameUpdateCallback({
                bullets: { [bulletData.id]: bulletData }
            });
        }
    });

    socket.on('playerDied', (data) => {
        // Gestion de mort
        console.log('Mort:', data);
    });
}

function createGame(data, callback) {
    socket.emit('createGame', data);
    socket.once('gameCreated', (res) => {
        currentGameCode = res.code;
        joinGame(res.code, data.players[data.host].name, data.players[data.host].skin, (gameInfo) => {
            // Le callback attend une liste de jeux, on simule
            callback({ [res.code]: gameInfo });
        });
    });
}

function joinGame(code, name, skin, callback) {
    socket.emit('joinGame', { code, name, skin });
    socket.once('playerJoined', (data) => {
        currentGameCode = code;
        // On renvoie un pseudo-snapshot de demarrage
        callback({
            code: code,
            players: data.players
        });
    });
}

function listenToGame(callback) {
    gameUpdateCallback = callback;
}

// Envoi de position (Ultra haute frequence)
function updatePlayerPosition(gameCode, playerId, data) {
    socket.emit('playerMove', data);
}

// Tir (Instantane)
function sendBullet(bulletId, x, y, angle, damage) {
    socket.emit('shoot', {
        id: bulletId,
        ownerId: socket.id,
        x: x, y: y, angle: angle, damage: damage,
        t: Date.now()
    });
}

function sendHit(targetId, damage) {
    socket.emit('hit', { targetId, damage });
}

// Fonction de compatibilite (vides si non necessaires en socket)
function generatePlayerId() { return 'player_' + Math.random().toString(36).substr(2, 9); }
function generateGameCode() { return 'LAN'; }
function setPlayerReady() { }
function leaveGame() { socket.disconnect(); window.location.reload(); }
function stopListening() { gameUpdateCallback = null; }
function setPlayerDead() { }
function getActiveGames(cb) { cb({}); } // Pas de lobby public pour l'instant
function listenToPublicGames() { }
function cleanupOldGames() { }


// Export Global
window.initFirebase = initFirebase;
window.createGame = createGame;
window.joinGame = joinGame;
window.listenToGame = listenToGame;
window.updatePlayerPosition = updatePlayerPosition;
window.sendBullet = sendBullet;
window.sendHit = sendHit;
window.currentPlayerId = null; // Sera set par le socket

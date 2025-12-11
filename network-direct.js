// NETWORK DIRECT - ZERO SERVEUR
// Architecture : P2P Pur. Le Host donne son ID au Client. Point final.

let peer = null;
let myPeerId = null;
let hostConn = null; // Connexion vers le Host (si on est Client)
let connections = []; // Liste des Clients (si on est Host)
let isHost = false;
let gameUpdateCallback = null;
let gameState = { players: {}, bullets: {}, status: 'waiting' }; // Ajout status

// Initialisation au demarrage
(function initNetwork() {
    peer = new Peer(null, { debug: 1 });

    peer.on('open', (id) => {
        console.log('✅ MON ID RESEAU:', id);
        myPeerId = id;
        window.currentPlayerId = id;
    });

    peer.on('connection', (conn) => {
        handleConnection(conn);
    });

    peer.on('error', (err) => {
        console.error("Erreur PeerJS:", err);
        // alert("Info Réseau: " + err.type); 
    });
})();

// --- API JEU (Remplace Firebase) ---

function createGame(name, skin, isPublic) {
    return new Promise((resolve, reject) => {
        if (!myPeerId) return reject("Réseau pas encore prêt, attendez 5s...");

        isHost = true;
        // Init State
        gameState.players = {};
        gameState.bullets = {};
        gameState.status = 'waiting';
        gameState.players[myPeerId] = {
            name: name, skin: skin,
            hp: 100, alive: true,
            x: 0, y: 0, angle: 0,
            isHost: true, peerId: myPeerId
        };

        startGameLoop();
        resolve({ gameCode: myPeerId });
    });
}

function joinGame(targetId, name, skin) {
    return new Promise((resolve, reject) => {
        if (!myPeerId) return reject("Réseau pas prêt...");
        if (!targetId) return reject("ID vide !");

        targetId = targetId.trim();
        console.log("Tentative connexion vers:", targetId);
        const conn = peer.connect(targetId);

        const to = setTimeout(() => reject("Impossible de joindre " + targetId), 5000);

        conn.on('open', () => {
            clearTimeout(to);
            console.log("✅ Connecté au Host !");
            hostConn = conn;
            isHost = false;

            conn.send({ type: 'JOIN', name, skin, peerId: myPeerId });
            setupConnectionListeners(conn);
            resolve({ gameCode: targetId });
        });

        conn.on('error', (e) => { clearTimeout(to); reject("Erreur connexion: " + e); });
    });
}

function handleConnection(conn) {
    console.log("Client connecté:", conn.peer);
    connections.push(conn);

    conn.on('data', (data) => {
        if (data.type === 'JOIN') {
            gameState.players[data.peerId] = {
                name: data.name, skin: data.skin,
                hp: 100, alive: true,
                x: 0, y: 0, angle: 0,
                peerId: data.peerId
            };
            // Sync immédiate
            broadcast({ type: 'STATE', state: gameState });
        }
        else if (data.type === 'MOVE') {
            if (gameState.players[data.peerId]) Object.assign(gameState.players[data.peerId], data.data);
        }
        else if (data.type === 'SHOOT') {
            broadcast({ type: 'BULLET', data: data.data });
        }
    });

    conn.on('close', () => {
        if (gameState.players[conn.peer]) delete gameState.players[conn.peer];
    });
}

function setupConnectionListeners(conn) {
    conn.on('data', (packet) => {
        if (packet.type === 'STATE') {
            gameState = packet.state;
            if (gameUpdateCallback) gameUpdateCallback(gameState);

            // AUTO-START via Sync d'état (Plus robuste)
            if (gameState.status === 'playing' && window.waitingRoomInstance && !window.hasStartedGame) {
                console.log("🔴 Signal START reçu via STATE update !");
                window.hasStartedGame = true;
                window.waitingRoomInstance.onGameStart();
            }
        }
        else if (packet.type === 'BULLET') {
            if (gameUpdateCallback) gameUpdateCallback({ bullets: { [packet.data.id]: packet.data } });
        }
        else if (packet.type === 'START') {
            if (window.waitingRoomInstance && !window.hasStartedGame) {
                console.log("🔴 Signal START reçu via packet !");
                window.hasStartedGame = true;
                window.waitingRoomInstance.onGameStart();
            }
        }
    });
}

function startGameLoop() {
    setInterval(() => {
        if (isHost) {
            broadcast({ type: 'STATE', state: gameState });
            if (gameUpdateCallback) gameUpdateCallback(gameState);
        }
    }, 33);
}

function broadcast(msg) {
    connections.forEach(c => { if (c.open) c.send(msg); });
}

// Fonction spéciale déclenchée par le bouton LANCER (Host)
window.launchGameSignal = function () {
    if (isHost) {
        console.log("🟢 HOST: Lancement du jeu !");
        gameState.status = 'playing'; // Active le mode jeu
        broadcast({ type: 'STATE', state: gameState }); // Force la sync
        broadcast({ type: 'START' }); // Signal explicite
        return true;
    }
    return false;
}

// Exports
window.createGame = createGame;
window.joinGame = joinGame;
window.initFirebase = initFirebase;
window.listenToGame = listenToGame;
window.updatePlayerPosition = updatePlayerPosition;
window.sendBullet = sendBullet;
window.getActiveGames = getActiveGames;
window.generatePlayerId = () => myPeerId;
window.setPlayerReady = setPlayerReady;
// Hook pour WaitingRoom
window.playersListHook = () => gameState.players;

function getActiveGames(cb) { cb({}); }
function listenToGame(cb) { gameUpdateCallback = cb; }
function updatePlayerPosition(code, id, data) {
    if (isHost) { if (gameState.players[myPeerId]) Object.assign(gameState.players[myPeerId], data); }
    else if (hostConn && hostConn.open) hostConn.send({ type: 'MOVE', data, peerId: myPeerId });
}
function sendBullet(id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPeerId };
    if (isHost) broadcast({ type: 'BULLET', data: b });
    else if (hostConn && hostConn.open) hostConn.send({ type: 'SHOOT', data: b });
}
function setPlayerReady(r) { }

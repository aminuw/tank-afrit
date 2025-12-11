// P2P MANAGER - V4 (ID FIX)
// Architecture Hybride : Lobby Firebase + Gameplay PeerJS
// Compatible 100% avec le code existant

// --- VARIABLES GLOBALES ---
window.currentGameRef = null;
window.database = null;
window.currentPlayerId = null;

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBKrkx3sfcpVWz_S2VcgusXiZDX5RDimUc",
    authDomain: "tank-afrit.firebaseapp.com",
    databaseURL: "https://tank-afrit-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tank-afrit",
    storageBucket: "tank-afrit.firebasestorage.app",
    messagingSenderId: "582023151560",
    appId: "1:582023151560:web:7c64f404bd5315f7844afd",
    measurementId: "G-8DNJ7HF6TK"
};

// --- ETAT P2P ---
let peer = null;
let myPeerId = null;
let isHost = false;
let hostConnection = null;
let connections = {};
let gameUpdateCallback = null;
let gameState = { players: {}, bullets: {}, zone: { radius: 1200, centerX: 1200, centerY: 800 } };

// --- INITIALISATION ---
function initFirebase() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.database = firebase.database();

    peer = new Peer(null, { debug: 1 });
    peer.on('open', (id) => {
        console.log('✅ P2P ID:', id);
        myPeerId = id;
    });

    peer.on('connection', handleP2PConnection);
    return true;
}

function waitForPeerId() {
    return new Promise(resolve => {
        if (myPeerId) return resolve(myPeerId);
        const i = setInterval(() => {
            if (myPeerId) { clearInterval(i); resolve(myPeerId); }
        }, 100);
    });
}

// --- GESTION DU LOBBY (FIREBASE) ---

async function createGame(name, skin, isPublic) {
    await waitForPeerId();
    isHost = true;

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    // FIX: ID Unique propre au PC (plus de prefixe bizarre)
    const playerId = myPeerId;
    window.currentPlayerId = playerId;

    const gameData = {
        host: playerId,
        hostPeerId: myPeerId,
        status: 'waiting',
        isPublic: isPublic,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        players: {
            [playerId]: {
                name: name,
                skin: skin,
                isHost: true,
                peerId: myPeerId,
                ready: false
            }
        }
    };

    window.currentGameRef = database.ref('games/' + code);
    await window.currentGameRef.set(gameData);

    // Init Boucle Host
    gameState.players = {};
    gameState.players[playerId] = { ...gameData.players[playerId], x: 0, y: 0, hp: 100, alive: true };
    startHostLoop();

    return { gameCode: code };
}

async function joinGame(code, name, skin) {
    if (!code) throw new Error("Code invalide");
    await waitForPeerId();
    isHost = false;

    window.currentGameRef = database.ref('games/' + code);

    const snapshot = await window.currentGameRef.once('value');
    const gameVal = snapshot.val();
    if (!gameVal) throw new Error("Partie introuvable");

    // FIX: ID Unique propre au PC
    const playerId = myPeerId;
    window.currentPlayerId = playerId;

    // S'assurer qu'on n'est pas déjà dans la liste (doublon impossible car clé = ID)
    await window.currentGameRef.child('players/' + playerId).set({
        name: name,
        skin: skin,
        isHost: false,
        peerId: myPeerId,
        ready: false
    });

    // Connexion P2P
    const hostPeerId = gameVal.hostPeerId;
    if (hostPeerId && hostPeerId !== myPeerId) {
        connectToHostP2P(hostPeerId, name, skin);
    }

    return { gameCode: code, players: gameVal.players };
}

// --- LOGIQUE P2P (JEU) ---

function connectToHostP2P(hostId, name, skin) {
    console.log("🔗 Connecting P2P to", hostId);
    const conn = peer.connect(hostId);
    hostConnection = conn;

    conn.on('open', () => {
        console.log("✅ LIVE Connected!");
        conn.send({ type: 'JOIN_P2P', name, skin, peerId: myPeerId });
    });

    conn.on('data', onP2PData);
    conn.on('error', err => console.error("P2P Error:", err));
}

function handleP2PConnection(conn) {
    if (isHost) {
        console.log("🔗 Client connected:", conn.peer);
        connections[conn.peer] = conn;
        conn.on('data', (data) => onHostReceiveData(data, conn));
        conn.on('close', () => {
            delete gameState.players[conn.peer];
            delete connections[conn.peer];
        });
    } else {
        conn.on('data', onP2PData);
    }

}

function onHostReceiveData(packet, conn) {
    const senderPeerId = conn.peer;

    if (packet.type === 'JOIN_P2P') {
        gameState.players[senderPeerId] = {
            name: packet.name, skin: packet.skin,
            hp: 100, alive: true, x: 0, y: 0, angle: 0, turretAngle: 0,
            peerId: senderPeerId
        };
        conn.send({ type: 'STATE', state: gameState });
    }
    else if (packet.type === 'MOVE') {
        if (gameState.players[senderPeerId]) Object.assign(gameState.players[senderPeerId], packet.data);
    }
    else if (packet.type === 'SHOOT') {
        broadcastP2P({ type: 'BULLET', data: packet.data });
    }
}

function onP2PData(packet) {
    if (packet.type === 'STATE') {
        gameState = packet.state;
        if (gameUpdateCallback) gameUpdateCallback(gameState);
    }
    else if (packet.type === 'BULLET') {
        if (gameUpdateCallback) gameUpdateCallback({ bullets: { [packet.data.id]: packet.data } });
    }
}

function startHostLoop() {
    setInterval(() => {
        if (isHost) {
            broadcastP2P({ type: 'STATE', state: gameState });
            if (gameUpdateCallback) gameUpdateCallback(gameState);
        }
    }, 33);
}

function broadcastP2P(msg) {
    Object.values(connections).forEach(c => { if (c.open) c.send(msg); });
}

function updatePlayerPosition(code, id, data) {
    if (isHost) {
        if (gameState.players[myPeerId]) Object.assign(gameState.players[myPeerId], data);
    }
    else if (hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'MOVE', data });
    }
}

function sendBullet(id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPeerId };
    if (isHost) broadcastP2P({ type: 'BULLET', data: b });
    else if (hostConnection && hostConnection.open) hostConnection.send({ type: 'SHOOT', data: b });
}

function sendHit(targetId, damage) { }

function listenToGame(cb) { gameUpdateCallback = cb; }

// STUBS
function generatePlayerId() { return window.currentPlayerId || 'init_' + Date.now(); }
function getActiveGames(cb) { database.ref('games').limitToLast(10).once('value', s => cb(s.val() || {})); }
function setPlayerReady(isReady) {
    if (window.currentGameRef && window.currentPlayerId) {
        window.currentGameRef.child('players/' + window.currentPlayerId).update({ ready: isReady });
    }
}
function generateGameCode() { return 'P2P'; }
function cleanupOldGames() { }
function leaveGame() { window.location.reload(); }
function stopListening() { gameUpdateCallback = null; }
function setPlayerDead() { }
function listenToPublicGames() { }

window.initFirebase = initFirebase;
window.createGame = createGame;
window.joinGame = joinGame;
window.listenToGame = listenToGame;
window.updatePlayerPosition = updatePlayerPosition;
window.sendBullet = sendBullet;
window.getActiveGames = getActiveGames;
window.generatePlayerId = generatePlayerId;
window.setPlayerReady = setPlayerReady;
window.leaveGame = leaveGame;
window.stopListening = stopListening;
window.setPlayerDead = setPlayerDead;
window.sendHit = sendHit;
window.listenToPublicGames = listenToPublicGames;
window.cleanupOldGames = cleanupOldGames;

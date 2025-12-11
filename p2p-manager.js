// P2P MANAGER - HYBRIDE FIREBASE / WEBRTC (V2 - Promise Fix)
// Compatible avec les appels de game.js (async/await)

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

let peer;
let myPeerId;
let isHost = false;
let hostConnection = null;
let connections = [];
let gameUpdateCallback = null;
let gameState = { players: {}, bullets: {}, zone: { radius: 1200, centerX: 1200, centerY: 800 } };

function initFirebase() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    peer = new Peer(null, { debug: 1 });

    peer.on('open', (id) => {
        console.log('✅ P2P Ready. ID:', id);
        myPeerId = id;
        window.currentPlayerId = id;
    });

    peer.on('connection', (conn) => {
        connections.push(conn);
        conn.on('data', (data) => handlePacket(data, conn));
        conn.on('close', () => {
            if (gameState.players[conn.peer]) {
                gameState.players[conn.peer].alive = false;
                delete gameState.players[conn.peer];
            }
        });
    });

    return true;
}

function handlePacket(packet, conn) {
    if (packet.type === 'JOIN') {
        gameState.players[conn.peer] = {
            name: packet.name,
            skin: packet.skin,
            hp: 100, alive: true,
            x: 0, y: 0, angle: 0
        };
        conn.send({ type: 'STATE', state: gameState });

    } else if (packet.type === 'MOVE') {
        if (gameState.players[conn.peer]) {
            Object.assign(gameState.players[conn.peer], packet.data);
        }
    } else if (packet.type === 'SHOOT') {
        broadcast({ type: 'BULLET', data: packet.data });
    } else if (packet.type === 'HIT') {
        const target = gameState.players[packet.targetId];
        if (target) target.hp -= packet.damage;
    }
}

// --- API PUBLIQUE (PROMISE-BASED) ---

function createGame(name, skin, isPublic) {
    return new Promise((resolve, reject) => {
        // Attendre que PeerJS soit pret
        if (!myPeerId) {
            console.log("⏳ Attente P2P Init...");
            const check = setInterval(() => {
                if (myPeerId) { clearInterval(check); createGame(name, skin, isPublic).then(resolve).catch(reject); }
            }, 100);
            return;
        }

        isHost = true;
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();

        gameState.players[myPeerId] = {
            name: name, skin: skin,
            hp: 100, alive: true, isHost: true,
            x: 0, y: 0, angle: 0
        };

        firebase.database().ref('games/' + code).set({
            hostPeerId: myPeerId,
            hostName: name,
            status: 'waiting',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Demarrage boucle serveur
            setInterval(() => {
                if (isHost) {
                    broadcast({ type: 'STATE', state: gameState });
                    if (gameUpdateCallback) gameUpdateCallback(gameState);
                }
            }, 33);
            resolve({ gameCode: code });
        }).catch(reject);
    });
}


function joinGame(code, name, skin) {
    return new Promise((resolve, reject) => {
        if (!myPeerId) {
            const check = setInterval(() => {
                if (myPeerId) { clearInterval(check); joinGame(code, name, skin).then(resolve).catch(reject); }
            }, 100);
            return;
        }

        firebase.database().ref('games/' + code).once('value', s => {
            const val = s.val();
            if (!val) return reject("Partie introuvable");

            const conn = peer.connect(val.hostPeerId);
            hostConnection = conn;

            conn.on('open', () => {
                conn.send({ type: 'JOIN', name, skin });
                resolve({ gameCode: code });
            });

            conn.on('data', (packet) => {
                if (packet.type === 'STATE') {
                    gameState = packet.state;
                    if (gameUpdateCallback) gameUpdateCallback(gameState);
                } else if (packet.type === 'BULLET') {
                    if (gameUpdateCallback) gameUpdateCallback({ bullets: { [packet.data.id]: packet.data } });
                }
            });

            setTimeout(() => { if (!conn.open) reject("Timeout connexion Host"); }, 5000);
        });
    });
}

function broadcast(msg) {
    connections.forEach(c => { if (c.open) c.send(msg); });
}

function updatePlayerPosition(gameCode, id, data) {
    if (isHost) {
        if (gameState.players[myPeerId]) Object.assign(gameState.players[myPeerId], data);
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'MOVE', data });
    }
}

function sendBullet(id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPeerId };
    if (isHost) {
        broadcast({ type: 'BULLET', data: b });
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'SHOOT', data: b });
    }
}

function sendHit(targetId, damage) {
    if (hostConnection) hostConnection.send({ type: 'HIT', targetId, damage });
}

function listenToGame(cb) { gameUpdateCallback = cb; }

// Stubs
function generatePlayerId() { return myPeerId || 'init_' + Math.random(); }
function startListening() { }
function stopListening() { }
function leaveGame() { window.location.reload(); }
function setPlayerReady() { }
function setPlayerDead() { }
function getActiveGames(cb) {
    firebase.database().ref('games').limitToLast(10).once('value', s => cb(s.val() || {}));
}
function listenToPublicGames() { }
function cleanupOldGames() { }
function generateGameCode() { return 'P2P'; }

window.initFirebase = initFirebase;
window.createGame = createGame;
window.joinGame = joinGame;
window.sendBullet = sendBullet;
window.updatePlayerPosition = updatePlayerPosition;
window.listenToGame = listenToGame;
window.getActiveGames = getActiveGames;
window.generatePlayerId = generatePlayerId;
window.generateGameCode = generateGameCode;
window.setPlayerReady = setPlayerReady;
window.leaveGame = leaveGame;
window.stopListening = stopListening;
window.setPlayerDead = setPlayerDead;
window.sendHit = sendHit;
window.listenToPublicGames = listenToPublicGames;
window.cleanupOldGames = cleanupOldGames;

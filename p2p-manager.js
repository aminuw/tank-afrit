// P2P MANAGER - HYBRIDE FIREBASE / WEBRTC
// Objectif : Lobby via Firebase (Léger), Gameplay via PeerJS (P2P direct, Rapide, Gratuit, Netlify-friendly)

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
let connections = []; // Array of DataConnections (Host side)
let gameUpdateCallback = null;
let gameState = { players: {}, bullets: {}, zone: { radius: 1200, centerX: 1200, centerY: 800 } }; // Master State

function initFirebase() {
    // 1. Init Firebase (Lobby)
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // 2. Init PeerJS (Gameplay)
    peer = new Peer(null, { debug: 1 });

    peer.on('open', (id) => {
        console.log('✅ P2P Ready. ID:', id);
        myPeerId = id;
        window.currentPlayerId = id; // IMPORTANT : On utilise le PeerID comme PlayerID interne
    });

    // HOST : Réception connexion client
    peer.on('connection', (conn) => {
        connections.push(conn);
        conn.on('data', (data) => handlePacket(data, conn));
        conn.on('close', () => {
            if (gameState.players[conn.peer]) {
                gameState.players[conn.peer].alive = false; // Marquer comme mort/déco
                delete gameState.players[conn.peer];
            }
        });
    });

    return true;
}

// Logique HOST : Traiter les paquets des clients
function handlePacket(packet, conn) {
    if (packet.type === 'JOIN') {
        gameState.players[conn.peer] = {
            name: packet.name,
            skin: packet.skin,
            hp: 100, alive: true,
            x: 0, y: 0, angle: 0
        };
        // On renvoie immediatement l'etat pour que le client charge
        conn.send({ type: 'STATE', state: gameState });

    } else if (packet.type === 'MOVE') {
        if (gameState.players[conn.peer]) {
            Object.assign(gameState.players[conn.peer], packet.data);
        }

    } else if (packet.type === 'SHOOT') {
        // Relai de balle aux autres clients
        broadcast({ type: 'BULLET', data: packet.data });
    } else if (packet.type === 'HIT') {
        // Gestion dégâts (sommaire)
        const target = gameState.players[packet.targetId];
        if (target) target.hp -= packet.damage;
    }
}

// CREATION PARTIE (Netlify Friendly)
function createGame(data, cb) {
    isHost = true;
    const code = Math.random().toString(36).substr(2, 4).toUpperCase();

    // Init state local
    gameState.players[myPeerId] = {
        name: data.players[data.host].name,
        skin: data.players[data.host].skin,
        hp: 100, alive: true, x: 0, y: 0
    };

    // Enregistrement dans Firebase (Juste pour le listing)
    firebase.database().ref('games/' + code).set({
        hostPeerId: myPeerId, // La clé pour que les clients se connectent
        hostName: data.players[data.host].name,
        status: 'waiting',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });

    // BOUCLE SERVEUR (30 FPS) - Envoi de l'état du monde aux clients
    setInterval(() => {
        if (isHost) {
            broadcast({ type: 'STATE', state: gameState });
            // Update local
            if (gameUpdateCallback) gameUpdateCallback(gameState);
        }
    }, 33);

    cb({ [code]: gameState });
}

// REJOINDRE PARTIE
function joinGame(code, name, skin, cb) {
    // 1. Chercher le HostID dans Firebase
    firebase.database().ref('games/' + code).once('value', s => {
        const val = s.val();
        if (!val) return alert('Partie introuvable');

        // 2. Connexion P2P Directe au Host
        const conn = peer.connect(val.hostPeerId);
        hostConnection = conn;

        conn.on('open', () => {
            console.log('✅ Connecté au Host P2P !');
            conn.send({ type: 'JOIN', name, skin });
        });

        conn.on('data', (packet) => {
            if (packet.type === 'STATE') {
                gameState = packet.state; // Synchro Client
                if (gameUpdateCallback) gameUpdateCallback(gameState);

            } else if (packet.type === 'BULLET') {
                // Injection de balle (Event)
                if (gameUpdateCallback) {
                    // On simule un packet gameData avec bullets
                    gameUpdateCallback({ bullets: { [packet.data.id]: packet.data } });
                }
            }
        });

        cb({ code, players: {} });
    });
}

function broadcast(msg) {
    connections.forEach(c => {
        if (c.open) c.send(msg);
    });
}

// Envoi Position (Appelé par game.js)
function updatePlayerPosition(gameCode, id, data) {
    if (isHost) {
        // Update direct du state master
        if (gameState.players[myPeerId]) Object.assign(gameState.players[myPeerId], data);
    } else if (hostConnection && hostConnection.open) {
        // Envoi au Host
        hostConnection.send({ type: 'MOVE', data });
    }
}

// Tir
function sendBullet(id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPeerId };
    if (isHost) {
        broadcast({ type: 'BULLET', data: b });
        // Pour le host, le jeu local gère déjà la création visuelle
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'SHOOT', data: b });
    }
}

function sendHit(targetId, damage) {
    if (hostConnection) hostConnection.send({ type: 'HIT', targetId, damage });
}

function listenToGame(cb) { gameUpdateCallback = cb; }

// Stubs de compatibilité
function generatePlayerId() { return 'id_' + Math.random().toString(36).substr(2, 9); }
function startListening() { }
function stopListening() { }
function leaveGame() { window.location.reload(); }
function setPlayerReady() { }
function setPlayerDead() { }
function getActiveGames(cb) {
    // On garde la liste Firebase qui marche très bien pour ça
    firebase.database().ref('games').limitToLast(10).once('value', s => cb(s.val() || {}));
}
function listenToPublicGames() { }
function cleanupOldGames() { }
function generateGameCode() { return 'P2P'; }

// Exports Globaux
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

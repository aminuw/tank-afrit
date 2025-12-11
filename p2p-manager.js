// P2P MANAGER - V3 (FINAL & ROBUST)
// Architecture Hybride : Lobby Firebase + Gameplay PeerJS
// Compatible 100% avec le code existant (WaitingRoom, etc.)

// --- VARIABLES GLOBALES (Compatibilité) ---
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
let hostConnection = null; // Client -> Host
let connections = {}; // Host -> Clients { peerId: conn }
let gameUpdateCallback = null;
let gameState = {
    players: {},
    bullets: {},
    zone: { radius: 1200, centerX: 1200, centerY: 800 }
};

// --- INITIALISATION ---
function initFirebase() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.database = firebase.database();

    // Init PeerJS (pour le jeu futur)
    peer = new Peer(null, { debug: 1 });

    peer.on('open', (id) => {
        console.log('✅ P2P ID:', id);
        myPeerId = id;
    });

    // Ecoute des connexions P2P (Host & Client)
    peer.on('connection', handleP2PConnection);

    return true; // Pret pour le Lobby
}

// Helper: Attendre que le PeerID soit prêt
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
    const playerId = 'host_' + myPeerId;
    window.currentPlayerId = playerId;

    // Données pour le Lobby Firebase
    const gameData = {
        host: playerId,
        hostPeerId: myPeerId, // Important pour le P2P
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

    // Ecriture Firebase (Permet à WaitingRoom de fonctionner)
    window.currentGameRef = database.ref('games/' + code);
    await window.currentGameRef.set(gameData);

    // Initialiser la boucle P2P du Host
    // On prépare le state physique pour quand le jeu commencera
    gameState.players = {};
    gameState.players[myPeerId] = { ...gameData.players[playerId], x: 0, y: 0, hp: 100, alive: true };

    startHostLoop();

    return { gameCode: code };
}

async function joinGame(code, name, skin) {
    if (!code) throw new Error("Code invalide");
    await waitForPeerId();
    isHost = false;

    window.currentGameRef = database.ref('games/' + code);

    // 1. Vérifier existence partie
    const snapshot = await window.currentGameRef.once('value');
    const gameVal = snapshot.val();
    if (!gameVal) throw new Error("Partie introuvable");

    const playerId = 'player_' + myPeerId;
    window.currentPlayerId = playerId;

    // 2. S'ajouter au Lobby Firebase (Visible dans WaitingRoom)
    await window.currentGameRef.child('players/' + playerId).set({
        name: name,
        skin: skin,
        isHost: false,
        peerId: myPeerId,
        ready: false
    });

    // 3. Initier la connexion P2P cachée vers le Host
    const hostPeerId = gameVal.hostPeerId;
    if (hostPeerId) {
        connectToHostP2P(hostPeerId, name, skin);
    } else {
        console.error("❌ Pas de HostPeerID trouvé dans la partie !");
    }

    return { gameCode: code, players: gameVal.players };
}

// --- LOGIQUE P2P (JEU) ---

function connectToHostP2P(hostId, name, skin) {
    console.log("🔗 Connexion P2P vers", hostId);
    const conn = peer.connect(hostId);
    hostConnection = conn;

    conn.on('open', () => {
        console.log("✅ P2P Connecté au Host !");
        // Handshake P2P
        conn.send({ type: 'JOIN_P2P', name, skin, peerId: myPeerId });
    });

    conn.on('data', onP2PData);
    conn.on('error', err => console.error("Erreur P2P:", err));
}

function handleP2PConnection(conn) {
    if (isHost) {
        // Le Host enregistre le client
        console.log("🔗 Client connecté P2P:", conn.peer);
        connections[conn.peer] = conn;
        conn.on('data', (data) => onHostReceiveData(data, conn));
        conn.on('close', () => {
            // Nettoyage si déco
            delete gameState.players[conn.peer];
            delete connections[conn.peer];
        });
    } else {
        // Le Client recoit une connexion inverse? (Rare avec PeerJS simple)
        conn.on('data', onP2PData);
    }
}

// HOST : Recevoir Données des Clients
function onHostReceiveData(packet, conn) {
    const senderPeerId = conn.peer;

    if (packet.type === 'JOIN_P2P') {
        // Initialiser joueur dans le moteur physique
        gameState.players[senderPeerId] = {
            name: packet.name, skin: packet.skin,
            hp: 100, alive: true, x: 0, y: 0, angle: 0, turretAngle: 0,
            peerId: senderPeerId
        };
        // Sync Force
        conn.send({ type: 'STATE', state: gameState });
    }
    else if (packet.type === 'MOVE') {
        if (gameState.players[senderPeerId]) {
            Object.assign(gameState.players[senderPeerId], packet.data);
        }
    }
    else if (packet.type === 'SHOOT') {
        // Relayer le tir à tout le monde
        broadcastP2P({ type: 'BULLET', data: packet.data });
    }
}

// CLIENT : Recevoir Etat du Monde
function onP2PData(packet) {
    if (packet.type === 'STATE') {
        gameState = packet.state;
        // Injecter dans le moteur du jeu local
        if (gameUpdateCallback) gameUpdateCallback(gameState);
    }
    else if (packet.type === 'BULLET') {
        // Injecter balle
        if (gameUpdateCallback) gameUpdateCallback({ bullets: { [packet.data.id]: packet.data } });
    }
}

function startHostLoop() {
    setInterval(() => {
        if (isHost) {
            // Envoyer l'état du monde à tout le monde (Sync)
            broadcastP2P({ type: 'STATE', state: gameState });
            // Update Local
            if (gameUpdateCallback) gameUpdateCallback(gameState);
        }
    }, 33); // ~30 FPS
}

function broadcastP2P(msg) {
    Object.values(connections).forEach(c => {
        if (c.open) c.send(msg);
    });
}

// --- BRIDGE GAME.JS ---

function updatePlayerPosition(code, id, data) {
    // Si Host, on update direct le state master
    if (isHost) {
        if (gameState.players[myPeerId]) Object.assign(gameState.players[myPeerId], data);
    }
    // Si Client, on envoie au Host
    else if (hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'MOVE', data });
    }
}

function sendBullet(id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPeerId };
    if (isHost) broadcastP2P({ type: 'BULLET', data: b });
    else if (hostConnection && hostConnection.open) hostConnection.send({ type: 'SHOOT', data: b });
}

function sendHit(targetId, damage) {
    // TODO: hit validation serverside ideally
}

function listenToGame(cb) { gameUpdateCallback = cb; }

// --- STUBS COMPATIBILITE (Ne pas toucher) ---
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

// Exports
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

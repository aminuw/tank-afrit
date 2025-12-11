// NETWORK DIRECT - ZERO SERVEUR
// Architecture : P2P Pur. Le Host donne son ID au Client. Point final.

let peer = null;
let myPeerId = null;
let hostConn = null; // Connexion vers le Host (si on est Client)
let connections = []; // Liste des Clients (si on est Host)
let isHost = false;
let gameUpdateCallback = null;
let gameState = { players: {}, bullets: {} };

// Initialisation au demarrage
(function initNetwork() {
    // 1. Démarrer PeerJS avec un serveur gratuit public fiable
    peer = new Peer(null, {
        debug: 2
    });

    peer.on('open', (id) => {
        console.log('✅ MON ID RESEAU:', id);
        myPeerId = id;
        window.currentPlayerId = id;
    });

    peer.on('connection', (conn) => {
        // [HOST] Une personne se connecte
        handleConnection(conn);
    });

    peer.on('error', (err) => {
        console.error("Erreur PeerJS:", err);
        alert("Erreur Réseau P2P: " + err.type);
    });
})();

// --- API JEU (Remplace Firebase) ---

// Créer une partie = Juste dire "Je suis Host"
function createGame(name, skin, isPublic) {
    return new Promise((resolve, reject) => {
        if (!myPeerId) return reject("Réseau pas encore prêt, attendez 5s...");

        isHost = true;
        // Init State
        gameState.players = {};
        gameState.players[myPeerId] = {
            name: name, skin: skin,
            hp: 100, alive: true,
            x: 0, y: 0, angle: 0,
            isHost: true, peerId: myPeerId
        };

        // Démarrer la boucle serveur locale
        startGameLoop();

        // On renvoie notre propre ID comme "Code de partie"
        // Astuce: On renvoie une structure compatible avec le WaitingRoom
        resolve({ gameCode: myPeerId });
    });
}

// Rejoindre = Se connecter à l'ID donné
function joinGame(targetId, name, skin) {
    return new Promise((resolve, reject) => {
        if (!myPeerId) return reject("Réseau pas prêt...");
        if (!targetId) return reject("ID vide !");

        targetId = targetId.trim(); // Nettoyage

        console.log("Tentative connexion vers:", targetId);
        const conn = peer.connect(targetId);

        // Timeout de sécurité (5s)
        const to = setTimeout(() => reject("Impossible de joindre " + targetId + " (Inconnu ou Hors ligne ?)"), 5000);

        conn.on('open', () => {
            clearTimeout(to);
            console.log("✅ Connecté au Host !");
            hostConn = conn;
            isHost = false;

            // Envoyer mon profil
            conn.send({ type: 'JOIN', name, skin, peerId: myPeerId });

            // Ecouter les mises à jour du jeu
            setupConnectionListeners(conn);

            resolve({ gameCode: targetId });
        });

        conn.on('error', (e) => {
            clearTimeout(to);
            reject("Erreur connexion: " + e);
        });
    });
}

// --- LOGIQUE INTERNE ---

function handleConnection(conn) {
    console.log("Nouveau joueur connecté:", conn.peer);
    connections.push(conn);

    conn.on('data', (data) => {
        // [HOST] Reçoit données des clients
        if (data.type === 'JOIN') {
            // Ajouter joueur
            gameState.players[data.peerId] = {
                name: data.name, skin: data.skin,
                hp: 100, alive: true,
                x: 0, y: 0, angle: 0,
                peerId: data.peerId
            };
            // Confirmer et envoyer tout le state actuel
            broadcast({ type: 'STATE', state: gameState });
        }
        else if (data.type === 'MOVE') {
            if (gameState.players[data.peerId]) {
                Object.assign(gameState.players[data.peerId], data.data);
            }
        }
        else if (data.type === 'SHOOT') {
            broadcast({ type: 'BULLET', data: data.data });
        }
    });

    conn.on('close', () => {
        // Gérer déco
        if (gameState.players[conn.peer]) delete gameState.players[conn.peer];
    });
}

function setupConnectionListeners(conn) {
    conn.on('data', (packet) => {
        // [CLIENT] Reçoit du Host
        if (packet.type === 'STATE') {
            gameState = packet.state;
            if (gameUpdateCallback) gameUpdateCallback(gameState);
        }
        else if (packet.type === 'BULLET') {
            if (gameUpdateCallback) gameUpdateCallback({ bullets: { [packet.data.id]: packet.data } });
        }
        else if (packet.type === 'START') {
            // Signal de départ !
            if (window.waitingRoomInstance) window.waitingRoomInstance.onGameStart();
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

// --- INTERFACE AVEC LE RESTE DU JEU ---

function getActiveGames(cb) { cb({}); } // Pas de liste publique en Direct Link (Vie privée totale)
function initFirebase() { return true; } // Fake
function listenToGame(cb) { gameUpdateCallback = cb; }

function updatePlayerPosition(code, id, data) {
    if (isHost) {
        if (gameState.players[myPeerId]) Object.assign(gameState.players[myPeerId], data);
    } else if (hostConn && hostConn.open) {
        hostConn.send({ type: 'MOVE', data, peerId: myPeerId });
    }
}

function sendBullet(id, x, y, a, d) {
    const b = { id, x, y, angle: a, damage: d, ownerId: myPeerId };
    if (isHost) broadcast({ type: 'BULLET', data: b });
    else if (hostConn && hostConn.open) hostConn.send({ type: 'SHOOT', data: b });
}

function setPlayerReady(r) {
    // Optionnel : Dire au host qu'on est prêt (pas implémenté ici car auto) 
}

// Fonctions spéciales pour Waiting Room sans Firebase
window.launchGameSignal = function () {
    if (isHost) {
        broadcast({ type: 'START' }); // Dire aux clients de lancer
        return true;
    }
    return false;
}

// Exports Globaux
window.createGame = createGame;
window.joinGame = joinGame;
window.initFirebase = initFirebase; // Stub
window.listenToGame = listenToGame;
window.updatePlayerPosition = updatePlayerPosition;
window.sendBullet = sendBullet;
window.getActiveGames = getActiveGames;
window.generatePlayerId = () => myPeerId;
window.setPlayerReady = setPlayerReady;
window.launchGameSignal = window.launchGameSignal;

// Variables pour WaitingRoom
window.playersListHook = () => gameState.players; // Pour afficher la liste

/**
 * FIREBASE CONFIGURATION - TANK AFRIT
 * Projet: tank-afrit
 * Database: europe-west1
 */

// Configuration Firebase
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

// Variables globales
let database = null;
let currentGameRef = null;
let currentPlayerId = null;

function initFirebase() {
    try {
        // Importer Firebase depuis CDN
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Make sure to include Firebase scripts in HTML.');
            return false;
        }

        // Initialiser Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        database = firebase.database();
        console.log('âœ… Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('âŒ Firebase initialization error:', error);
        return false;
    }
}

// GÃ©nÃ©rer un ID unique pour le joueur
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// GÃ©nÃ©rer un code de partie (4 caractÃ¨res)
function generateGameCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 pour Ã©viter confusion
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// CrÃ©er une nouvelle partie
async function createGame(hostName, hostSkin) {
    const gameCode = generateGameCode();
    const playerId = generatePlayerId();
    currentPlayerId = playerId;

    const gameData = {
        code: gameCode,
        status: 'waiting', // waiting, countdown, playing, finished
        host: playerId,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        maxPlayers: 10,
        startCountdown: null,
        players: {
            [playerId]: {
                name: hostName,
                skin: hostSkin,
                ready: false,
                alive: true,
                kills: 0,
                x: 0,
                y: 0,
                angle: 0,
                turretAngle: 0,
                health: 100,
                hidden: false,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }
        },
        zone: {
            centerX: 1200,
            centerY: 800,
            radius: 1200,
            phase: 0,
            nextShrink: 30
        },
        map: {
            bushes: [],
            obstacles: []
        }
    };

    try {
        await database.ref('games/' + gameCode).set(gameData);
        currentGameRef = database.ref('games/' + gameCode);
        console.log('âœ… Game created:', gameCode);
        return { gameCode, playerId };
    } catch (error) {
        console.error('âŒ Error creating game:', error);
        return null;
    }
}

// Rejoindre une partie existante
async function joinGame(gameCode, playerName, playerSkin) {
    const playerId = generatePlayerId();
    currentPlayerId = playerId;

    try {
        const gameRef = database.ref('games/' + gameCode);
        const snapshot = await gameRef.once('value');

        if (!snapshot.exists()) {
            throw new Error('Game not found');
        }

        const gameData = snapshot.val();

        // VÃ©rifier si la partie est pleine
        const playerCount = Object.keys(gameData.players || {}).length;
        if (playerCount >= gameData.maxPlayers) {
            throw new Error('Game is full');
        }

        // VÃ©rifier si la partie a dÃ©jÃ  commencÃ©
        if (gameData.status !== 'waiting') {
            throw new Error('Game already started');
        }

        // Ajouter le joueur
        await gameRef.child('players/' + playerId).set({
            name: playerName,
            skin: playerSkin,
            ready: false,
            alive: true,
            kills: 0,
            x: 0,
            y: 0,
            angle: 0,
            turretAngle: 0,
            health: 100,
            hidden: false,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        });

        currentGameRef = gameRef;
        console.log('âœ… Joined game:', gameCode);
        return { gameCode, playerId };
    } catch (error) {
        console.error('âŒ Error joining game:', error);
        throw error;
    }
}

// Marquer le joueur comme prÃªt
async function setPlayerReady(ready = true) {
    if (!currentGameRef || !currentPlayerId) return;

    try {
        await currentGameRef.child('players/' + currentPlayerId + '/ready').set(ready);
        console.log('âœ… Player ready status:', ready);
    } catch (error) {
        console.error('âŒ Error setting ready status:', error);
    }
}

// Quitter la partie
async function leaveGame() {
    if (!currentGameRef || !currentPlayerId) return;

    try {
        // Retirer le joueur
        await currentGameRef.child('players/' + currentPlayerId).remove();

        // Si c'Ã©tait l'hÃ´te, supprimer la partie
        const snapshot = await currentGameRef.once('value');
        const gameData = snapshot.val();

        if (gameData && gameData.host === currentPlayerId) {
            await currentGameRef.remove();
            console.log('âœ… Game deleted (host left)');
        } else {
            console.log('âœ… Left game');
        }

        currentGameRef = null;
        currentPlayerId = null;
    } catch (error) {
        console.error('âŒ Error leaving game:', error);
    }
}

// Ã‰couter les changements de la partie
function listenToGame(callback) {
    if (!currentGameRef) return;

    currentGameRef.on('value', (snapshot) => {
        const gameData = snapshot.val();
        if (gameData) {
            callback(gameData);
        } else {
            // La partie a Ã©tÃ© supprimÃ©e
            callback(null);
        }
    });
}

// ArrÃªter d'Ã©couter les changements
function stopListening() {
    if (currentGameRef) {
        currentGameRef.off();
    }
}

// Mettre Ã  jour la position du joueur
async function updatePlayerPosition(x, y, angle, turretAngle, health, hidden) {
    if (!currentGameRef || !currentPlayerId) return;

    try {
        await currentGameRef.child('players/' + currentPlayerId).update({
            x: Math.round(x),
            y: Math.round(y),
            angle: Math.round(angle),
            turretAngle: Math.round(turretAngle),
            health: Math.round(health),
            hidden: hidden,
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error('âŒ Error updating position:', error);
    }
}

// Envoyer un tir
async function sendBullet(bulletId, x, y, angle, damage) {
    if (!currentGameRef || !currentPlayerId) return;

    try {
        await currentGameRef.child('bullets/' + bulletId).set({
            ownerId: currentPlayerId,
            x: Math.round(x),
            y: Math.round(y),
            angle: Math.round(angle),
            damage: damage,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Supprimer la balle aprÃ¨s 5 secondes (nettoyage)
        setTimeout(() => {
            currentGameRef.child('bullets/' + bulletId).remove();
        }, 5000);
    } catch (error) {
        console.error('âŒ Error sending bullet:', error);
    }
}

// Envoyer un hit
async function sendHit(targetId, damage) {
    if (!currentGameRef || !currentPlayerId) return;

    try {
        await currentGameRef.child('hits').push({
            shooterId: currentPlayerId,
            targetId: targetId,
            damage: damage,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error('âŒ Error sending hit:', error);
    }
}

// Marquer un joueur comme mort
async function setPlayerDead(killerId = null) {
    if (!currentGameRef || !currentPlayerId) return;

    try {
        await currentGameRef.child('players/' + currentPlayerId).update({
            alive: false,
            killedBy: killerId,
            deathTime: firebase.database.ServerValue.TIMESTAMP
        });

        // IncrÃ©menter les kills du tueur
        if (killerId) {
            const killerRef = currentGameRef.child('players/' + killerId + '/kills');
            await killerRef.transaction((currentKills) => {
                return (currentKills || 0) + 1;
            });
        }
    } catch (error) {
        console.error('âŒ Error setting player dead:', error);
    }
}

// Obtenir la liste des parties actives
async function getActiveGames() {
    try {
        const snapshot = await database.ref('games').orderByChild('status').equalTo('waiting').once('value');
        const games = [];

        snapshot.forEach((childSnapshot) => {
            const gameData = childSnapshot.val();
            const playerCount = Object.keys(gameData.players || {}).length;

            games.push({
                code: gameData.code,
                playerCount: playerCount,
                maxPlayers: gameData.maxPlayers,
                host: gameData.players[gameData.host]?.name || 'Unknown'
            });
        });

        return games;
    } catch (error) {
        console.error('âŒ Error getting active games:', error);
        return [];
    }
}

// Nettoyer les anciennes parties (Ã  appeler pÃ©riodiquement)
async function cleanupOldGames() {
    try {
        const snapshot = await database.ref('games').once('value');
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        snapshot.forEach((childSnapshot) => {
            const gameData = childSnapshot.val();
            if (gameData.createdAt < oneHourAgo) {
                childSnapshot.ref.remove();
                console.log('ðŸ§¹ Cleaned up old game:', gameData.code);
            }
        });
    } catch (error) {
        console.error('âŒ Error cleaning up games:', error);
    }
}

// Export des fonctions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initFirebase,
        generatePlayerId,
        generateGameCode,
        createGame,
        joinGame,
        setPlayerReady,
        leaveGame,
        listenToGame,
        stopListening,
        updatePlayerPosition,
        sendBullet,
        sendHit,
        setPlayerDead,
        getActiveGames,
        cleanupOldGames
    };
}

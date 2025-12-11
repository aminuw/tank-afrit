const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingInterval: 2000,
    pingTimeout: 5000
});

// Servir les fichiers statiques (Le Jeu)
app.use(express.static(__dirname));

// Etat du jeu (Mémoire Serveur)
let games = {};

io.on('connection', (socket) => {
    console.log('⚡ Joueur connecté:', socket.id);

    socket.on('createGame', ({ name, skin }) => {
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        games[code] = {
            players: {},
            bullets: [],
            map: generateMap(), // Nouveau terrain
            status: 'waiting',
            hostId: socket.id
        };
        joinGameLocally(socket, code, name, skin, true);
    });

    socket.on('joinGame', ({ code, name, skin }) => {
        code = code.toUpperCase(); // Tolérance majuscule
        if (games[code]) {
            joinGameLocally(socket, code, name, skin, false);
        } else {
            socket.emit('error', 'Partie introuvable');
        }
    });

    socket.on('playerInput', (data) => {
        // Relai ultra-rapide des positions
        const room = getPlayerRoom(socket);
        if (room) {
            socket.to(room).emit('playerMoved', { id: socket.id, data: data });

            // Mise à jour de l'état serveur (Pour la Zone et les collisions serv)
            if (games[room] && games[room].players[socket.id]) {
                games[room].players[socket.id].x = data.x;
                games[room].players[socket.id].y = data.y;
            }
        }
    });

    socket.on('shoot', (bulletData) => {
        const room = getPlayerRoom(socket);
        if (room) {
            io.to(room).emit('bulletFired', bulletData);
        }
    });

    // HIT DETECTION (Shooter Authoritative)
    socket.on('playerHit', ({ targetId, damage }) => {
        const room = getPlayerRoom(socket);
        if (room && games[room] && games[room].players[targetId]) {
            const victim = games[room].players[targetId];
            victim.hp -= damage;

            // Mort ?
            if (victim.hp <= 0) {
                victim.hp = 0;
                io.to(room).emit('playerKilled', { victimId: targetId, killerId: socket.id });
            }

            // Sync tout le monde
            io.to(room).emit('updatePlayerList', games[room].players);
        }
    });

    socket.on('startGame', () => {
        const code = getPlayerRoom(socket);
        if (code && games[code].hostId === socket.id) {

            // Phase 1: Countdown
            games[code].status = 'countdown';
            games[code].countdown = 5; // 5 secondes

            // Initialisation de la Zone (Storm)
            games[code].zone = {
                x: 1000, y: 1000, // Centre
                radius: 1500,     // Commence très large (hors écran)
                targetRadius: 0,  // Finit au centre (mortel)
                shrinkSpeed: 0.4  // Vitesse
            };

            startGameLoop(code);
            io.to(code).emit('gameUpdate', { status: 'countdown', countdown: 5 });
        }
    });

    socket.on('disconnect', () => {
        const code = getPlayerRoom(socket);
        if (code) {
            delete games[code].players[socket.id];
            io.to(code).emit('playerLeft', socket.id);
            // Si plus personne, on supprime la room
            if (Object.keys(games[code].players).length === 0) {
                if (games[code].interval) clearInterval(games[code].interval);
                delete games[code];
            }
        }
    });
});

function startGameLoop(code) {
    if (games[code].interval) clearInterval(games[code].interval);

    console.log(`🌀 Loop démarrée pour la game ${code}`);

    games[code].interval = setInterval(() => {
        const game = games[code];
        if (!game) return;

        // PHASE 1: COMPTE A REBOURS
        if (game.status === 'countdown') {
            game.countdown -= 0.1; // 10 ticks/s
            if (game.countdown <= 0) {
                game.status = 'playing';
                io.to(code).emit('gameUpdate', { status: 'playing' });
                io.to(code).emit('gameStarted'); // Le vrai début
            } else {
                // On envoie le temps aux joueurs pour l'affichage (arrondi)
                // Optimisation: on pourrait l'envoyer moins souvent, mais simple ici.
            }
            // On envoie un update léger
            io.to(code).emit('gameUpdate', { status: 'countdown', countdown: Math.ceil(game.countdown) });
            return;
        }

        // PHASE 2: JEU ACTIF (Zone + Win Condition)
        if (game.status === 'playing') {
            // 1. Rétrécir la Zone
            if (game.zone.radius > game.zone.targetRadius) {
                game.zone.radius -= game.zone.shrinkSpeed;
            }

            // 2. Vérifier les joueurs (Dégâts de zone + Win Condition)
            let aliveCount = 0;
            let lastSurvivorId = null;
            let someoneDied = false;

            Object.values(game.players).forEach(p => {
                if (p.hp > 0) {
                    aliveCount++;
                    lastSurvivorId = p.id;

                    // Est-il dans la zone ?
                    const dist = Math.sqrt(Math.pow(p.x - game.zone.x, 2) + Math.pow(p.y - game.zone.y, 2));
                    if (dist > game.zone.radius) {
                        // Dégâts de storm
                        p.hp -= 0.5;
                        someoneDied = true;
                        if (p.hp <= 0) {
                            p.hp = 0;
                            io.to(code).emit('playerKilled', { victimId: p.id, killerId: 'LA ZONE' });
                        }
                    }
                }
            });

            // 3. Victoire ? (S'il ne reste qu'un survivant et qu'on jouait)
            // Note: >1 au départ pour éviter win instantanée si on est seul pour tester
            if (Object.keys(game.players).length > 1 && aliveCount <= 1) {
                clearInterval(game.interval);
                game.status = 'finished';
                console.log(`🏆 Victoire de ${lastSurvivorId}`);
                io.to(code).emit('gameOver', { winnerId: lastSurvivorId });
            }

            // 4. Sync périodique
            io.to(code).emit('zoneUpdate', game.zone);
            if (someoneDied) io.to(code).emit('updatePlayerList', game.players);
        }

    }, 100); // 10 ticks par seconde
}

function joinGameLocally(socket, code, name, skin, isHost) {
    socket.data.gameCode = code; // Stockage direct pour accès rapide
    socket.join(code);

    // SPAWN ALEATOIRE (Carte 2000x2000)
    // On évite les bords extrêmes
    const spawnX = 200 + Math.random() * 1600;
    const spawnY = 200 + Math.random() * 1600;

    games[code].players[socket.id] = {
        id: socket.id,
        name, skin,
        isHost,
        hp: 100,
        x: spawnX,
        y: spawnY
    };

    // Renvoyer infos au joueur
    socket.emit('gameJoined', {
        code,
        isHost,
        playerId: socket.id,
        map: games[code].map
    });

    // Mettre à jour tout le monde dans la room
    io.to(code).emit('updatePlayerList', games[code].players);
}

function generateMap() {
    const map = [];
    // 20 Obstacles aléatoires
    for (let i = 0; i < 20; i++) {
        map.push({
            type: Math.random() > 0.5 ? 'rock' : 'bush',
            x: Math.random() * 2000,
            y: Math.random() * 2000,
            size: 40 + Math.random() * 40
        });
    }
    return map;
}

function getPlayerRoom(socket) {
    // Accès direct via socket.data (plus robuste)
    return socket.data.gameCode || null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 SERVEUR JEU READY sur port ${PORT}`);
});

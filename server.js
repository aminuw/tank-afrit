const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" },
    pingInterval: 2000,
    pingTimeout: 5000
});

app.use(express.static('.')); // Servir les fichiers du dossier courant

// Etat du jeu
const games = {};

// Constantes
const TICK_RATE = 60; // 60 mises a jour par seconde (Fluidite max)

io.on('connection', (socket) => {
    console.log('Nouveau joueur connecte:', socket.id);
    let currentGameCode = null;

    // Creation de partie
    socket.on('createGame', (data) => {
        const gameCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        games[gameCode] = {
            players: {},
            bullets: [],
            obstacles: [], // La map
            zone: {
                centerX: 2400 / 2,
                centerY: 1600 / 2,
                radius: 1200,
                phase: 0,
                phaseTimer: 0
            },
            host: socket.id,
            status: 'waiting'
        };
        socket.emit('gameCreated', { code: gameCode });
    });

    // Rejoindre une partie
    socket.on('joinGame', ({ code, name, skin }) => {
        const game = games[code];
        if (game) {
            currentGameCode = code;
            socket.join(code);

            // Ajouter le joueur
            game.players[socket.id] = {
                id: socket.id,
                name: name,
                skin: skin,
                x: 0,
                y: 0,
                angle: 0,
                turretAngle: 0,
                hp: 100,
                alive: true,
                score: 0
            };

            // Informer tout le monde
            io.to(code).emit('playerJoined', {
                id: socket.id,
                players: game.players,
                isHost: socket.id === game.host
            });
        } else {
            socket.emit('error', 'Partie introuvable');
        }
    });

    // Mouvement du joueur
    socket.on('playerMove', (data) => {
        if (!currentGameCode || !games[currentGameCode]) return;
        const player = games[currentGameCode].players[socket.id];
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.angle = data.angle;
            player.turretAngle = data.turretAngle;
        }
    });

    // Tir
    socket.on('shoot', (bulletData) => {
        if (!currentGameCode || !games[currentGameCode]) return;
        // On relaie immediatement la balle aux autres (Zero latency perception)
        socket.to(currentGameCode).emit('newBullet', bulletData);
    });

    // Touche / Degats
    socket.on('hit', ({ targetId, damage }) => {
        if (!currentGameCode || !games[currentGameCode]) return;
        const game = games[currentGameCode];
        const target = game.players[targetId];

        if (target && target.alive) {
            target.hp -= damage;
            if (target.hp <= 0) {
                target.hp = 0;
                target.alive = false;
                io.to(currentGameCode).emit('playerDied', {
                    victimId: targetId,
                    killerId: socket.id
                });
            }
            // Mettre a jour la vie pour tout le monde
            io.to(currentGameCode).emit('playerHealthUpdate', {
                id: targetId,
                hp: target.hp
            });
        }
    });

    // Deconnexion
    socket.on('disconnect', () => {
        if (currentGameCode && games[currentGameCode]) {
            delete games[currentGameCode].players[socket.id];
            io.to(currentGameCode).emit('playerLeft', socket.id);

            // Si l'hote part, on ferme ? Ou on migre ? Pour l'instant on laisse.
            if (Object.keys(games[currentGameCode].players).length === 0) {
                delete games[currentGameCode];
            }
        }
    });
});

// Boucle principale du serveur (Heartbeat)
setInterval(() => {
    Object.keys(games).forEach(code => {
        const game = games[code];
        // Envoi du snapshot du monde a tous les joueurs (60 fois par seconde)
        io.to(code).emit('worldUpdate', {
            players: game.players,
            zone: game.zone
        });
    });
}, 1000 / TICK_RATE);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 SERVEUR GAMING LAN: http://localhost:${PORT}`);
});

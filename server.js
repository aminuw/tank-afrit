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
        // Relai ultra-rapide des positions (Client Authoritative pour la fluidité)
        // Pour un jeu "Zero Lag" perçu, on fait confiance au client pour le mouvement
        // et on broadcast immédiatement.
        const room = getPlayerRoom(socket);
        if (room) {
            socket.to(room).emit('playerMoved', { id: socket.id, data: data });
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
            games[code].status = 'playing';
            io.to(code).emit('gameStarted');
        }
    });

    socket.on('disconnect', () => {
        const code = getPlayerRoom(socket);
        if (code) {
            delete games[code].players[socket.id];
            io.to(code).emit('playerLeft', socket.id);
            // Si plus personne, on supprime la room
            if (Object.keys(games[code].players).length === 0) {
                delete games[code];
            }
        }
    });
});

function joinGameLocally(socket, code, name, skin, isHost) {
    socket.join(code);
    games[code].players[socket.id] = {
        id: socket.id,
        name, skin,
        isHost,
        hp: 100
    };

    // Renvoyer infos au joueur
    socket.emit('gameJoined', {
        code,
        isHost,
        playerId: socket.id,
        map: games[code].map // Envoi de la map
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
    // Array.from car socket.rooms est un Set
    for (const room of Array.from(socket.rooms)) {
        if (games[room]) return room;
    }
    return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 SERVEUR JEU READY sur port ${PORT}`);
});

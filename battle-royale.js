/**
 * BATTLE ROYALE V2 - REFAIT DE ZERO
 * Moteur simplifié et robuste pour Socket.io
 */
class BattleRoyaleGame {
    constructor(canvas, playerName, playerSkin, gameCode, isHost) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Plein écran
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;

        // Redimensionnement auto
        window.addEventListener('resize', () => {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        });

        // Identité
        this.playerName = playerName;
        this.playerSkin = playerSkin || { color: '#2196F3' }; // Bleu par défaut
        this.myId = window.currentPlayerId; // ID Socket
        this.gameCode = gameCode;
        this.isHost = isHost;

        // État du jeu
        this.players = {};
        this.bullets = [];
        this.explosions = [];

        // Charger les joueurs déjà présents dans le lobby
        if (window.playersListHook) {
            this.players = window.playersListHook();
        }

        // Inputs
        this.keys = {};
        this.mouseX = 0; this.mouseY = 0;

        // Setup
        this.setupInputs();
        this.listenToNetwork();

        console.log("🎮 MOTEUR BR V2 DÉMARRÉ ! ID:", this.myId);

        // Boucle de jeu
        this.lastTime = 0;
        this.loop = this.loop.bind(this);
        // Démarrage immédiat
        requestAnimationFrame(this.loop);
    }

    setupInputs() {
        // Clavier
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // Souris
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // Tir
        this.canvas.addEventListener('mousedown', () => this.shoot());
    }

    listenToNetwork() {
        // Abonnement aux mises à jour du serveur (via socket-client.js)
        if (window.listenToGame) {
            window.listenToGame((state) => {
                // Mise à jour des joueurs (positions, vie...)
                if (state.players) {
                    this.players = state.players;
                }

                // Mise à jour des balles (nouvelles balles reçues)
                if (state.bullets) {
                    Object.values(state.bullets).forEach(b => {
                        // On ajoute seulement si on ne la connait pas déjà (simple id check ou juste push)
                        // Pour faire simple ici on push tout ce qui arrive comme "fire event"
                        this.bullets.push(b);
                    });
                }
            });
        }
    }

    update(dt) {
        // --- 1. Mouvement Local ---
        // Vitesse : 300px/s
        const speed = 300 * dt;
        let dx = 0, dy = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += speed;

        // Si je suis dans la liste des joueurs (je devrais l'être)
        if (this.players[this.myId]) {
            const me = this.players[this.myId];

            // Appliquer mouvement
            me.x = (me.x || 100) + dx;
            me.y = (me.y || 100) + dy;

            // Calcul angle visée (vers souris)
            const dxM = this.mouseX - me.x;
            const dyM = this.mouseY - me.y;
            me.angle = Math.atan2(dyM, dxM);

            // --- 2. Envoi Réseau (Optimisation : seulement si ça bouge) ---
            if ((dx !== 0 || dy !== 0 || true) && window.updatePlayerPosition) {
                // Note: true force l'envoi pour la rotation aussi
                window.updatePlayerPosition(this.gameCode, this.myId, {
                    x: me.x,
                    y: me.y,
                    angle: me.angle
                });
            }
        }

        // --- 3. Update Balles ---
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += Math.cos(b.angle) * 800 * dt; // Vitesse balle 800
            b.y += Math.sin(b.angle) * 800 * dt;

            // Supprimer si hors écran (simple garbage collection)
            if (b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw() {
        // Fond noir spatial
        this.ctx.fillStyle = '#0a0a10';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Grille Cyberpunk
        this.drawGrid();

        // Afficher tous les joueurs
        Object.values(this.players).forEach(p => {
            this.drawPlayer(p);
        });

        // Afficher les balles
        this.ctx.fillStyle = '#ffeb3b'; // Jaune
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffeb3b';
        this.bullets.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
    }

    drawPlayer(p) {
        const ctx = this.ctx;
        if (!p.x) p.x = 200; // Position par défaut si bug
        if (!p.y) p.y = 200;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);

        // Corps du Tank
        ctx.fillStyle = p.skin ? p.skin.color : '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeRect(-20, -20, 40, 40);

        // Tourelle
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -6, 35, 12);

        ctx.restore();

        // Nom du joueur au dessus
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - 35);

        // Barre de vie (HP)
        const hp = p.hp || 100;
        ctx.fillStyle = '#f00';
        ctx.fillRect(p.x - 20, p.y - 30, 40, 5);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(p.x - 20, p.y - 30, 40 * (hp / 100), 5);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        const cellSize = 50;

        for (let x = 0; x < this.width; x += cellSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += cellSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
        }
    }

    shoot() {
        if (!this.players[this.myId]) return;
        const p = this.players[this.myId];

        // Envoi au serveur
        if (window.sendBullet) {
            window.sendBullet(Date.now(), p.x, p.y, p.angle, 10);
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop);
    }
}
window.BattleRoyaleGame = BattleRoyaleGame;

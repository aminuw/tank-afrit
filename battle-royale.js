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
        // Charger la map
        this.map = window.getMapHook ? window.getMapHook() : [];

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
                // Mise à jour de la map si reçue tardivement
                if (state.map) this.map = state.map;

                // Mise à jour de la Zone
                if (state.zone) this.zone = state.zone;

                // Status UPDATE
                if (state.status) this.status = state.status;
                if (state.countdown) this.countdown = state.countdown;
                if (state.winnerId) this.winner = state.winnerId;

                // Mise à jour des joueurs (positions, vie...)
                if (state.players) {
                    // CLIENT PREDICTION : On ne met à jour QUE les autres joueurs.
                    // On garde notre position locale courante pour éviter le "rollback/lag".
                    // Sauf pour les infos critiques non-locales comme les HP ou si on n'existe pas encore.

                    Object.keys(state.players).forEach(id => {
                        if (id === this.myId) {
                            // C'est moi : Je mets à jour mes HP et mon Skin, mais PAS X/Y/Angle
                            // car je suis l'autorité sur mon mouvement (c'est fluide chez moi).
                            if (this.players[this.myId]) {
                                this.players[this.myId].hp = state.players[id].hp;
                                this.players[this.myId].skin = state.players[id].skin;
                            } else {
                                // Première fois que je me vois : j'accepte tout
                                this.players[this.myId] = state.players[id];
                            }
                        } else {
                            // C'est un autre : J'écrase tout (c'est le serveur qui dit où il est)
                            this.players[id] = state.players[id];
                        }
                    });

                    // Nettoyage des déconnectés
                    Object.keys(this.players).forEach(id => {
                        if (!state.players[id]) delete this.players[id];
                    });
                }

                // Mise à jour des balles (nouvelles balles reçues)
                if (state.bullets) {
                    Object.values(state.bullets).forEach(b => {
                        // Anti-Doublon : Si on a déjà cette balle (créée localement), on l'ignore.
                        if (!this.bullets.some(existing => existing.id === b.id)) {
                            this.bullets.push(b);
                        }
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

        // Si je suis dans la liste des joueurs
        if (this.players[this.myId]) {
            const me = this.players[this.myId];

            // Tentative de mouvement
            const nextX = (me.x || 100) + dx;
            const nextY = (me.y || 100) + dy;

            // Collision Map (Rochers)
            let canMoveX = true, canMoveY = true;
            if (this.map) {
                this.map.forEach(obj => {
                    if (obj.type === 'rock') {
                        // Simple dist check for circle vs circle (player r=20)
                        const dist = Math.sqrt(Math.pow(nextX - obj.x, 2) + Math.pow(me.y - obj.y, 2));
                        if (dist < 20 + obj.size / 2) canMoveX = false;

                        const distY = Math.sqrt(Math.pow(me.x - obj.x, 2) + Math.pow(nextY - obj.y, 2));
                        if (distY < 20 + obj.size / 2) canMoveY = false;
                    }
                });
            }

            if (canMoveX) me.x = nextX;
            if (canMoveY) me.y = nextY;

            // Calcul angle visée (vers souris)
            const dxM = this.mouseX - me.x;
            const dyM = this.mouseY - me.y;
            me.angle = Math.atan2(dyM, dxM);

            // --- 2. Envoi Réseau (Optimisation) ---
            if ((dx !== 0 || dy !== 0 || true) && window.updatePlayerPosition) {
                window.updatePlayerPosition(this.gameCode, this.myId, {
                    x: me.x,
                    y: me.y,
                    angle: me.angle
                });
            }
        }

        // --- 3. Update Balles & Collisions ---
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += Math.cos(b.angle) * 800 * dt;
            b.y += Math.sin(b.angle) * 800 * dt;

            let bulletRemoved = false;

            // Collision avec la Map
            if (this.map) {
                for (let obj of this.map) {
                    if (obj.type === 'rock') {
                        const dist = Math.sqrt(Math.pow(b.x - obj.x, 2) + Math.pow(b.y - obj.y, 2));
                        if (dist < obj.size / 2) {
                            this.bullets.splice(i, 1);
                            bulletRemoved = true;
                            break;
                        }
                    }
                }
            }
            if (bulletRemoved) continue;

            // Collision avec Joueurs (Seulement si c'est MA balle -> Shooter Authoritative)
            if (b.ownerId === this.myId) {
                Object.values(this.players).forEach(p => {
                    if (p.id !== this.myId && p.hp > 0) { // Pas moi même et pas mort
                        const dist = Math.sqrt(Math.pow(b.x - p.x, 2) + Math.pow(b.y - p.y, 2));
                        if (dist < 25) { // Hitbox joueur
                            // HIT CONFIRMÉ !
                            console.log("HIT sur", p.name);
                            // 1. Envoi Damage au serveur
                            if (window.packetHit) window.packetHit(p.id, 10);
                            // 2. Supprimer la balle localement
                            this.bullets.splice(i, 1);
                            bulletRemoved = true;
                        }
                    }
                });
            }
            if (bulletRemoved) continue;

            // Supprimer si hors écran
            if (b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw() {
        // Fond
        this.ctx.fillStyle = '#0a0a10';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawGrid();
        this.drawMap();
        this.drawZone();

        // Afficher tous les joueurs
        Object.values(this.players).forEach(p => {
            if (p.hp > 0) this.drawPlayer(p);
        });

        // Afficher les balles
        this.ctx.fillStyle = '#ffeb3b';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffeb3b';
        this.bullets.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;

        // UI : COUNTDOWN
        if (this.status === 'countdown' && this.countdown) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 80px "Orbitron", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("LA PARTIE COMMENCE DANS", this.width / 2, this.height / 2 - 50);
            this.ctx.fillStyle = '#ffeb3b';
            this.ctx.font = 'bold 120px "Orbitron", sans-serif';
            this.ctx.fillText(this.countdown, this.width / 2, this.height / 2 + 80);
        }

        // UI : VICTORY / GAME OVER
        if (this.status === 'finished') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.textAlign = 'center';
            if (this.winner === this.myId) {
                this.ctx.fillStyle = '#FFD700'; // Gold
                this.ctx.font = 'bold 80px "Orbitron", sans-serif';
                this.ctx.fillText("🏆 VICTOIRE ROYALE !", this.width / 2, this.height / 2 - 50);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.fillText("Tu es le dernier survivant", this.width / 2, this.height / 2 + 20);
            } else {
                this.ctx.fillStyle = '#f44336'; // Red
                this.ctx.font = 'bold 80px "Orbitron", sans-serif';
                this.ctx.fillText("💀 GAME OVER", this.width / 2, this.height / 2 - 50);
                this.ctx.fillStyle = '#aaa';
                this.ctx.font = '30px Arial';
                this.ctx.fillText("Meilleure chance la prochaine fois...", this.width / 2, this.height / 2 + 20);
            }

            // BOUTON QUITTER
            const btnX = this.width / 2 - 100;
            const btnY = this.height / 2 + 100;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(btnX, btnY, 200, 60);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText("QUITTER", this.width / 2, btnY + 40);
        }
    }

    drawMap() {
        if (!this.map) return;
        this.map.forEach(obj => {
            if (obj.type === 'rock') {
                this.ctx.fillStyle = '#555';
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, obj.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obj.type === 'bush') {
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Semi-transparent
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, obj.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawZone() {
        if (!this.zone) return;

        // Dessiner le STORM (Zone Rouge extérieure)
        this.ctx.save();
        this.ctx.beginPath();
        // Grand rectangle extérieur
        this.ctx.rect(0, 0, this.width, this.height);
        // Trou circulaire (Zone safe)
        this.ctx.arc(this.zone.x, this.zone.y, this.zone.radius, 0, Math.PI * 2, true);
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Rouge danger
        this.ctx.fill();

        // Bordure zone
        this.ctx.strokeStyle = '#f00';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.arc(this.zone.x, this.zone.y, this.zone.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawPlayer(p) {
        const ctx = this.ctx;
        if (!p.x) p.x = 200;
        if (!p.y) p.y = 200;

        // --- BUSH STEALTH LOGIC ---
        let opacity = 1.0;
        if (this.map) {
            for (let obj of this.map) {
                if (obj.type === 'bush') {
                    // Check collision point (center)
                    const dist = Math.sqrt((p.x - obj.x) ** 2 + (p.y - obj.y) ** 2);
                    if (dist < obj.size / 2) {
                        // Inside bush
                        if (p.id === this.myId) opacity = 0.6; // Me -> Semi-transparent
                        else opacity = 0; // Enemy -> Invisible
                        break;
                    }
                }
            }
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);

        // Corps
        ctx.fillStyle = p.skin ? p.skin.color : '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeRect(-20, -20, 40, 40);

        // Tourelle
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -6, 35, 12);

        ctx.restore();

        // Nom
        if (opacity > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(p.name, p.x, p.y - 35);
        }

        ctx.globalAlpha = 1.0; // Reset

        // Sante
        if (opacity > 0) {
            const hp = (p.hp !== undefined) ? p.hp : 100;
            ctx.fillStyle = '#f00';
            ctx.fillRect(p.x - 20, p.y - 30, 40, 5);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(p.x - 20, p.y - 30, 40 * (hp / 100), 5);
        }
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
        const now = Date.now();
        const bulletId = this.myId + '_' + now;

        // 1. INSTANT SHOT (Client Prediction)
        // On affiche la balle tout de suite, sans attendre le serveur (0 latence visuelle)
        this.bullets.push({
            id: bulletId,
            x: p.x,
            y: p.y,
            angle: p.angle,
            ownerId: this.myId
        });

        // 2. Envoi Réseau
        if (window.sendBullet) {
            window.sendBullet(bulletId, p.x, p.y, p.angle, 10);
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

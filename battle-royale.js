/**
 * BATTLE ROYALE V3 - AVEC HUD FORTNITE
 * Moteur simplifié et robuste pour Socket.io
 * + Fix bouton Quitter + Spawn visible + HUD + Minimap
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
        this.kills = 0; // Track des kills
        this.lastNetworkUpdate = 0; // Throttle réseau

        // Charger les joueurs déjà présents dans le lobby
        if (window.playersListHook) {
            this.players = window.playersListHook();
        }
        // Charger la map
        this.map = window.getMapHook ? window.getMapHook() : [];

        // Fix spawn dans zone visible
        this.fixMySpawnPosition();

        // Inputs
        this.keys = {};
        this.mouseX = 0; this.mouseY = 0;

        // Setup
        this.setupInputs();
        this.listenToNetwork();

        console.log("🎮 MOTEUR BR V3 DÉMARRÉ ! ID:", this.myId);

        // Boucle de jeu
        this.lastTime = 0;
        this.loop = this.loop.bind(this);
        // Démarrage immédiat
        requestAnimationFrame(this.loop);
    }

    // Fix: Repositionne mon tank dans la zone visible
    fixMySpawnPosition() {
        if (this.players[this.myId]) {
            const margin = 80;
            this.players[this.myId].x = margin + Math.random() * (this.width - margin * 2);
            this.players[this.myId].y = margin + Math.random() * (this.height - margin * 2);

            // Envoyer la nouvelle position au serveur
            if (window.updatePlayerPosition) {
                window.updatePlayerPosition(this.gameCode, this.myId, {
                    x: this.players[this.myId].x,
                    y: this.players[this.myId].y,
                    angle: 0
                });
            }
        }
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
        this.canvas.addEventListener('mousedown', (e) => {
            // Vérifier si on clique sur le bouton Quitter
            if (this.status === 'finished') {
                const btnX = this.width / 2 - 100;
                const btnY = this.height / 2 + 100;
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                if (clickX >= btnX && clickX <= btnX + 200 &&
                    clickY >= btnY && clickY <= btnY + 60) {
                    // Clic sur QUITTER !
                    location.reload();
                    return;
                }
            }
            this.shoot();
        });
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
                                // Première fois que je me vois : j'accepte tout mais fix spawn
                                this.players[this.myId] = state.players[id];
                                this.fixMySpawnPosition();
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

                // Track kills
                if (state.killerId === this.myId) {
                    this.kills++;
                }
            });
        }

        // Écouter les kills
        if (window.listenToKills) {
            window.listenToKills((killerId, victimId) => {
                if (killerId === this.myId) {
                    this.kills++;
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

            // Limiter aux bords de l'écran
            me.x = Math.max(25, Math.min(this.width - 25, me.x));
            me.y = Math.max(25, Math.min(this.height - 25, me.y));

            // Calcul angle visée (vers souris)
            const dxM = this.mouseX - me.x;
            const dyM = this.mouseY - me.y;
            me.angle = Math.atan2(dyM, dxM);

            // --- 2. Envoi Réseau (Throttled à 50ms) ---
            const now = Date.now();
            if (now - this.lastNetworkUpdate > 50 && window.updatePlayerPosition) {
                this.lastNetworkUpdate = now;
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

        // HUD Style Fortnite
        this.drawHUD();

        // Minimap
        this.drawMinimap();

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

            // BOUTON QUITTER (Cliquable maintenant !)
            const btnX = this.width / 2 - 100;
            const btnY = this.height / 2 + 100;

            // Effet hover visuel
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 20;
            this.ctx.fillRect(btnX, btnY, 200, 60);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText("QUITTER", this.width / 2, btnY + 40);
        }
    }

    // ============================================
    // HUD STYLE FORTNITE - En haut à gauche
    // ============================================
    drawHUD() {
        const ctx = this.ctx;
        const me = this.players[this.myId];
        if (!me) return;

        const hudX = 20;
        const hudY = 20;
        const hudWidth = 280;
        const hudHeight = 130;

        // Fond simple (optimisé)
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

        // Bordure simple
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(hudX, hudY, hudWidth, hudHeight);

        // === Contenu ===
        ctx.textAlign = 'left';

        // Nom du joueur
        ctx.font = 'bold 22px "Orbitron", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`👤 ${me.name || this.playerName}`, hudX + 15, hudY + 35);

        // Barre de PV
        const hp = me.hp !== undefined ? me.hp : 100;
        const hpBarX = hudX + 15;
        const hpBarY = hudY + 50;
        const hpBarWidth = hudWidth - 30;
        const hpBarHeight = 20;

        // Fond barre
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.roundRect(ctx, hpBarX, hpBarY, hpBarWidth, hpBarHeight, 5);
        ctx.fill();

        // PV actuel (couleur simple)
        const hpPercent = hp / 100;
        let hpColor;
        if (hpPercent > 0.6) hpColor = '#4CAF50';
        else if (hpPercent > 0.3) hpColor = '#FFC107';
        else hpColor = '#f44336';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

        // Icône coeur + texte HP
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`❤️ ${Math.ceil(hp)}/100`, hpBarX + 5, hpBarY + 15);

        // Kills
        ctx.font = 'bold 18px "Rajdhani", sans-serif';
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`☠️ Kills: ${this.kills}`, hudX + 15, hudY + 95);

        // Joueurs en vie
        const aliveCount = Object.values(this.players).filter(p => p.hp > 0).length;
        ctx.fillStyle = '#4da6ff';
        ctx.fillText(`👥 En vie: ${aliveCount}`, hudX + 140, hudY + 95);

        // Zone indicator
        if (this.zone) {
            const distToCenter = me.x && me.y ?
                Math.sqrt(Math.pow(me.x - this.zone.x, 2) + Math.pow(me.y - this.zone.y, 2)) : 0;
            const inZone = distToCenter < this.zone.radius;
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = inZone ? '#4CAF50' : '#f44336';
            ctx.fillText(inZone ? '✓ Zone Safe' : '⚠️ DANGER!', hudX + 15, hudY + 118);
        }

        ctx.restore();
    }

    // ============================================
    // MINIMAP - En bas à gauche
    // ============================================
    drawMinimap() {
        const ctx = this.ctx;
        const mapSize = 150;
        const mapX = 20;
        const mapY = this.height - mapSize - 20;
        const scale = mapSize / Math.max(this.width, this.height);

        ctx.save();

        // Fond
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, mapX, mapY, mapSize, mapSize, 10);
        ctx.fill();
        ctx.stroke();

        // Zone safe (cercle)
        if (this.zone) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                mapX + this.zone.x * scale,
                mapY + this.zone.y * scale,
                this.zone.radius * scale,
                0, Math.PI * 2
            );
            ctx.stroke();

            // Remplir zone danger (extérieur)
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.fillRect(mapX, mapY, mapSize, mapSize);
        }

        // Obstacles (rochers)
        if (this.map) {
            this.map.forEach(obj => {
                if (obj.type === 'rock') {
                    ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
                    ctx.beginPath();
                    ctx.arc(mapX + obj.x * scale, mapY + obj.y * scale, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj.type === 'bush') {
                    ctx.fillStyle = 'rgba(0, 200, 0, 0.5)';
                    ctx.beginPath();
                    ctx.arc(mapX + obj.x * scale, mapY + obj.y * scale, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // Autres joueurs (points rouges)
        Object.values(this.players).forEach(p => {
            if (p.id !== this.myId && p.hp > 0) {
                ctx.fillStyle = '#f44336';
                ctx.beginPath();
                ctx.arc(mapX + (p.x || 0) * scale, mapY + (p.y || 0) * scale, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Moi (point vert plus grand)
        const me = this.players[this.myId];
        if (me) {
            // Glow effect
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(mapX + (me.x || 0) * scale, mapY + (me.y || 0) * scale, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Direction indicator
            if (me.angle !== undefined) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(mapX + me.x * scale, mapY + me.y * scale);
                ctx.lineTo(
                    mapX + me.x * scale + Math.cos(me.angle) * 10,
                    mapY + me.y * scale + Math.sin(me.angle) * 10
                );
                ctx.stroke();
            }
        }

        // Label
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('MINIMAP', mapX + mapSize / 2, mapY + mapSize - 5);

        ctx.restore();
    }

    // Utility: Rounded Rectangle
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
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

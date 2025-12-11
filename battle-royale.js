/**
 * BATTLE ROYALE MODE - ANTI-ROLLBACK EDITION
 * Systeme de prediction et interpolation avance
 */

const BR_CONFIG = {
    MAP_WIDTH: 2400,
    MAP_HEIGHT: 1600,
    CAMERA_WIDTH: 1200,
    CAMERA_HEIGHT: 800,

    INITIAL_ZONE_RADIUS: 1200,
    ZONE_PHASES: [
        { duration: 30, targetRadius: 960 },
        { duration: 30, targetRadius: 720 },
        { duration: 30, targetRadius: 480 },
        { duration: 30, targetRadius: 240 }
    ],
    ZONE_DAMAGE: 5,

    BUSH_COUNT: 18,
    ROCK_COUNT: 12,
    TREE_COUNT: 10,

    REVEAL_DURATION: 2000,
    SYNC_INTERVAL: 150,
    ZONE_SYNC_INTERVAL: 2000,

    // Anti-rollback settings
    INTERPOLATION_SPEED: 8,      // Vitesse de rattrapage
    EXTRAPOLATION_TIME: 0.3,     // Secondes de prediction max
    POSITION_BUFFER_SIZE: 3,     // Nombre de positions a moyenner
    MAX_TELEPORT_DISTANCE: 200,  // Distance max avant teleport force

    MAX_PLAYERS: 10,
    MIN_PLAYERS_TO_START: 2,
    COUNTDOWN_DURATION: 5
};

// Notification d'elimination visible par tous
class KillNotification {
    constructor(killerName, victimName) {
        this.killerName = killerName;
        this.victimName = victimName;
        this.life = 3; // 3 secondes
        this.y = 100;
        this.alpha = 0;
        this.scale = 0.5;
    }

    update(dt) {
        this.life -= dt;
        // Animation d'entree
        if (this.life > 2.5) {
            this.alpha = Math.min(1, this.alpha + dt * 4);
            this.scale = Math.min(1, this.scale + dt * 4);
        }
        // Animation de sortie
        else if (this.life < 0.5) {
            this.alpha = this.life * 2;
        }
    }

    draw(ctx, canvasWidth) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(canvasWidth / 2, this.y);
        ctx.scale(this.scale, this.scale);

        // Fond
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-200, -20, 400, 40);
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(-200, -20, 400, 40);

        // Texte
        ctx.font = 'bold 18px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF6666';
        ctx.fillText(this.killerName, -60, 6);
        ctx.fillStyle = '#FFF';
        ctx.fillText(' a elimine ', 0, 6);
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText(this.victimName, 80, 6);

        // Icone skull
        ctx.font = '24px Arial';
        ctx.fillText('💀', -130, 8);

        ctx.restore();
    }

    get isAlive() { return this.life > 0; }
}

// Confetti pour victoire
class Confetti {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 400;
        this.vy = -200 - Math.random() * 300;
        this.rotation = Math.random() * 360;
        this.rotSpeed = (Math.random() - 0.5) * 720;
        this.size = 5 + Math.random() * 10;
        this.color = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF69B4'][Math.floor(Math.random() * 6)];
        this.life = 3 + Math.random() * 2;
    }

    update(dt) {
        this.vy += 300 * dt; // Gravite
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.min(1, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        ctx.restore();
    }

    get isAlive() { return this.life > 0; }
}

// Animation de victoire
class VictoryAnimation {
    constructor(canvasWidth, canvasHeight, winnerName) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.winnerName = winnerName;
        this.time = 0;
        this.confettis = [];
        this.textScale = 0;
        this.textAlpha = 0;
        this.active = true;

        // Generer confettis
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                if (this.active) {
                    this.confettis.push(new Confetti(
                        Math.random() * canvasWidth,
                        canvasHeight + 50
                    ));
                }
            }, i * 30);
        }
    }

    update(dt) {
        this.time += dt;

        // Animation du texte
        if (this.time < 1) {
            this.textScale = Math.min(1.2, this.textScale + dt * 3);
            this.textAlpha = Math.min(1, this.textAlpha + dt * 2);
        } else if (this.time < 1.5) {
            this.textScale = 1.2 - (this.time - 1) * 0.4; // Bounce back
        } else {
            this.textScale = 1;
        }

        // Update confettis
        this.confettis.forEach(c => c.update(dt));
        this.confettis = this.confettis.filter(c => c.isAlive);
    }

    draw(ctx) {
        // Fond sombre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Confettis
        this.confettis.forEach(c => c.draw(ctx));

        // Couronne animee
        ctx.save();
        ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2 - 100);
        ctx.scale(this.textScale, this.textScale);
        ctx.globalAlpha = this.textAlpha;
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, 0);
        ctx.restore();

        // Texte VICTOIRE ROYALE
        ctx.save();
        ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2);
        ctx.scale(this.textScale, this.textScale);
        ctx.globalAlpha = this.textAlpha;

        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 56px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('VICTOIRE ROYALE!', 0, 0);
        ctx.shadowBlur = 0;

        // Nom du gagnant
        ctx.font = 'bold 32px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.fillText(this.winnerName, 0, 50);

        ctx.restore();

        // Instructions
        ctx.globalAlpha = 0.5 + Math.sin(this.time * 3) * 0.5;
        ctx.font = '20px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Cliquez pour retourner au lobby', this.canvasWidth / 2, this.canvasHeight - 50);
        ctx.globalAlpha = 1;
    }
}

// Classe obstacle
class MapObstacle {
    constructor(x, y, type, size) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = size;
        this.isSolid = type !== 'bush';
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        if (screenX < -this.size || screenX > BR_CONFIG.CAMERA_WIDTH + this.size ||
            screenY < -this.size || screenY > BR_CONFIG.CAMERA_HEIGHT + this.size) {
            return;
        }

        ctx.save();

        if (this.type === 'bush') {
            // Ombre
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX + 3, screenY + 5, this.size / 2.2, this.size / 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Couches de feuillage
            const bushGrad = ctx.createRadialGradient(screenX - 5, screenY - 5, 0, screenX, screenY, this.size / 2);
            bushGrad.addColorStop(0, '#5dd55d');
            bushGrad.addColorStop(0.5, '#228B22');
            bushGrad.addColorStop(1, '#145214');
            ctx.fillStyle = bushGrad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Petits cercles pour texture feuilles
            ctx.fillStyle = 'rgba(100, 200, 100, 0.6)';
            for (let i = 0; i < 5; i++) {
                const ox = (Math.random() - 0.5) * this.size * 0.6;
                const oy = (Math.random() - 0.5) * this.size * 0.6;
                ctx.beginPath();
                ctx.arc(screenX + ox, screenY + oy, 5 + Math.random() * 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = 'rgba(0, 80, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            ctx.stroke();

        } else if (this.type === 'rock') {
            // Ombre
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(screenX + 4, screenY + 6, this.size / 2, this.size / 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Corps avec dégradé 3D
            const rockGrad = ctx.createRadialGradient(screenX - 8, screenY - 8, 0, screenX, screenY, this.size / 2);
            rockGrad.addColorStop(0, '#9a9a9a');
            rockGrad.addColorStop(0.5, '#666');
            rockGrad.addColorStop(1, '#333');
            ctx.fillStyle = rockGrad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Reflet
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.ellipse(screenX - 5, screenY - 5, this.size / 5, this.size / 6, -0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            ctx.stroke();

        } else if (this.type === 'tree') {
            // Ombre au sol
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX + 5, screenY + 15, this.size / 2.5, this.size / 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tronc avec dégradé
            const trunkGrad = ctx.createLinearGradient(screenX - 6, screenY, screenX + 6, screenY);
            trunkGrad.addColorStop(0, '#2d1a06');
            trunkGrad.addColorStop(0.5, '#5c3d1e');
            trunkGrad.addColorStop(1, '#3d2610');
            ctx.fillStyle = trunkGrad;
            ctx.fillRect(screenX - 6, screenY - 5, 12, 25);

            // Feuillage avec plusieurs couches
            const leafGrad = ctx.createRadialGradient(screenX - 5, screenY - 20, 0, screenX, screenY - 10, this.size / 2);
            leafGrad.addColorStop(0, '#4ade4a');
            leafGrad.addColorStop(0.6, '#228B22');
            leafGrad.addColorStop(1, '#0d4d0d');
            ctx.fillStyle = leafGrad;
            ctx.beginPath();
            ctx.arc(screenX, screenY - 15, this.size / 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Petites feuilles
            ctx.fillStyle = 'rgba(80, 200, 80, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX - 10, screenY - 20, 8, 0, Math.PI * 2);
            ctx.arc(screenX + 12, screenY - 18, 7, 0, Math.PI * 2);
            ctx.arc(screenX, screenY - 28, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    checkCollision(tank) {
        if (!this.isSolid) return false;
        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.size / 2 + tank.size / 2);
    }

    isInside(tank) {
        if (this.type !== 'bush') return false;
        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size / 2;
    }
}

// Zone
class ShrinkingZone {
    constructor() {
        this.centerX = BR_CONFIG.MAP_WIDTH / 2;
        this.centerY = BR_CONFIG.MAP_HEIGHT / 2;
        this.currentRadius = BR_CONFIG.INITIAL_ZONE_RADIUS;
        this.targetRadius = BR_CONFIG.INITIAL_ZONE_RADIUS;
        this.phase = 0;
        this.phaseTimer = 0;
        this.shrinking = false;
    }

    update(dt) {
        if (this.phase >= BR_CONFIG.ZONE_PHASES.length) return;

        this.phaseTimer += dt;
        const currentPhase = BR_CONFIG.ZONE_PHASES[this.phase];

        if (this.phaseTimer >= currentPhase.duration) {
            this.phase++;
            this.phaseTimer = 0;
            if (this.phase < BR_CONFIG.ZONE_PHASES.length) {
                this.targetRadius = BR_CONFIG.ZONE_PHASES[this.phase].targetRadius;
                this.shrinking = true;
            }
        } else if (this.shrinking) {
            const shrinkSpeed = (this.currentRadius - this.targetRadius) / Math.max(0.1, currentPhase.duration - this.phaseTimer);
            this.currentRadius -= shrinkSpeed * dt;
            if (this.currentRadius <= this.targetRadius) {
                this.currentRadius = this.targetRadius;
                this.shrinking = false;
            }
        }
    }

    isOutside(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) > this.currentRadius;
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.centerX - cameraX;
        const screenY = this.centerY - cameraY;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.fillRect(0, 0, BR_CONFIG.CAMERA_WIDTH, BR_CONFIG.CAMERA_HEIGHT);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        ctx.strokeStyle = this.shrinking ? '#FF0000' : '#FFA500';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    getNextShrinkTime() {
        if (this.phase >= BR_CONFIG.ZONE_PHASES.length) return 0;
        return Math.max(0, BR_CONFIG.ZONE_PHASES[this.phase].duration - this.phaseTimer);
    }
}

// Joueur distant avec ANTI-ROLLBACK
class RemotePlayer {
    constructor(id, name, skin) {
        this.id = id;
        this.name = name;
        this.color = skin?.color || '#FF0000';
        this.color2 = skin?.color2 || '#AA0000';

        // Position affichee (interpolee)
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.turretAngle = 0;

        // Position cible du serveur
        super(id, 0, 0, {
            name: name,
            color: skin ? skin.color : '#F44336',
            color2: skin ? skin.color2 : '#B71C1C'
        });

        // BUFFER SNAPSHOT : Stocke l'etat du monde a des instants T pour interpolation
        this.snapshots = [];
        this.INTERPOLATION_OFFSET = 100; // ms de retard constant pour fluidite
        this.isAlive = true;
    }

    // Recevoir une mise a jour du serveur
    updateFromServer(data) {
        const now = Date.now();

        this.snapshots.push({
            t: now,
            x: data.x,
            y: data.y,
            angle: data.angle,
            turretAngle: data.turretAngle,
            health: data.health,
            alive: data.alive !== false,
            hidden: data.hidden || false
        });

        // Garder le buffer propre
        while (this.snapshots.length > 20) this.snapshots.shift();

        this.hidden = data.hidden || false;
        if (data.health !== undefined) this.health = data.health;
        if (data.alive !== undefined) this.isAlive = data.alive;
    }

    // Mise a jour position : Interpolation entre deux snapshots
    update(dt) {
        const renderTime = Date.now() - this.INTERPOLATION_OFFSET;

        let prev = null;
        let next = null;

        // Trouver les snapshots entourant le temps de rendu
        for (let i = this.snapshots.length - 1; i >= 0; i--) {
            if (this.snapshots[i].t <= renderTime) {
                prev = this.snapshots[i];
                if (i + 1 < this.snapshots.length) next = this.snapshots[i + 1];
                break;
            }
        }

        if (prev && next) {
            // Interpolation
            const totalTime = next.t - prev.t;
            const ratio = Math.max(0, Math.min(1, (renderTime - prev.t) / totalTime));

            this.x = prev.x + (next.x - prev.x) * ratio;
            this.y = prev.y + (next.y - prev.y) * ratio;

            let angleDiff = next.angle - prev.angle;
            while (angleDiff > 180) angleDiff -= 360;
            while (angleDiff < -180) angleDiff += 360;
            this.angle = prev.angle + angleDiff * ratio;

            let turretDiff = next.turretAngle - prev.turretAngle;
            while (turretDiff > 180) turretDiff -= 360;
            while (turretDiff < -180) turretDiff += 360;
            this.turretAngle = prev.turretAngle + turretDiff * ratio;
        } else if (prev) {
            // Extrapolation (ou maintien) si pas de futur
            this.x = prev.x; this.y = prev.y;
            this.angle = prev.angle; this.turretAngle = prev.turretAngle;
        } else if (this.snapshots.length > 0) {
            // Initialisation
            this.x = this.snapshots[0].x; this.y = this.snapshots[0].y;
            this.angle = this.snapshots[0].angle; this.turretAngle = this.snapshots[0].turretAngle;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.rotate(this.angle * Math.PI / 180);

        const gradient = ctx.createLinearGradient(-this.size / 2, -this.size / 2, this.size / 2, this.size / 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.fillStyle = '#333';
        ctx.fillRect(-this.size / 2 - 2, -this.size / 2, this.size + 4, 8);
        ctx.fillRect(-this.size / 2 - 2, this.size / 2 - 8, this.size + 4, 8);

        ctx.restore();

        ctx.save();
        ctx.rotate(this.turretAngle * Math.PI / 180);
        ctx.fillStyle = '#666';
        ctx.fillRect(this.size / 4, -4, this.turretLength - this.size / 4, 8);
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Barre de vie
        const hpW = this.size + 10;
        const hpH = 5;
        const hpX = -hpW / 2;
        const hpY = -this.size / 2 - 15;
        ctx.fillStyle = '#333';
        ctx.fillRect(hpX, hpY, hpW, hpH);
        const hpPercent = this.health / this.maxHealth;
        ctx.fillStyle = hpPercent > 0.6 ? '#4CAF50' : hpPercent > 0.3 ? '#FFC107' : '#F44336';
        ctx.fillRect(hpX, hpY, hpW * hpPercent, hpH);
    }
}

// Jeu principal
class BattleRoyaleGame {
    constructor(canvas, playerName, playerSkin, gameCode, isHost) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.playerName = playerName;
        this.playerSkin = playerSkin;
        this.gameCode = gameCode;
        this.isHost = isHost;

        this.canvas.width = BR_CONFIG.CAMERA_WIDTH;
        this.canvas.height = BR_CONFIG.CAMERA_HEIGHT;

        this.state = 'waiting';
        this.countdownTimer = BR_CONFIG.COUNTDOWN_DURATION;
        this.gameTime = 0;
        this.winner = null;

        this.localPlayer = null;
        this.localPlayerId = currentPlayerId;
        this.players = new Map();

        this.obstacles = [];
        this.mapLoaded = false;
        this.zone = new ShrinkingZone();
        this.cameraX = 0;
        this.cameraY = 0;

        this.bullets = [];
        this.explosions = [];
        this.bulletCounter = 0;

        // Nouvelles animations
        this.killNotifications = [];
        this.victoryAnim = null;

        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };

        this.lastSyncTime = 0;
        this.lastZoneSyncTime = 0;
        this.revealedUntil = 0;
        this.myRank = 0;
        this.pendingSync = false;

        this.init();
    }

    init() {
        this.setupEvents();
        this.setupFirebaseListeners();

        if (this.isHost) {
            this.generateMap();
            this.syncMapToFirebase();
        }

        this.lastTime = performance.now();
        this.loop();
    }

    generateMap() {
        this.obstacles = [];

        for (let i = 0; i < BR_CONFIG.BUSH_COUNT; i++) {
            this.obstacles.push(new MapObstacle(
                200 + Math.random() * (BR_CONFIG.MAP_WIDTH - 400),
                200 + Math.random() * (BR_CONFIG.MAP_HEIGHT - 400),
                'bush', 60
            ));
        }

        for (let i = 0; i < BR_CONFIG.ROCK_COUNT; i++) {
            this.obstacles.push(new MapObstacle(
                200 + Math.random() * (BR_CONFIG.MAP_WIDTH - 400),
                200 + Math.random() * (BR_CONFIG.MAP_HEIGHT - 400),
                'rock', 50
            ));
        }

        for (let i = 0; i < BR_CONFIG.TREE_COUNT; i++) {
            this.obstacles.push(new MapObstacle(
                200 + Math.random() * (BR_CONFIG.MAP_WIDTH - 400),
                200 + Math.random() * (BR_CONFIG.MAP_HEIGHT - 400),
                'tree', 70
            ));
        }

        this.mapLoaded = true;
    }

    async syncMapToFirebase() {
        try {
            await currentGameRef.child('map').set({
                obstacles: this.obstacles.map(o => ({
                    x: Math.round(o.x),
                    y: Math.round(o.y),
                    type: o.type,
                    size: o.size
                })),
                generated: true
            });
        } catch (error) {
            console.error('Error syncing map:', error);
        }
    }

    setupFirebaseListeners() {
        listenToGame((gameData) => {
            if (!gameData) {
                this.state = 'finished';
                return;
            }

            if (gameData.status && gameData.status !== this.state) {
                this.state = gameData.status;
                if (this.state === 'countdown') {
                    this.countdownTimer = BR_CONFIG.COUNTDOWN_DURATION;
                }
            }

            if (gameData.players) {
                const serverPlayerIds = Object.keys(gameData.players);

                serverPlayerIds.forEach(playerId => {
                    const playerData = gameData.players[playerId];

                    // Detection de mort pour notification
                    let oldAliveState = true;
                    if (playerId === this.localPlayerId) {
                        if (this.localPlayer) oldAliveState = this.localPlayer.isAlive;
                    } else if (this.players.has(playerId)) {
                        oldAliveState = this.players.get(playerId).isAlive;
                    }

                    const newAliveState = playerData.alive !== false;

                    // Si le joueur vient de mourir
                    if (oldAliveState && !newAliveState) {
                        const victimName = playerData.name;
                        let killerName = "Zone"; // Par defaut

                        if (playerData.killedBy) {
                            if (playerData.killedBy === this.localPlayerId) {
                                killerName = this.localPlayer ? this.localPlayer.name : "Vous";
                            } else if (gameData.players[playerData.killedBy]) {
                                killerName = gameData.players[playerData.killedBy].name;
                            }
                        }

                        // Ajouter notification
                        if (this.killNotifications) {
                            this.killNotifications.push(new KillNotification(killerName, victimName));
                        }

                        // Effet sonore ou visuel supplementaire ici si besoin
                        const pX = playerData.x || 0;
                        const pY = playerData.y || 0;
                        if (this.explosions) {
                            this.explosions.push(new Explosion(pX, pY, 50, true)); // Explosion de mort (plus grosse, rouge)
                        }
                    }

                    if (playerId === this.localPlayerId) {
                        if (!this.localPlayer) {
                            this.createLocalPlayer(playerData);
                        }
                    } else {
                        this.updateRemotePlayer(playerId, playerData);
                    }
                });

                this.players.forEach((player, playerId) => {
                    if (!serverPlayerIds.includes(playerId)) {
                        this.players.delete(playerId);
                    }
                });

                if (this.state === 'playing') {
                    this.checkGameEnd();
                }
            }

            if (!this.isHost && gameData.map && gameData.map.generated && !this.mapLoaded) {
                this.obstacles = gameData.map.obstacles.map(o =>
                    new MapObstacle(o.x, o.y, o.type, o.size)
                );
                this.mapLoaded = true;
            }

            if (gameData.bullets) {
                Object.keys(gameData.bullets).forEach(bulletId => {
                    const bData = gameData.bullets[bulletId];
                    // Si c'est pas ma balle et qu'on la connait pas encore
                    if (bData.ownerId !== this.localPlayerId && !this.bullets.find(b => b.id === bulletId)) {
                        const bullet = new Bullet(bData.x, bData.y, bData.angle, bData.ownerId, bData.damage);
                        bullet.id = bulletId;
                        this.bullets.push(bullet);
                    }
                });
            }

            if (!this.isHost && gameData.zone) {
                this.zone.centerX = gameData.zone.centerX || BR_CONFIG.MAP_WIDTH / 2;
                this.zone.centerY = gameData.zone.centerY || BR_CONFIG.MAP_HEIGHT / 2;
                this.zone.currentRadius = gameData.zone.radius || BR_CONFIG.INITIAL_ZONE_RADIUS;
                this.zone.phase = gameData.zone.phase || 0;
                this.zone.phaseTimer = gameData.zone.phaseTimer || 0;
            }

            if (gameData.winner) {
                this.winner = gameData.winner;
            }
        });
    }

    checkGameEnd() {
        let aliveCount = 0;
        let lastAliveName = '';
        let lastAliveId = '';

        if (this.localPlayer && this.localPlayer.isAlive) {
            aliveCount++;
            lastAliveName = this.localPlayer.name;
            lastAliveId = this.localPlayerId;
        }

        this.players.forEach((player, playerId) => {
            if (player.isAlive) {
                aliveCount++;
                lastAliveName = player.name;
                lastAliveId = playerId;
            }
        });

        if (aliveCount <= 1 && this.state === 'playing') {
            this.state = 'finished';
            this.winner = lastAliveName || 'Personne';
            if (lastAliveId === this.localPlayerId) this.myRank = 1;

            if (this.isHost) {
                currentGameRef.update({
                    status: 'finished',
                    winner: lastAliveName
                });
            }
        }
    }

    createLocalPlayer(playerData) {
        const spawnPos = this.getRandomSpawnPosition();

        this.localPlayer = new Tank(this.localPlayerId, spawnPos.x, spawnPos.y, {
            name: playerData.name,
            color: this.playerSkin.color,
            color2: this.playerSkin.color2,
            maxHealth: 100
        });

        this.localPlayer.health = 100;
        this.localPlayer.isAlive = true;
    }

    updateRemotePlayer(playerId, playerData) {
        if (!this.players.has(playerId)) {
            const player = new RemotePlayer(playerId, playerData.name, playerData.skin);
            player.updateFromServer(playerData);
            this.players.set(playerId, player);
        } else {
            this.players.get(playerId).updateFromServer(playerData);
        }
    }

    getRandomSpawnPosition() {
        let x, y, attempts = 0;

        do {
            const angle = Math.random() * Math.PI * 2;
            const distance = 600 + Math.random() * 400;
            x = BR_CONFIG.MAP_WIDTH / 2 + Math.cos(angle) * distance;
            y = BR_CONFIG.MAP_HEIGHT / 2 + Math.sin(angle) * distance;
            attempts++;
        } while (this.isPositionBlocked(x, y) && attempts < 50);

        x = Math.max(100, Math.min(BR_CONFIG.MAP_WIDTH - 100, x));
        y = Math.max(100, Math.min(BR_CONFIG.MAP_HEIGHT - 100, y));

        return { x, y };
    }

    isPositionBlocked(x, y) {
        for (const obstacle of this.obstacles) {
            if (obstacle.isSolid) {
                const dx = x - obstacle.x;
                const dy = y - obstacle.y;
                if (Math.sqrt(dx * dx + dy * dy) < obstacle.size) {
                    return true;
                }
            }
        }
        return false;
    }

    async syncZoneToFirebase() {
        if (!currentGameRef || !this.isHost) return;

        try {
            await currentGameRef.child('zone').set({
                centerX: this.zone.centerX,
                centerY: this.zone.centerY,
                radius: Math.round(this.zone.currentRadius),
                phase: this.zone.phase,
                phaseTimer: Math.round(this.zone.phaseTimer * 10) / 10
            });
        } catch (error) {
            console.error('Error syncing zone:', error);
        }
    }

    setupEvents() {
        window.addEventListener('keydown', e => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });

        this.canvas.addEventListener('mousedown', () => { this.mouse.down = true; });
        this.canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'finished') {
                this.returnToLobby();
            } else {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

                if (x >= this.canvas.width - 150 && x <= this.canvas.width - 10 &&
                    y >= 10 && y <= 40) {
                    this.returnToLobby();
                }
            }
        });
    }

    returnToLobby() {
        localStorage.removeItem('tankBrawlerSession');
        if (typeof leaveGame === 'function') leaveGame();
        window.location.reload();
    }

    loop(t = performance.now()) {
        const dt = Math.min((t - this.lastTime) / 1000, 0.1);
        this.lastTime = t;

        if (this.state === 'playing') {
            this.update(dt, t);
        } else if (this.state === 'countdown') {
            this.updateCountdown(dt);
        }

        // Mettre a jour tous les joueurs distants (prediction + interpolation)
        this.players.forEach(player => player.update(dt));

        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    updateCountdown(dt) {
        this.countdownTimer -= dt;
        if (this.countdownTimer <= 0 && this.isHost) {
            this.state = 'playing';
            currentGameRef.child('status').set('playing');
        }
    }

    update(dt, t) {
        if (!this.localPlayer || !this.localPlayer.isAlive) return;

        this.gameTime += dt;

        this.localPlayer.inputs.forward = this.keys['KeyZ'] || this.keys['KeyW'] || this.keys['ArrowUp'];
        this.localPlayer.inputs.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
        this.localPlayer.inputs.strafeLeft = this.keys['KeyQ'] || this.keys['KeyA'];
        this.localPlayer.inputs.strafeRight = this.keys['KeyD'];
        this.localPlayer.inputs.left = this.keys['ArrowLeft'];
        this.localPlayer.inputs.right = this.keys['ArrowRight'];

        const worldMouseX = this.mouse.x + this.cameraX;
        const worldMouseY = this.mouse.y + this.cameraY;
        this.localPlayer.turretAngle = Math.atan2(
            worldMouseY - this.localPlayer.y,
            worldMouseX - this.localPlayer.x
        ) * 180 / Math.PI;

        this.localPlayer.update(dt, BR_CONFIG.MAP_WIDTH, BR_CONFIG.MAP_HEIGHT, t);
        this.checkObstacleCollisions();
        this.checkBushHiding();

        if (this.mouse.down || this.keys['Space']) {
            const bullet = this.localPlayer.fire(t);
            if (bullet) {
                this.bulletCounter++;
                bullet.id = this.localPlayerId + '_' + this.bulletCounter;
                this.bullets.push(bullet);

                // ENVOI RESEAU
                if (typeof sendBullet === 'function') {
                    sendBullet(bullet.id, bullet.x, bullet.y, bullet.angle, bullet.damage);
                }

                if (this.localPlayer.hidden) {
                    this.revealedUntil = t + BR_CONFIG.REVEAL_DURATION;
                }
            }
        }

        this.updateBullets(dt);

        if (this.isHost) {
            this.zone.update(dt);

            if (t - this.lastZoneSyncTime > BR_CONFIG.ZONE_SYNC_INTERVAL) {
                this.syncZoneToFirebase();
                this.lastZoneSyncTime = t;
            }
        }

        if (this.zone.isOutside(this.localPlayer.x, this.localPlayer.y)) {
            this.localPlayer.takeDamage(BR_CONFIG.ZONE_DAMAGE * dt);
            if (!this.localPlayer.isAlive) {
                this.handlePlayerDeath();
            }
        }

        if (t - this.lastSyncTime > BR_CONFIG.SYNC_INTERVAL) {
            this.syncPlayerPosition();
            this.lastSyncTime = t;
        }

        this.updateCamera();

        this.explosions = this.explosions.filter(e => {
            e.update(dt);
            return e.isAlive;
        });

        // Update notifications
        if (this.killNotifications) {
            this.killNotifications = this.killNotifications.filter(n => {
                n.update(dt);
                return n.isAlive;
            });
        }
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(dt, BR_CONFIG.MAP_WIDTH, BR_CONFIG.MAP_HEIGHT);

            if (bullet.ownerId === this.localPlayerId) {
                this.players.forEach((player, playerId) => {
                    if (bullet.isAlive && player.isAlive) {
                        const dx = bullet.x - player.x;
                        const dy = bullet.y - player.y;
                        if (Math.sqrt(dx * dx + dy * dy) < player.size / 2 + bullet.size) {
                            bullet.isAlive = false;
                            if (typeof sendHit === 'function') {
                                sendHit(playerId, bullet.damage);
                            }
                            this.explosions.push(new Explosion(bullet.x, bullet.y, 20, false));
                        }
                    }
                });
            }

            if (!bullet.isAlive) {
                this.bullets.splice(i, 1);
            }
        }
    }

    checkObstacleCollisions() {
        for (const obstacle of this.obstacles) {
            if (obstacle.checkCollision(this.localPlayer)) {
                const dx = this.localPlayer.x - obstacle.x;
                const dy = this.localPlayer.y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    const push = (obstacle.size / 2 + this.localPlayer.size / 2) - distance;
                    this.localPlayer.x += (dx / distance) * push;
                    this.localPlayer.y += (dy / distance) * push;
                }
            }
        }
    }

    checkBushHiding() {
        let inBush = false;
        for (const obstacle of this.obstacles) {
            if (obstacle.isInside(this.localPlayer)) {
                inBush = true;
                break;
            }
        }
        this.localPlayer.hidden = inBush && performance.now() > this.revealedUntil;
    }

    async syncPlayerPosition() {
        if (!this.pendingSync && typeof updatePlayerPosition === 'function') {
            this.pendingSync = true;
            try {
                await updatePlayerPosition(
                    Math.round(this.localPlayer.x),
                    Math.round(this.localPlayer.y),
                    Math.round(this.localPlayer.angle),
                    Math.round(this.localPlayer.turretAngle),
                    Math.round(this.localPlayer.health),
                    this.localPlayer.hidden
                );
            } catch (e) {
                console.error('Sync error:', e);
            }
            this.pendingSync = false;
        }
    }

    async handlePlayerDeath() {
        if (typeof setPlayerDead === 'function') {
            await setPlayerDead();
        }

        let aliveCount = 0;
        this.players.forEach(player => {
            if (player.isAlive) aliveCount++;
        });
        this.myRank = aliveCount + 1;
    }

    updateCamera() {
        if (!this.localPlayer) return;

        this.cameraX = this.localPlayer.x - BR_CONFIG.CAMERA_WIDTH / 2;
        this.cameraY = this.localPlayer.y - BR_CONFIG.CAMERA_HEIGHT / 2;

        this.cameraX = Math.max(0, Math.min(this.cameraX, BR_CONFIG.MAP_WIDTH - BR_CONFIG.CAMERA_WIDTH));
        this.cameraY = Math.max(0, Math.min(this.cameraY, BR_CONFIG.MAP_HEIGHT - BR_CONFIG.CAMERA_HEIGHT));
    }

    render() {
        const ctx = this.ctx;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = 'rgba(100, 255, 100, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        const startX = Math.floor(this.cameraX / gridSize) * gridSize - this.cameraX;
        const startY = Math.floor(this.cameraY / gridSize) * gridSize - this.cameraY;

        for (let x = startX; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = startY; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        if (this.state === 'playing' || this.state === 'countdown') {
            this.zone.draw(ctx, this.cameraX, this.cameraY);
            this.obstacles.forEach(o => o.draw(ctx, this.cameraX, this.cameraY));

            this.bullets.forEach(bullet => {
                const sx = bullet.x - this.cameraX;
                const sy = bullet.y - this.cameraY;
                if (sx >= -10 && sx <= this.canvas.width + 10 && sy >= -10 && sy <= this.canvas.height + 10) {
                    ctx.save();
                    ctx.translate(sx, sy);
                    bullet.draw(ctx);
                    ctx.restore();
                }
            });

            this.players.forEach(player => {
                if (player.isAlive && !player.hidden) {
                    this.drawPlayer(ctx, player);
                }
            });

            if (this.localPlayer && this.localPlayer.isAlive) {
                this.drawPlayer(ctx, this.localPlayer, true);
            }

            this.explosions.forEach(e => {
                ctx.save();
                ctx.translate(e.x - this.cameraX, e.y - this.cameraY);
                e.draw(ctx);
                ctx.restore();
            });

            this.drawHUD(ctx);

            // Notifications de kills
            if (this.killNotifications) {
                this.killNotifications.forEach((n, index) => {
                    n.y = 100 + index * 50; // Pile les notifications
                    n.draw(ctx, this.canvas.width);
                });
            }

            if (this.state === 'countdown') {
                this.drawCountdown(ctx);
            }
        } else if (this.state === 'waiting') {
            this.drawWaiting(ctx);
        } else if (this.state === 'finished') {
            this.drawFinished(ctx);
        }
    }

    drawPlayer(ctx, player, isLocal = false) {
        const screenX = player.x - this.cameraX;
        const screenY = player.y - this.cameraY;

        if (screenX < -100 || screenX > this.canvas.width + 100 ||
            screenY < -100 || screenY > this.canvas.height + 100) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);

        if (isLocal && player.hidden) {
            ctx.globalAlpha = 0.3;
        }

        if (typeof player.drawLocal === 'function') {
            player.drawLocal(ctx);
        } else if (typeof player.draw === 'function') {
            player.draw(ctx);
        }

        ctx.restore();

        ctx.save();
        ctx.font = 'bold 12px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLocal ? '#00FF00' : '#FFFFFF';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(player.name, screenX, screenY - (player.size || 35) - 10);
        ctx.fillText(player.name, screenX, screenY - (player.size || 35) - 10);
        ctx.restore();
    }

    drawHUD(ctx) {
        const p = 20;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 90);

        ctx.font = 'bold 18px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.fillText('HP: ' + Math.floor(this.localPlayer.health) + '/100', p, p + 20);

        const hpPercent = this.localPlayer.health / 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(p, p + 25, 160, 10);
        ctx.fillStyle = hpPercent > 0.6 ? '#4CAF50' : hpPercent > 0.3 ? '#FFC107' : '#F44336';
        ctx.fillRect(p, p + 25, 160 * hpPercent, 10);

        let aliveCount = (this.localPlayer && this.localPlayer.isAlive) ? 1 : 0;
        this.players.forEach(player => { if (player.isAlive) aliveCount++; });
        ctx.fillStyle = '#FFF';
        ctx.fillText('Vivants: ' + aliveCount, p, p + 55);

        ctx.fillText('Zone: Phase ' + (this.zone.phase + 1) + ' (' + Math.ceil(this.zone.getNextShrinkTime()) + 's)', p, p + 75);

        ctx.restore();

        if (this.localPlayer.hidden) {
            ctx.font = 'bold 24px Rajdhani';
            ctx.fillStyle = '#00FF00';
            ctx.textAlign = 'center';
            ctx.fillText('CACHE', this.canvas.width / 2, 50);
            ctx.textAlign = 'left';
        }

        if (this.zone.isOutside(this.localPlayer.x, this.localPlayer.y)) {
            ctx.font = 'bold 32px Orbitron';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            if (Math.floor(this.gameTime * 2) % 2 === 0) {
                ctx.fillText('! HORS ZONE !', this.canvas.width / 2, this.canvas.height - 50);
            }
            ctx.textAlign = 'left';
        }

        // Bouton quitter
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(this.canvas.width - 150, 10, 140, 30);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.canvas.width - 150, 10, 140, 30);
        ctx.font = 'bold 14px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText('QUITTER', this.canvas.width - 80, 30);
        ctx.textAlign = 'left';
    }

    drawWaiting(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 32px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.mapLoaded || this.isHost ? 'En attente de joueurs...' : 'Chargement de la map...',
            this.canvas.width / 2, this.canvas.height / 2);
        ctx.font = '18px Rajdhani';
        ctx.fillText((this.players.size + 1) + '/' + BR_CONFIG.MAX_PLAYERS + ' joueurs',
            this.canvas.width / 2, this.canvas.height / 2 + 40);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(this.canvas.width - 150, 10, 140, 30);
        ctx.font = 'bold 14px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText('QUITTER', this.canvas.width - 80, 30);
    }

    drawCountdown(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 72px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(this.countdownTimer), this.canvas.width / 2, this.canvas.height / 2);
        ctx.font = 'bold 24px Rajdhani';
        ctx.fillText('Preparez-vous!', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    drawFinished(ctx) {
        // Initialsier l'animation de victoire si necessaire
        if (this.myRank === 1 && !this.victoryAnim) {
            this.victoryAnim = new VictoryAnimation(this.canvas.width, this.canvas.height, this.localPlayer ? this.localPlayer.name : "Vous");
        }

        if (this.victoryAnim) {
            this.victoryAnim.update(0.016); // Approx dt
            this.victoryAnim.draw(ctx);
            return;
        }

        // Ecran de fin standard si pas victoire
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.textAlign = 'center';

        if (this.winner) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 48px Orbitron';
            ctx.fillText('WINNER: ' + this.winner, this.canvas.width / 2, this.canvas.height / 2 - 60);

            if (this.myRank > 0) {
                ctx.font = 'bold 36px Rajdhani';
                ctx.fillStyle = this.myRank <= 3 ? '#FFD700' : '#AAA';
                ctx.fillText('Votre classement: #' + this.myRank, this.canvas.width / 2, this.canvas.height / 2);
            }
        } else {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 36px Orbitron';
            ctx.fillText('Partie terminee', this.canvas.width / 2, this.canvas.height / 2 - 50);
        }

        // Bouton retour en surbrillance
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(this.canvas.width / 2 - 120, this.canvas.height / 2 + 60, 240, 50);
        ctx.font = 'bold 24px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.fillText('RETOURNER AU LOBBY', this.canvas.width / 2, this.canvas.height / 2 + 92);
    }
}

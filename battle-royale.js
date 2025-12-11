/**
 * BATTLE ROYALE MODE
 * Mode multijoueur avec zone qui retrecit et buissons caches
 */

// Configuration Battle Royale
const BR_CONFIG = {
    MAP_WIDTH: 2400,
    MAP_HEIGHT: 1600,
    CAMERA_WIDTH: 1200,
    CAMERA_HEIGHT: 800,

    // Zone
    INITIAL_ZONE_RADIUS: 1200,
    ZONE_PHASES: [
        { duration: 30, targetRadius: 960 },   // Phase 1: 80%
        { duration: 30, targetRadius: 720 },   // Phase 2: 60%
        { duration: 30, targetRadius: 480 },   // Phase 3: 40%
        { duration: 30, targetRadius: 240 }    // Phase 4: 20%
    ],
    ZONE_DAMAGE: 5, // HP/seconde hors zone

    // Obstacles
    BUSH_COUNT: 18,
    ROCK_COUNT: 12,
    TREE_COUNT: 10,

    // Gameplay
    REVEAL_DURATION: 2000, // ms - Temps revele apres tir depuis buisson
    SYNC_INTERVAL: 100, // ms - Frequence de synchronisation position
    MAX_PLAYERS: 10,
    MIN_PLAYERS_TO_START: 2,
    COUNTDOWN_DURATION: 5 // secondes
};

// Classe pour les obstacles de la map
class MapObstacle {
    constructor(x, y, type, size) {
        this.x = x;
        this.y = y;
        this.type = type; // 'bush', 'rock', 'tree'
        this.size = size;
        this.isSolid = type !== 'bush'; // Buissons = pas solide, autres = solide
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Ne dessiner que si visible a l'ecran
        if (screenX < -this.size || screenX > BR_CONFIG.CAMERA_WIDTH + this.size ||
            screenY < -this.size || screenY > BR_CONFIG.CAMERA_HEIGHT + this.size) {
            return;
        }

        ctx.save();

        // Dessiner selon le type
        if (this.type === 'bush') {
            // Buisson vert
            ctx.fillStyle = 'rgba(34, 139, 34, 0.7)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 100, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'rock') {
            // Rocher gris
            ctx.fillStyle = '#666';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'tree') {
            // Arbre
            ctx.fillStyle = '#4a2f0a';
            ctx.fillRect(screenX - 5, screenY, 10, 20);
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 10, this.size / 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
        }

        ctx.restore();
    }

    checkCollision(tank) {
        if (!this.isSolid) return false;

        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (this.size / 2 + tank.size / 2);
    }

    isInside(tank) {
        if (this.type !== 'bush') return false;

        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.size / 2;
    }
}

// Classe pour la zone qui retrecit
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
            // Passer a la phase suivante
            this.phase++;
            this.phaseTimer = 0;

            if (this.phase < BR_CONFIG.ZONE_PHASES.length) {
                this.targetRadius = BR_CONFIG.ZONE_PHASES[this.phase].targetRadius;
                this.shrinking = true;
            }
        } else if (this.shrinking) {
            // Retrecir progressivement
            const shrinkSpeed = (this.currentRadius - this.targetRadius) / (currentPhase.duration - this.phaseTimer);
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
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > this.currentRadius;
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.centerX - cameraX;
        const screenY = this.centerY - cameraY;

        ctx.save();

        // Zone de danger (hors zone) - rouge semi-transparent
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, 0, BR_CONFIG.CAMERA_WIDTH, BR_CONFIG.CAMERA_HEIGHT);

        // Zone safe - decouper un cercle
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Bordure de la zone
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
        const currentPhase = BR_CONFIG.ZONE_PHASES[this.phase];
        return currentPhase.duration - this.phaseTimer;
    }
}

// Classe principale Battle Royale
class BattleRoyaleGame {
    constructor(canvas, playerName, playerSkin, gameCode, isHost) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.playerName = playerName;
        this.playerSkin = playerSkin;
        this.gameCode = gameCode;
        this.isHost = isHost;

        // Dimensions
        this.canvas.width = BR_CONFIG.CAMERA_WIDTH;
        this.canvas.height = BR_CONFIG.CAMERA_HEIGHT;

        // Etat du jeu
        this.state = 'waiting'; // waiting, countdown, playing, finished
        this.countdownTimer = 0;
        this.gameTime = 0;

        // Joueur local
        this.localPlayer = null;
        this.localPlayerId = currentPlayerId;

        // Autres joueurs
        this.players = new Map();

        // Map
        this.obstacles = [];
        this.zone = new ShrinkingZone();
        this.cameraX = 0;
        this.cameraY = 0;

        // Gameplay
        this.bullets = [];
        this.explosions = [];
        this.floatingTexts = [];
        this.particles = [];

        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };

        // Synchronisation
        this.lastSyncTime = 0;
        this.syncInterval = BR_CONFIG.SYNC_INTERVAL;

        // Revelation depuis buisson
        this.revealedUntil = 0;

        // Classement
        this.playerRanks = [];
        this.myRank = 0;

        this.init();
    }

    init() {
        this.generateMap();
        this.setupEvents();
        this.setupFirebaseListeners();

        // Si hote, initialiser la map dans Firebase
        if (this.isHost) {
            this.syncMapToFirebase();
        }

        this.lastTime = performance.now();
        this.loop();
    }

    generateMap() {
        this.obstacles = [];

        // Generer buissons
        for (let i = 0; i < BR_CONFIG.BUSH_COUNT; i++) {
            const x = 200 + Math.random() * (BR_CONFIG.MAP_WIDTH - 400);
            const y = 200 + Math.random() * (BR_CONFIG.MAP_HEIGHT - 400);
            this.obstacles.push(new MapObstacle(x, y, 'bush', 60));
        }

        // Generer rochers
        for (let i = 0; i < BR_CONFIG.ROCK_COUNT; i++) {
            const x = 200 + Math.random() * (BR_CONFIG.MAP_WIDTH - 400);
            const y = 200 + Math.random() * (BR_CONFIG.MAP_HEIGHT - 400);
            this.obstacles.push(new MapObstacle(x, y, 'rock', 50));
        }

        // Generer arbres
        for (let i = 0; i < BR_CONFIG.TREE_COUNT; i++) {
            const x = 200 + Math.random() * (BR_CONFIG.MAP_WIDTH - 400);
            const y = 200 + Math.random() * (BR_CONFIG.MAP_HEIGHT - 400);
            this.obstacles.push(new MapObstacle(x, y, 'tree', 70));
        }
    }

    async syncMapToFirebase() {
        // Sauvegarder la map dans Firebase pour que tous aient la meme
        const mapData = {
            obstacles: this.obstacles.map(o => ({
                x: o.x,
                y: o.y,
                type: o.type,
                size: o.size
            }))
        };

        try {
            await currentGameRef.child('map').set(mapData);
        } catch (error) {
            console.error('Error syncing map:', error);
        }
    }

    setupFirebaseListeners() {
        // Ecouter les changements de la partie
        listenToGame((gameData) => {
            if (!gameData) {
                // Partie supprimee
                this.state = 'finished';
                return;
            }

            // Mettre a jour l'etat
            this.state = gameData.status;

            // Mettre a jour les joueurs
            if (gameData.players) {
                Object.keys(gameData.players).forEach(playerId => {
                    const playerData = gameData.players[playerId];

                    if (playerId === this.localPlayerId) {
                        // Joueur local - ne pas ecraser la position
                        if (!this.localPlayer) {
                            this.createLocalPlayer(playerData);
                        }
                    } else {
                        // Autre joueur
                        this.updateRemotePlayer(playerId, playerData);
                    }
                });

                // Retirer les joueurs deconnectes
                this.players.forEach((player, playerId) => {
                    if (!gameData.players[playerId]) {
                        this.players.delete(playerId);
                    }
                });
            }

            // Charger la map si pas encore fait
            if (gameData.map && gameData.map.obstacles && this.obstacles.length === 0) {
                this.obstacles = gameData.map.obstacles.map(o =>
                    new MapObstacle(o.x, o.y, o.type, o.size)
                );
            }

            // Synchroniser la zone (si hote)
            if (this.isHost && gameData.status === 'playing') {
                this.syncZoneToFirebase();
            }

            // Charger la zone
            if (gameData.zone) {
                this.zone.centerX = gameData.zone.centerX;
                this.zone.centerY = gameData.zone.centerY;
                this.zone.currentRadius = gameData.zone.radius;
                this.zone.phase = gameData.zone.phase;
            }
        });
    }

    createLocalPlayer(playerData) {
        // Creer le tank du joueur local
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
            // Creer nouveau joueur
            const player = new Tank(playerId, playerData.x, playerData.y, {
                name: playerData.name,
                color: playerData.skin?.color || '#FF0000',
                color2: playerData.skin?.color2 || '#AA0000',
                maxHealth: 100
            });
            this.players.set(playerId, player);
        } else {
            // Mettre a jour joueur existant
            const player = this.players.get(playerId);
            player.x = playerData.x;
            player.y = playerData.y;
            player.angle = playerData.angle;
            player.turretAngle = playerData.turretAngle;
            player.health = playerData.health;
            player.isAlive = playerData.alive;
            player.hidden = playerData.hidden;
        }
    }

    getRandomSpawnPosition() {
        // Spawn aleatoire loin du centre et des autres joueurs
        let x, y;
        let attempts = 0;

        do {
            const angle = Math.random() * Math.PI * 2;
            const distance = 600 + Math.random() * 400;
            x = BR_CONFIG.MAP_WIDTH / 2 + Math.cos(angle) * distance;
            y = BR_CONFIG.MAP_HEIGHT / 2 + Math.sin(angle) * distance;
            attempts++;
        } while (this.isPositionBlocked(x, y) && attempts < 50);

        return { x, y };
    }

    isPositionBlocked(x, y) {
        // Verifier si la position est bloquee par un obstacle solide
        for (const obstacle of this.obstacles) {
            if (obstacle.isSolid) {
                const dx = x - obstacle.x;
                const dy = y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < obstacle.size) {
                    return true;
                }
            }
        }
        return false;
    }

    async syncZoneToFirebase() {
        if (!currentGameRef) return;

        try {
            await currentGameRef.child('zone').update({
                centerX: this.zone.centerX,
                centerY: this.zone.centerY,
                radius: this.zone.currentRadius,
                phase: this.zone.phase
            });
        } catch (error) {
            console.error('Error syncing zone:', error);
        }
    }

    setupEvents() {
        window.addEventListener('keydown', e => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
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

        this.canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    loop(t = performance.now()) {
        const dt = Math.min((t - this.lastTime) / 1000, 0.1);
        this.lastTime = t;

        if (this.state === 'playing') {
            this.update(dt, t);
        } else if (this.state === 'countdown') {
            this.updateCountdown(dt);
        }

        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    updateCountdown(dt) {
        this.countdownTimer -= dt;
        if (this.countdownTimer <= 0) {
            this.state = 'playing';
            if (this.isHost) {
                currentGameRef.child('status').set('playing');
            }
        }
    }

    update(dt, t) {
        if (!this.localPlayer || !this.localPlayer.isAlive) return;

        this.gameTime += dt;

        // Input du joueur
        this.localPlayer.inputs.forward = this.keys['KeyZ'] || this.keys['KeyW'] || this.keys['ArrowUp'];
        this.localPlayer.inputs.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
        this.localPlayer.inputs.strafeLeft = this.keys['KeyQ'] || this.keys['KeyA'];
        this.localPlayer.inputs.strafeRight = this.keys['KeyD'];
        this.localPlayer.inputs.left = this.keys['ArrowLeft'];
        this.localPlayer.inputs.right = this.keys['ArrowRight'];

        // Viser avec la souris (position monde)
        const worldMouseX = this.mouse.x + this.cameraX;
        const worldMouseY = this.mouse.y + this.cameraY;
        this.localPlayer.turretAngle = Math.atan2(
            worldMouseY - this.localPlayer.y,
            worldMouseX - this.localPlayer.x
        ) * 180 / Math.PI;

        // Mettre a jour le joueur
        this.localPlayer.update(dt, BR_CONFIG.MAP_WIDTH, BR_CONFIG.MAP_HEIGHT, t);

        // Verifier collision avec obstacles
        this.checkObstacleCollisions();

        // Verifier si dans un buisson
        this.checkBushHiding();

        // Tirer
        if (this.mouse.down || this.keys['Space']) {
            const bullet = this.localPlayer.fire(t);
            if (bullet) {
                this.bullets.push(bullet);
                // Reveler si dans un buisson
                if (this.localPlayer.hidden) {
                    this.revealedUntil = t + BR_CONFIG.REVEAL_DURATION;
                }
                // Envoyer le tir a Firebase
                if (typeof sendBullet === 'function') {
                    sendBullet(bullet.id, bullet.x, bullet.y, bullet.angle, bullet.damage);
                }
            }
        }

        // Mettre a jour la zone
        if (this.isHost) {
            this.zone.update(dt);
        }

        // Degats hors zone
        if (this.zone.isOutside(this.localPlayer.x, this.localPlayer.y)) {
            this.localPlayer.takeDamage(BR_CONFIG.ZONE_DAMAGE * dt);
            if (!this.localPlayer.isAlive) {
                this.handlePlayerDeath();
            }
        }

        // Synchroniser position
        if (t - this.lastSyncTime > this.syncInterval) {
            this.syncPlayerPosition();
            this.lastSyncTime = t;
        }

        // Mettre a jour camera
        this.updateCamera();

        // Mettre a jour effets visuels
        this.updateVisualEffects(dt);
    }

    checkObstacleCollisions() {
        for (const obstacle of this.obstacles) {
            if (obstacle.checkCollision(this.localPlayer)) {
                // Repousser le joueur
                const dx = this.localPlayer.x - obstacle.x;
                const dy = this.localPlayer.y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    const pushDistance = (obstacle.size / 2 + this.localPlayer.size / 2) - distance;
                    this.localPlayer.x += (dx / distance) * pushDistance;
                    this.localPlayer.y += (dy / distance) * pushDistance;
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

        // Cache si dans un buisson ET pas revele recemment
        const now = performance.now();
        this.localPlayer.hidden = inBush && now > this.revealedUntil;
    }

    async syncPlayerPosition() {
        if (typeof updatePlayerPosition === 'function') {
            await updatePlayerPosition(
                this.localPlayer.x,
                this.localPlayer.y,
                this.localPlayer.angle,
                this.localPlayer.turretAngle,
                this.localPlayer.health,
                this.localPlayer.hidden
            );
        }
    }

    async handlePlayerDeath() {
        if (typeof setPlayerDead === 'function') {
            await setPlayerDead();
        }

        // Calculer le rang
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive).length + 1;
        this.myRank = alivePlayers;
    }

    updateCamera() {
        // Camera suit le joueur
        this.cameraX = this.localPlayer.x - BR_CONFIG.CAMERA_WIDTH / 2;
        this.cameraY = this.localPlayer.y - BR_CONFIG.CAMERA_HEIGHT / 2;

        // Limiter la camera aux bords de la map
        this.cameraX = Math.max(0, Math.min(this.cameraX, BR_CONFIG.MAP_WIDTH - BR_CONFIG.CAMERA_WIDTH));
        this.cameraY = Math.max(0, Math.min(this.cameraY, BR_CONFIG.MAP_HEIGHT - BR_CONFIG.CAMERA_HEIGHT));
    }

    updateVisualEffects(dt) {
        this.explosions.forEach(e => e.update(dt));
        this.floatingTexts.forEach(f => f.update(dt));
        this.particles.forEach(p => p.update(dt));

        this.explosions = this.explosions.filter(e => e.isAlive);
        this.floatingTexts = this.floatingTexts.filter(f => f.isAlive);
        this.particles = this.particles.filter(p => p.isAlive);
    }

    render() {
        const ctx = this.ctx;

        // Fond
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grille
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

        if (this.state === 'playing') {
            // Dessiner la zone
            this.zone.draw(ctx, this.cameraX, this.cameraY);

            // Dessiner les obstacles
            this.obstacles.forEach(o => o.draw(ctx, this.cameraX, this.cameraY));

            // Dessiner les autres joueurs
            this.players.forEach(player => {
                if (player.isAlive && !player.hidden) {
                    this.drawPlayer(ctx, player);
                }
            });

            // Dessiner le joueur local
            if (this.localPlayer && this.localPlayer.isAlive) {
                this.drawPlayer(ctx, this.localPlayer, true);
            }

            // Dessiner les effets
            this.explosions.forEach(e => this.drawEffect(ctx, e));
            this.floatingTexts.forEach(f => this.drawFloatingText(ctx, f));

            // HUD
            this.drawHUD(ctx);
        } else if (this.state === 'waiting') {
            this.drawWaiting(ctx);
        } else if (this.state === 'countdown') {
            this.drawCountdown(ctx);
        } else if (this.state === 'finished') {
            this.drawFinished(ctx);
        }
    }

    drawPlayer(ctx, player, isLocal = false) {
        const screenX = player.x - this.cameraX;
        const screenY = player.y - this.cameraY;

        // Ne dessiner que si visible
        if (screenX < -100 || screenX > this.canvas.width + 100 ||
            screenY < -100 || screenY > this.canvas.height + 100) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);

        // Indicateur si cache (seulement pour le joueur local)
        if (isLocal && player.hidden) {
            ctx.globalAlpha = 0.3;
        }

        // Dessiner le tank a l'origine (car ctx est deja translate a screenX, screenY)
        if (typeof player.drawLocal === 'function') {
            player.drawLocal(ctx);
        } else {
            // Fallback - dessiner un tank simple
            ctx.save();
            ctx.rotate(player.angle * Math.PI / 180);

            // Corps du tank
            const gradient = ctx.createLinearGradient(-player.size / 2, -player.size / 2, player.size / 2, player.size / 2);
            gradient.addColorStop(0, player.color || '#2196F3');
            gradient.addColorStop(1, player.color2 || '#1565C0');
            ctx.fillStyle = gradient;
            ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);

            // Chenilles
            ctx.fillStyle = '#333';
            ctx.fillRect(-player.size / 2 - 2, -player.size / 2, player.size + 4, 8);
            ctx.fillRect(-player.size / 2 - 2, player.size / 2 - 8, player.size + 4, 8);

            ctx.restore();

            // Tourelle
            ctx.save();
            ctx.rotate(player.turretAngle * Math.PI / 180);
            ctx.fillStyle = '#666';
            ctx.fillRect(player.size / 4, -4, player.turretLength || 45, 8);
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(0, 0, player.size / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();

        // Nom du joueur
        ctx.save();
        ctx.font = 'bold 12px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLocal ? '#00FF00' : '#FFFFFF';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(player.name, screenX, screenY - player.size - 10);
        ctx.fillText(player.name, screenX, screenY - player.size - 10);
        ctx.restore();
    }

    drawEffect(ctx, effect) {
        const screenX = effect.x - this.cameraX;
        const screenY = effect.y - this.cameraY;

        ctx.save();
        ctx.translate(screenX, screenY);
        effect.draw(ctx);
        ctx.restore();
    }

    drawFloatingText(ctx, text) {
        const screenX = text.x - this.cameraX;
        const screenY = text.y - this.cameraY;

        ctx.save();
        ctx.translate(screenX, screenY);
        text.draw(ctx);
        ctx.restore();
    }

    drawHUD(ctx) {
        const p = 20;

        // Vie
        ctx.font = 'bold 18px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.fillText('HP: ' + Math.floor(this.localPlayer.health) + '/100', p, p + 20);

        // Joueurs vivants
        const alivePlayers = Array.from(this.players.values()).filter(player => player.isAlive).length +
            (this.localPlayer.isAlive ? 1 : 0);
        ctx.fillText('Vivants: ' + alivePlayers, p, p + 45);

        // Zone
        const nextShrink = Math.ceil(this.zone.getNextShrinkTime());
        ctx.fillText('Zone: Phase ' + (this.zone.phase + 1) + ' (' + nextShrink + 's)', p, p + 70);

        // Indicateur cache
        if (this.localPlayer.hidden) {
            ctx.font = 'bold 24px Rajdhani';
            ctx.fillStyle = '#00FF00';
            ctx.shadowColor = '#00FF00';
            ctx.shadowBlur = 10;
            ctx.textAlign = 'center';
            ctx.fillText('CACHE', this.canvas.width / 2, 50);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }

        // Hors zone
        if (this.zone.isOutside(this.localPlayer.x, this.localPlayer.y)) {
            ctx.font = 'bold 32px Orbitron';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 20;

            if (Math.floor(this.gameTime * 2) % 2 === 0) {
                ctx.fillText('! HORS ZONE !', this.canvas.width / 2, this.canvas.height - 50);
            }

            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }
    }

    drawWaiting(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 32px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('En attente de joueurs...', this.canvas.width / 2, this.canvas.height / 2);

        ctx.font = '18px Rajdhani';
        const playerCount = this.players.size + 1;
        ctx.fillText(playerCount + '/' + BR_CONFIG.MAX_PLAYERS + ' joueurs', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    drawCountdown(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 72px Orbitron';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.fillText(Math.ceil(this.countdownTimer), this.canvas.width / 2, this.canvas.height / 2);
        ctx.shadowBlur = 0;
    }

    drawFinished(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Orbitron';
        ctx.textAlign = 'center';

        if (this.myRank === 1) {
            ctx.fillText('VICTOIRE ROYALE !', this.canvas.width / 2, this.canvas.height / 2 - 50);
        } else {
            ctx.fillText('Classement: #' + this.myRank, this.canvas.width / 2, this.canvas.height / 2 - 50);
        }

        ctx.font = '24px Rajdhani';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Cliquez pour retourner au lobby', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
}

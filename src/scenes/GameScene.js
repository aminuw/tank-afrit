import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Bullet from '../entities/Bullet.js';
import Enemy from '../entities/Enemy.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Limites du monde immense
        this.physics.world.setBounds(0, 0, 3000, 3000);

        // Background texture or grid
        this.add.grid(1500, 1500, 3000, 3000, 64, 64, 0x150508, 1, 0xff1e1e, 0.1);

        // Initialiser les groupes
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 50,
            runChildUpdate: true
        });

        // Création du Joueur
        this.player = new Player(this, 1500, 1500);
        this.add.existing(this.player);

        // Groupe d'ennemis
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });

        // Spawn quelques ennemis tests
        for(let i=0; i<5; i++) {
            const ex = Phaser.Math.Between(1000, 2000);
            const ey = Phaser.Math.Between(1000, 2000);
            const enemy = new Enemy(this, ex, ey, this.player);
            this.enemies.add(enemy);
        }

        // Collisions
        this.physics.add.collider(this.player, this.enemies);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, null, this);

        // Suivi de caméra
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);

        // Tir
        this.input.on('pointerdown', () => {
            this.shoot();
        });
        
        // Cadence de tir simple
        this.lastFired = 0;
    }

    handleBulletHit(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;
        
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.stop();
        
        enemy.takeDamage(bullet.damage);
        
        // Impact effect
        const impact = this.add.circle(bullet.x, bullet.y, 5, 0xffffff);
        this.tweens.add({
            targets: impact,
            scale: 2,
            alpha: 0,
            duration: 150,
            onComplete: () => impact.destroy()
        });
    }

    shoot() {
        const time = this.time.now;
        if (time > this.lastFired) {
            const bullet = this.bullets.get();
            if (bullet) {
                // Point de départ: bout du canon
                const angle = this.player.turretContainer.rotation;
                const barrelOffset = 30; // cannon length
                const startX = this.player.x + Math.cos(angle) * barrelOffset;
                const startY = this.player.y + Math.sin(angle) * barrelOffset;
                
                bullet.fire(startX, startY, angle);
                this.lastFired = time + 200; // 200ms cooldown
                
                // Petit recul (screen shake léger)
                this.cameras.main.shake(100, 0.005);
            }
        }
    }

    update() {
        if (this.player) {
            this.player.update();
        }
    }
}

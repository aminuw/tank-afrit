import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, x, y, target) {
        super(scene, x, y);
        this.scene = scene;
        this.target = target;
        
        this.speed = 100;
        this.baseColor = 0x555555;
        this.hp = 30;

        // Visuals (similar to player but different color/shape)
        this.bodyRect = scene.add.rectangle(0, 0, 40, 30, this.baseColor).setStrokeStyle(2, 0x00ff00);
        this.turret = scene.add.circle(0, 0, 12, 0x333333);
        const cannon = scene.add.rectangle(15, 0, 20, 6, 0x222222);
        
        this.add([this.bodyRect, this.turret, cannon]);

        scene.physics.add.existing(this);
        this.body.setSize(40, 30);
        this.body.setCollideWorldBounds(true);
        this.body.setDamping(true);
        this.body.setDrag(0.1);

        scene.add.existing(this);
    }

    takeDamage(amount) {
        this.hp -= amount;
        
        // Flash red
        this.bodyRect.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if(this.active) this.bodyRect.setFillStyle(this.baseColor);
        });

        if(this.hp <= 0) {
            this.explode();
        }
    }

    explode() {
        this.setActive(false);
        this.setVisible(false);
        this.body.stop();
        
        // Simple visual explosion
        const explosion = this.scene.add.circle(this.x, this.y, 10, 0xff6600);
        this.scene.tweens.add({
            targets: explosion,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        this.destroy(); // Remove object
    }

    update() {
        if (!this.active || !this.target || !this.target.active) return;

        // Simple pursuit AI
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        
        // Rotate towards player smoothly
        this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, angle, 0.05);

        // Move forward mathematically based on rotation
        const velocityX = Math.cos(this.rotation) * this.speed;
        const velocityY = Math.sin(this.rotation) * this.speed;
        
        this.body.setVelocity(velocityX, velocityY);

        /** Optional: random firing logic 
        if(Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 400) {
           // Fire logic (could use same Bullet class)
        }
        */
    }
}

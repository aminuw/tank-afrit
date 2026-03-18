import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Using a built-in texture or drawing it. Usually we load an image, 
        // but here we just pass 'dummy' and we'll override visual.
        super(scene, x, y, 'dummy');
        
        // Setup visuals for 'dummy' if true image not loaded
        this.setDisplaySize(10, 10);
        this.setTint(0xff6600); // Orange fiery bullet

        scene.physics.add.existing(this);
        scene.add.existing(this);

        this.speed = 800;
        this.damage = 10;
        
        this.body.setSize(10, 10);
    }

    fire(x, y, angle) {
        this.setPosition(x, y);
        this.rotation = angle;
        this.setActive(true);
        this.setVisible(true);

        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;

        this.setVelocity(velocityX, velocityY);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Destroy if out of bounds (assuming world bounds 2000x2000)
        // For now, simple camera view bounds checking
        if (this.y <= -1000 || this.y >= 3000 || this.x <= -1000 || this.x >= 3000) {
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();
        }
    }
}

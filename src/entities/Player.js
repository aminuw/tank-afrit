import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        // Base stats
        this.speed = 250;
        this.baseColor = 0xb30000; // Dark Red Afrit theme
        this.accentColor = 0xff1e1e;

        // Create the visual body of the tank (Placeholder Graphics)
        this.bodyRect = scene.add.rectangle(0, 0, 50, 40, this.baseColor).setStrokeStyle(2, this.accentColor);
        
        // Custom visual details for the body
        const trackL = scene.add.rectangle(0, -22, 54, 8, 0x222222);
        const trackR = scene.add.rectangle(0, 22, 54, 8, 0x222222);
        const core = scene.add.circle(0, 0, 10, 0xff6600); // glowing core

        // Create the Turret (rotates independently)
        this.turretContainer = scene.add.container(0, 0);
        const turretBase = scene.add.circle(0, 0, 15, 0x880000).setStrokeStyle(2, 0xff1e1e);
        const cannon = scene.add.rectangle(20, 0, 30, 8, 0x333333).setStrokeStyle(1, 0xff6600);
        this.turretContainer.add([turretBase, cannon]);

        // Add everything to this main container
        this.add([trackL, trackR, this.bodyRect, core, this.turretContainer]);

        // Enable Physics for the container
        scene.physics.add.existing(this);
        this.body.setSize(54, 52);
        this.body.setCollideWorldBounds(true);
        this.body.setDamping(true);
        this.body.setDrag(0.1); 
        this.body.setMaxVelocity(this.speed);

        // Input Setup
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, // ZQSD/WASD hybrid support
            upZ: Phaser.Input.Keyboard.KeyCodes.Z,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            leftQ: Phaser.Input.Keyboard.KeyCodes.Q,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Mouse input tracking
        this.targetRotation = 0;
        scene.input.on('pointermove', (pointer) => {
            // Need relative position if camera moves
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                pointer.worldX, pointer.worldY
            );
            this.turretContainer.rotation = angle;
        });
    }

    update() {
        // --- Movement Logic ---
        const up = this.keys.up.isDown || this.keys.upZ.isDown;
        const down = this.keys.down.isDown;
        const left = this.keys.left.isDown || this.keys.leftQ.isDown;
        const right = this.keys.right.isDown;

        let moveX = 0;
        let moveY = 0;

        if (left) moveX = -1;
        else if (right) moveX = 1;

        if (up) moveY = -1;
        else if (down) moveY = 1;

        // Normalize diagonal speed
        const vec = new Phaser.Math.Vector2(moveX, moveY).normalize();

        // Acceleration approach
        if (moveX !== 0 || moveY !== 0) {
            this.body.setAcceleration(vec.x * 1200, vec.y * 1200);
            
            // Rotate the tank body towards movement direction
            const bodyAngle = Math.atan2(vec.y, vec.x);
            // Smooth rotation towards target angle (shortest path)
            this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, bodyAngle, 0.1);
        } else {
            this.body.setAcceleration(0, 0); // drag takes over
        }
    }
}

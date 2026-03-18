import Phaser from 'phaser';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.grid(width/2, height/2, width, height, 64, 64, 0x150508, 1, 0xff1e1e, 0.05);

        // Title
        this.add.text(width / 2, height / 2 - 100, 'TANK AFRIT\nREBORN', {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '80px',
            color: '#ff1e1e',
            align: 'center',
            fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff6600', blur: 30, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 + 50, 'ÉDITION PHASER 3', {
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '32px',
            color: '#ff6600',
            letterSpacing: '10px'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.rectangle(width / 2, height / 2 + 200, 300, 60, 0xb30000).setInteractive();
        startBtn.setStrokeStyle(2, 0xff1e1e);
        
        const startText = this.add.text(width / 2, height / 2 + 200, 'ENGAGER LE COMBAT', {
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Hover events
        startBtn.on('pointerover', () => {
            startBtn.setFillStyle(0xff1e1e);
            startText.setColor('#000000');
        });
        
        startBtn.on('pointerout', () => {
            startBtn.setFillStyle(0xb30000);
            startText.setColor('#ffffff');
        });

        // Click event
        startBtn.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });
    }
}

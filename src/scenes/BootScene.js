import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Here we will load assets (images, audio)
        // For now, let's create a loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: 'INITIALISATION DU MOTEUR MAGMATIQUE...',
            style: {
                font: '20px Orbitron, monospace',
                fill: '#ff1e1e'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Simulating asset loading
        this.load.on('complete', () => {
            this.time.delayedCall(1000, () => {
                this.scene.start('MainMenu');
            });
        });
        
        // Dummy load to trigger complete event
        this.load.image('dummy', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    }

    create() {
        // Nothing needed here right now
    }
}

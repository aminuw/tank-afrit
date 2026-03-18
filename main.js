import Phaser from 'phaser';
import BootScene from './src/scenes/BootScene.js';
import MainMenu from './src/scenes/MainMenu.js';
import GameScene from './src/scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#150508',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Turn on to see hitboxes
        }
    },
    scene: [BootScene, MainMenu, GameScene]
};

const game = new Phaser.Game(config);

export default game;

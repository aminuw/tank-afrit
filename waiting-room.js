/**
 * WAITING ROOM - VERSION 'DIRECT LINK'
 * Zéro Firebase. Zéro Serveur.
 */

class WaitingRoom {
    constructor(gameCode, isHost, playerName, playerSkin) {
        this.gameCode = gameCode;
        this.isHost = isHost;
        this.playerName = playerName;
        this.playerSkin = playerSkin;

        // S'enregistrer pour recevoir le signal de départ du client
        window.waitingRoomInstance = this;

        this.setupUI();
        this.startPolling();
    }

    setupUI() {
        // Nettoyage préventif
        if (document.getElementById('waiting-room-overlay')) document.getElementById('waiting-room-overlay').remove();

        const overlay = document.createElement('div');
        overlay.id = 'waiting-room-overlay';
        overlay.className = 'login-overlay';
        overlay.innerHTML = `
            <div class="login-card" style="width:90%; max-width:600px;">
                <h2>🔗 LOBBY DIRECT (P2P)</h2>
                
                <div class="game-code-display" style="background:#0005; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <label style="display:block; margin-bottom:5px; color:#aaa; font-size:0.9em;">IDENTIFIANT DE CONNEXION :</label>
                    <div class="code-box" style="font-family:monospace; font-size:1.1em; color:#4CAF50; word-break:break-all; user-select:all; cursor:pointer;" title="Cliquer pour copier" onclick="navigator.clipboard.writeText(this.innerText); alert('ID Copié !')">
                        ${this.gameCode}
                    </div>
                    <p class="code-hint" style="margin-top:5px; font-size:0.8em;">⚠️ Envoyez cet ID complet à votre ami pour qu'il rejoigne.</p>
                </div>
                
                <div class="players-list">
                    <label>👥 Joueurs Connectés</label>
                    <div id="players-container" class="players-container" style="min-height:100px; max-height:200px; overflow-y:auto; background:#fff1; margin-top:10px; border-radius:4px;">
                        Loading...
                    </div>
                </div>

                ${this.isHost ? `
                    <button id="start-game-btn" class="btn-start" style="margin-top:20px; width:100%; padding:15px; font-size:1.2em;">
                        🚀 LANCER LE JEU
                    </button>
                ` : `
                    <div class="waiting-hint" style="margin-top:20px; color:#aaa;">
                        <span class="pulse">⏳</span> En attente que l'hôte lance la partie...
                    </div>
                `}
                
                <button onclick="location.reload()" class="btn-back" style="margin-top:15px; background:none; border:none; color:#666; cursor:pointer;">Annuler / Quitter</button>
            </div>
        `;
        document.body.appendChild(overlay);

        if (this.isHost) {
            document.getElementById('start-game-btn').addEventListener('click', () => {
                if (window.launchGameSignal) window.launchGameSignal(); // Dire au réseau de lancer
                this.onGameStart(); // Lancer localement
            });
        }
    }

    startPolling() {
        // Mise à jour de la liste toutes les 500ms
        this.pollInterval = setInterval(() => {
            // Récupérer la liste depuis network-direct.js
            const players = window.playersListHook ? window.playersListHook() : {};
            this.updateList(players);
        }, 500);
    }

    updateList(players) {
        const container = document.getElementById('players-container');
        if (!container) return;

        container.innerHTML = '';
        const list = Object.values(players);

        if (list.length === 0) {
            container.innerHTML = '<div style="padding:10px; color:#666; text-align:center">En attente...</div>';
            return;
        }

        list.forEach(p => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.style.cssText = 'display:flex; align-items:center; padding:10px; border-bottom:1px solid #fff2;';
            div.innerHTML = `
                <div style="width:30px; height:30px; background:${p.skin ? p.skin.color : '#fff'}; border-radius:50%; margin-right:15px; border:2px solid #fff3;"></div>
                <div style="flex:1;">
                    <div style="font-weight:bold; color:white;">${p.name}</div>
                    <div style="font-size:0.8em; color:#aaa;">${p.isHost ? '👑 HOST' : 'JOUEUR'}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    onGameStart() {
        console.log("GO! Lancement du jeu...");
        clearInterval(this.pollInterval);
        const overlay = document.getElementById('waiting-room-overlay');
        if (overlay) overlay.remove();

        // Démarrage du moteur de jeu
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            // On lance BattleRoyaleGame (il doit etre chargé)
            window.currentBRGame = new BattleRoyaleGame(canvas, this.playerName, this.playerSkin, this.gameCode, this.isHost);

            // Lancer la boucle d'animation si elle n'est pas auto-start
            if (window.currentBRGame.loop) {
                const loop = (t) => {
                    if (window.currentBRGame.state !== 'finished') requestAnimationFrame(loop);
                    window.currentBRGame.loop(t);
                };
                requestAnimationFrame(loop);
            }
        }
    }
}

// Adapter pour Module ou Global
window.WaitingRoom = WaitingRoom;

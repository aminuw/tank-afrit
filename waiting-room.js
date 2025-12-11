/* WAITING ROOM - SOCKET.IO NATIVE VERSION */
class WaitingRoom {
    constructor(gameCode, isHost, playerName, playerSkin) {
        this.gameCode = gameCode;
        this.isHost = isHost;
        this.playerName = playerName;
        this.playerSkin = playerSkin;
        window.waitingRoomInstance = this;
        this.setupUI();
    }

    setupUI() {
        if (document.getElementById('waiting-room-overlay')) document.getElementById('waiting-room-overlay').remove();

        const overlay = document.createElement('div');
        overlay.id = 'waiting-room-overlay';
        overlay.className = 'login-overlay';
        overlay.innerHTML = `
            <div class="login-card" style="width:90%; max-width:600px;">
                <h2>🌐 LOBBY MULTIJOUEUR</h2>
                <div class="game-code-display" style="background:#0005; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <label>CODE DE PARTIE :</label>
                    <div class="code-box" style="font-family:monospace; font-size:2em; color:#4CAF50; letter-spacing:5px;">
                        ${this.gameCode}
                    </div>
                </div>
                
                <div class="players-list">
                    <label>👥 Joueurs</label>
                    <div id="players-container" class="players-container" style="min-height:100px; background:#fff1; margin-top:10px; border-radius:4px;">
                        Chargement...
                    </div>
                </div>

                ${this.isHost ? `<button id="start-game-btn" class="btn-start" style="margin-top:20px; width:100%; padding:15px;">🚀 LANCER</button>` : `<div class="waiting-hint" style="margin-top:20px;">En attente de l'hôte...</div>`}
                <button onclick="location.reload()" class="btn-back" style="margin-top:10px;">Quitter</button>
            </div>
        `;
        document.body.appendChild(overlay);

        if (this.isHost) {
            document.getElementById('start-game-btn').addEventListener('click', () => {
                const btn = document.getElementById('start-game-btn');
                btn.innerText = "Lancement...";
                btn.disabled = true;
                console.log("👆 Click Lancer -> Envoi signal startGame");

                // Envoi signal au serveur
                if (window.launchGameSignal) window.launchGameSignal();
                else alert("Erreur: Driver réseau non trouvé !");

                // IMPORTANT: On ne lance pas localement. On attend l'ACK du serveur.
            });
        }
    }

    // Appelé directement par socket-client.js via updatePlayerList event
    updateList(players) {
        const container = document.getElementById('players-container');
        if (!container) return;

        container.innerHTML = '';
        const list = Object.values(players);

        if (list.length === 0) return;

        list.forEach(p => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.style.cssText = 'display:flex; align-items:center; padding:10px; border-bottom:1px solid #fff2; color:white;';
            div.innerHTML = `
                <div style="width:20px; height:20px; background:${p.skin ? p.skin.color : '#fff'}; border-radius:50%; margin-right:15px"></div>
                <span>${p.name} ${p.isHost ? '👑' : ''}</span>
            `;
            container.appendChild(div);
        });
    }

    onGameStart() {
        console.log("🚀 LOBBY: Reçu ordre de démarrage du serveur !");
        if (document.getElementById('waiting-room-overlay')) document.getElementById('waiting-room-overlay').remove();

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            try {
                // Initialisation du moteur de jeu
                window.currentBRGame = new BattleRoyaleGame(canvas, this.playerName, this.playerSkin, this.gameCode, this.isHost);

                // Démarrage boucle de rendu
                if (window.currentBRGame.loop) {
                    const loop = (t) => {
                        if (window.currentBRGame.state !== 'finished') requestAnimationFrame(loop);
                        window.currentBRGame.loop(t);
                    };
                    requestAnimationFrame(loop);
                }
            } catch (e) {
                alert("Erreur lancement jeu : " + e.message);
                console.error(e);
            }
        }
    }
}
window.WaitingRoom = WaitingRoom;

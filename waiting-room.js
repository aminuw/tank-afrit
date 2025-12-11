/**
 * WAITING ROOM - Salle d'attente Battle Royale
 * L'hôte peut lancer la partie quand il y a au moins 2 joueurs
 */

class WaitingRoom {
    constructor(gameCode, isHost, playerName) {
        this.gameCode = gameCode;
        this.isHost = isHost;
        this.playerName = playerName;
        this.players = new Map();
        this.minPlayers = 2;
        this.maxPlayers = 10;

        this.setupUI();
        this.listenToPlayers();
    }

    setupUI() {
        // Créer l'overlay de la salle d'attente
        const overlay = document.createElement('div');
        overlay.id = 'waiting-room-overlay';
        overlay.className = 'login-overlay';
        overlay.innerHTML = `
            <div class="login-card">
                <h2>🌐 SALLE D'ATTENTE</h2>
                <div class="game-code-display">
                    <label>Code de la partie :</label>
                    <div class="code-box">${this.gameCode}</div>
                    <p class="code-hint">Partagez ce code avec vos amis !</p>
                </div>
                
                <div class="players-list">
                    <label>👥 Joueurs (${this.players.size}/${this.maxPlayers})</label>
                    <div id="players-container" class="players-container">
                        <!-- Les joueurs seront ajoutés ici -->
                    </div>
                </div>

                <div class="waiting-status">
                    <p id="waiting-message">⏳ En attente de joueurs...</p>
                    <p class="min-players-hint">Minimum ${this.minPlayers} joueurs requis</p>
                </div>

                ${this.isHost ? `
                    <button id="start-game-btn" class="btn-start" disabled>
                        🚀 LANCER LA PARTIE
                    </button>
                    <p class="host-hint">Vous êtes l'hôte de la partie</p>
                ` : `
                    <p class="waiting-hint">En attente que l'hôte lance la partie...</p>
                `}

                <button id="leave-room-btn" class="btn-back">← Quitter</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Événements
        if (this.isHost) {
            const startBtn = document.getElementById('start-game-btn');
            startBtn.addEventListener('click', () => this.startGame());
        }

        const leaveBtn = document.getElementById('leave-room-btn');
        leaveBtn.addEventListener('click', () => this.leaveRoom());
    }

    listenToPlayers() {
        if (!currentGameRef) return;

        currentGameRef.child('players').on('value', (snapshot) => {
            const playersData = snapshot.val();
            this.players.clear();

            if (playersData) {
                Object.keys(playersData).forEach(playerId => {
                    this.players.set(playerId, playersData[playerId]);
                });
            }

            this.updatePlayersList();
            this.updateStartButton();
        });

        // Écouter le démarrage de la partie
        currentGameRef.child('status').on('value', (snapshot) => {
            const status = snapshot.val();
            if (status === 'countdown' || status === 'playing') {
                this.onGameStart();
            }
        });
    }

    updatePlayersList() {
        const container = document.getElementById('players-container');
        if (!container) return;

        container.innerHTML = '';

        this.players.forEach((player, playerId) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';

            const isHost = playerId === currentGameRef.key || player.isHost;
            const hostBadge = isHost ? '<span class="host-badge">👑 Hôte</span>' : '';

            playerDiv.innerHTML = `
                <div class="player-info">
                    <div class="player-avatar" style="background: ${player.skin?.color || '#2196F3'}"></div>
                    <div class="player-name">${player.name}</div>
                    ${hostBadge}
                </div>
            `;

            container.appendChild(playerDiv);
        });

        // Mettre à jour le compteur
        const label = container.parentElement.querySelector('label');
        if (label) {
            label.textContent = `👥 Joueurs (${this.players.size}/${this.maxPlayers})`;
        }
    }

    updateStartButton() {
        if (!this.isHost) return;

        const startBtn = document.getElementById('start-game-btn');
        const messageEl = document.getElementById('waiting-message');

        if (!startBtn || !messageEl) return;

        const canStart = this.players.size >= this.minPlayers;

        startBtn.disabled = !canStart;

        if (canStart) {
            messageEl.innerHTML = `✅ Prêt à démarrer ! (${this.players.size} joueurs)`;
            messageEl.style.color = '#4CAF50';
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
        } else {
            const needed = this.minPlayers - this.players.size;
            messageEl.innerHTML = `⏳ En attente de ${needed} joueur${needed > 1 ? 's' : ''} supplémentaire${needed > 1 ? 's' : ''}...`;
            messageEl.style.color = '#FFA500';
            startBtn.style.opacity = '0.5';
            startBtn.style.cursor = 'not-allowed';
        }
    }

    async startGame() {
        if (this.players.size < this.minPlayers) {
            alert(`Il faut au moins ${this.minPlayers} joueurs pour commencer !`);
            return;
        }

        try {
            // Passer en mode countdown
            await currentGameRef.update({
                status: 'countdown',
                startTime: firebase.database.ServerValue.TIMESTAMP
            });

            console.log('🚀 Partie lancée !');
        } catch (error) {
            console.error('Erreur lors du lancement:', error);
            alert('Erreur lors du lancement de la partie');
        }
    }

    onGameStart() {
        // Fermer la salle d'attente
        const overlay = document.getElementById('waiting-room-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Le jeu Battle Royale va démarrer automatiquement
        console.log('🎮 La partie commence !');
    }

    async leaveRoom() {
        if (confirm('Voulez-vous vraiment quitter la partie ?')) {
            await leaveGame();

            const overlay = document.getElementById('waiting-room-overlay');
            if (overlay) {
                overlay.remove();
            }

            // Retour au lobby BR
            const brLobby = document.getElementById('br-lobby-overlay');
            if (brLobby) {
                brLobby.classList.remove('hidden');
            }
        }
    }

    destroy() {
        if (currentGameRef) {
            currentGameRef.child('players').off();
            currentGameRef.child('status').off();
        }

        const overlay = document.getElementById('waiting-room-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaitingRoom;
}

# 🎮 DERNIÈRES ÉTAPES - ACTIVATION BATTLE ROYALE

## ✅ FIREBASE CONFIGURÉ !

Votre configuration Firebase est maintenant en place ! 🔥

---

## 📋 ÉTAPES RESTANTES

### 1️⃣ Ajouter les scripts Firebase dans index.html

Ouvrir `index.html` et trouver la ligne :
```html
<script src="game.js"></script>
```

**AJOUTER AVANT** cette ligne :
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

<!-- Firebase Config & Battle Royale -->
<script src="firebase-config.js"></script>
<script src="battle-royale.js"></script>

<!-- Game Script -->
<script src="game.js"></script>
```

---

### 2️⃣ Ajouter les styles CSS

Ajouter à la fin de `style.css` :

```css
/* ═══════════════════════════════════════════════════════════════════════════
   MODE SELECTION
   ═══════════════════════════════════════════════════════════════════════════ */

.mode-selection-card {
    background: rgba(15, 15, 35, 0.95);
    border-radius: 20px;
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(76, 175, 80, 0.3);
}

.mode-selection-card h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 40px;
    color: #4CAF50;
    text-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

.mode-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
}

.mode-option {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05));
    border: 3px solid rgba(33, 150, 243, 0.3);
    border-radius: 15px;
    padding: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.mode-option:hover {
    transform: translateY(-10px);
    border-color: rgba(33, 150, 243, 0.8);
    box-shadow: 0 10px 30px rgba(33, 150, 243, 0.3);
}

.mode-option#mode-battle-royale {
    background: linear-gradient(135deg, rgba(255, 87, 34, 0.1), rgba(255, 87, 34, 0.05));
    border-color: rgba(255, 87, 34, 0.3);
}

.mode-option#mode-battle-royale:hover {
    border-color: rgba(255, 87, 34, 0.8);
    box-shadow: 0 10px 30px rgba(255, 87, 34, 0.3);
}

.mode-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.mode-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 15px;
    color: #FFF;
}

.mode-description {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin-bottom: 20px;
}

.mode-badge {
    display: inline-block;
    background: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid rgba(76, 175, 80, 0.5);
}

.mode-badge.online {
    background: rgba(255, 87, 34, 0.2);
    color: #FF5722;
    border-color: rgba(255, 87, 34, 0.5);
}

/* ═══════════════════════════════════════════════════════════════════════════
   BATTLE ROYALE LOBBY
   ═══════════════════════════════════════════════════════════════════════════ */

.btn-back {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #FFF;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
}

.btn-back:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
}

.br-actions {
    margin: 30px 0;
}

.btn-primary {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    border: none;
    color: white;
    padding: 15px 30px;
    font-size: 1.2rem;
    font-weight: 700;
    border-radius: 10px;
    cursor: pointer;
    width: 100%;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(76, 175, 80, 0.5);
}

.or-divider {
    text-align: center;
    margin: 20px 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;
}

.join-game-section {
    display: flex;
    gap: 10px;
}

.join-game-section input {
    flex: 1;
    padding: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: #FFF;
    border-radius: 10px;
    font-size: 1.2rem;
    text-align: center;
    font-weight: 700;
}

.btn-secondary {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    border: none;
    color: white;
    padding: 12px 30px;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
}

.btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(33, 150, 243, 0.5);
}

.active-games-list {
    margin-top: 30px;
}

.active-games-list label {
    display: block;
    margin-bottom: 15px;
    font-size: 1.2rem;
    color: #4CAF50;
}

.games-container {
    max-height: 200px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 15px;
}

.no-games {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    padding: 20px;
}

.game-item {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.game-item:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(76, 175, 80, 0.5);
}

.game-code {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4CAF50;
}

.game-players {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 5px;
}
```

---

### 3️⃣ Ajouter la logique de navigation dans game.js

Ajouter **À LA FIN** de `game.js` :

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION ENTRE LES MODES
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    const modeSelection = document.getElementById('mode-selection-overlay');
    const soloLobby = document.getElementById('solo-lobby-overlay');
    const brLobby = document.getElementById('br-lobby-overlay');
    
    const modeSolo = document.getElementById('mode-solo');
    const modeBR = document.getElementById('mode-battle-royale');
    
    const backFromSolo = document.getElementById('back-from-solo');
    const backFromBR = document.getElementById('back-from-br');
    
    // Cliquer sur Solo
    if (modeSolo) {
        modeSolo.addEventListener('click', () => {
            modeSelection.classList.add('hidden');
            soloLobby.classList.remove('hidden');
        });
    }
    
    // Cliquer sur Battle Royale
    if (modeBR) {
        modeBR.addEventListener('click', () => {
            modeSelection.classList.add('hidden');
            brLobby.classList.remove('hidden');
            
            // Initialiser Firebase
            if (typeof initFirebase === 'function') {
                if (!initFirebase()) {
                    alert('Erreur: Firebase n\'est pas configuré correctement.');
                    brLobby.classList.add('hidden');
                    modeSelection.classList.remove('hidden');
                }
            } else {
                alert('Erreur: Firebase SDK non chargé. Vérifiez index.html');
                brLobby.classList.add('hidden');
                modeSelection.classList.remove('hidden');
            }
        });
    }
    
    // Retour depuis Solo
    if (backFromSolo) {
        backFromSolo.addEventListener('click', () => {
            soloLobby.classList.add('hidden');
            modeSelection.classList.remove('hidden');
        });
    }
    
    // Retour depuis BR
    if (backFromBR) {
        backFromBR.addEventListener('click', () => {
            brLobby.classList.add('hidden');
            modeSelection.classList.remove('hidden');
        });
    }
    
    // Démarrer Solo (bouton modifié dans index.html)
    const startSoloBtn = document.getElementById('start-solo-btn');
    if (startSoloBtn) {
        startSoloBtn.addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value.trim() || 'Joueur';
            soloLobby.classList.add('hidden');
            
            // Le code existant de démarrage du jeu solo
            setTimeout(() => {
                const game = new Game(document.getElementById('gameCanvas'));
                game.playerName = playerName;
                game.startWave(1);
            }, 100);
        });
    }
    
    // Créer partie BR
    const createGameBtn = document.getElementById('create-game-btn');
    if (createGameBtn) {
        createGameBtn.addEventListener('click', async () => {
            const playerName = document.getElementById('br-player-name').value.trim() || 'Joueur';
            
            // Récupérer le skin sélectionné
            const selectedSkin = document.querySelector('#br-skins-grid .skin-option.selected');
            const playerSkin = {
                color: selectedSkin?.dataset.color || '#2196F3',
                color2: selectedSkin?.dataset.color2 || '#1565C0'
            };
            
            try {
                const result = await createGame(playerName, playerSkin);
                if (result) {
                    console.log(`Partie créée ! Code: ${result.gameCode}`);
                    // Lancer le jeu BR
                    brLobby.classList.add('hidden');
                    new BattleRoyaleGame(
                        document.getElementById('gameCanvas'),
                        playerName,
                        playerSkin,
                        result.gameCode,
                        true // isHost
                    );
                }
            } catch (error) {
                alert(`Erreur lors de la création: ${error.message}`);
            }
        });
    }
    
    // Rejoindre partie BR
    const joinGameBtn = document.getElementById('join-game-btn');
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', async () => {
            const gameCode = document.getElementById('game-code-input').value.trim().toUpperCase();
            const playerName = document.getElementById('br-player-name').value.trim() || 'Joueur';
            
            if (!gameCode || gameCode.length !== 4) {
                alert('Veuillez entrer un code de partie valide (4 caractères)');
                return;
            }
            
            // Récupérer le skin sélectionné
            const selectedSkin = document.querySelector('#br-skins-grid .skin-option.selected');
            const playerSkin = {
                color: selectedSkin?.dataset.color || '#2196F3',
                color2: selectedSkin?.dataset.color2 || '#1565C0'
            };
            
            try {
                const result = await joinGame(gameCode, playerName, playerSkin);
                console.log(`Partie rejointe ! Code: ${result.gameCode}`);
                // Lancer le jeu BR
                brLobby.classList.add('hidden');
                new BattleRoyaleGame(
                    document.getElementById('gameCanvas'),
                    playerName,
                    playerSkin,
                    result.gameCode,
                    false // isHost
                );
            } catch (error) {
                alert(`Erreur: ${error.message}`);
            }
        });
    }
    
    // Sélection de skin pour BR
    const brSkins = document.querySelectorAll('#br-skins-grid .skin-option');
    brSkins.forEach(skin => {
        skin.addEventListener('click', () => {
            brSkins.forEach(s => s.classList.remove('selected'));
            skin.classList.add('selected');
            
            // Mettre à jour l'aperçu si nécessaire
            const previewCanvas = document.getElementById('br-tank-preview');
            if (previewCanvas) {
                const ctx = previewCanvas.getContext('2d');
                // Utiliser la même fonction de rendu que pour le solo
                if (typeof game !== 'undefined' && game.renderTankPreview) {
                    game.renderTankPreview(ctx, previewCanvas);
                }
            }
        });
    });
});
```

---

## ✅ CHECKLIST FINALE

- [x] Firebase configuré avec vos valeurs
- [ ] Scripts Firebase ajoutés dans index.html
- [ ] Styles CSS ajoutés dans style.css
- [ ] Logique de navigation ajoutée dans game.js
- [ ] Tester le jeu !

---

## 🎮 COMMENT TESTER

1. **Ouvrir index.html** dans votre navigateur
2. **Vérifier la console** (F12) - Devrait afficher "✅ Firebase initialized successfully"
3. **Cliquer sur "BATTLE ROYALE"**
4. **Créer une partie** - Noter le code
5. **Ouvrir un autre navigateur/onglet**
6. **Rejoindre avec le code**
7. **JOUER !** 🔥

---

## 🚀 VOUS ÊTES PRESQUE PRÊT !

Plus que 3 étapes et votre Battle Royale sera **OPÉRATIONNEL** ! 🎮👑

Suivez les instructions ci-dessus et amusez-vous bien ! 🔥

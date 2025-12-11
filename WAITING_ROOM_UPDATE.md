# 🎮 MISE À JOUR - SALLE D'ATTENTE

## ✅ FICHIERS CRÉÉS

1. **`waiting-room.js`** ✅ - Logique de la salle d'attente
2. **Styles CSS ajoutés** ✅ - Design de la salle d'attente
3. **Script ajouté dans index.html** ✅

---

## 🔧 MODIFICATION À FAIRE DANS game.js

### Trouver cette section (ligne ~2208) :

```javascript
// Créer partie BR
const createGameBtn = document.getElementById('create-game-btn');
if (createGameBtn) {
    createGameBtn.addEventListener('click', async () => {
        const playerName = document.getElementById('br-player-name').value.trim() || 'Joueur';
        
        const selectedSkin = document.querySelector('#br-skins-grid .skin-option.selected');
        const playerSkin = {
            color: selectedSkin?.dataset.color || '#2196F3',
            color2: selectedSkin?.dataset.color2 || '#1565C0'
        };
        
        try {
            const result = await createGame(playerName, playerSkin);
            if (result) {
                console.log('Partie créée ! Code: ' + result.gameCode);
                brLobby.classList.add('hidden');
                new BattleRoyaleGame(
                    document.getElementById('gameCanvas'),
                    playerName,
                    playerSkin,
                    result.gameCode,
                    true
                );
            }
        } catch (error) {
            alert('Erreur lors de la création: ' + error.message);
        }
    });
}
```

### REMPLACER PAR :

```javascript
// Créer partie BR
const createGameBtn = document.getElementById('create-game-btn');
if (createGameBtn) {
    createGameBtn.addEventListener('click', async () => {
        const playerName = document.getElementById('br-player-name').value.trim() || 'Joueur';
        
        const selectedSkin = document.querySelector('#br-skins-grid .skin-option.selected');
        const playerSkin = {
            color: selectedSkin?.dataset.color || '#2196F3',
            color2: selectedSkin?.dataset.color2 || '#1565C0'
        };
        
        try {
            const result = await createGame(playerName, playerSkin);
            if (result) {
                console.log('Partie créée ! Code: ' + result.gameCode);
                brLobby.classList.add('hidden');
                
                // NOUVEAU : Afficher la salle d'attente au lieu de lancer directement
                new WaitingRoom(result.gameCode, true, playerName);
            }
        } catch (error) {
            alert('Erreur lors de la création: ' + error.message);
        }
    });
}
```

---

### Trouver aussi cette section (ligne ~2240) :

```javascript
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
        
        const selectedSkin = document.querySelector('#br-skins-grid .skin-option.selected');
        const playerSkin = {
            color: selectedSkin?.dataset.color || '#2196F3',
            color2: selectedSkin?.dataset.color2 || '#1565C0'
        };
        
        try {
            const result = await joinGame(gameCode, playerName, playerSkin);
            console.log('Partie rejointe ! Code: ' + result.gameCode);
            brLobby.classList.add('hidden');
            new BattleRoyaleGame(
                document.getElementById('gameCanvas'),
                playerName,
                playerSkin,
                result.gameCode,
                false
            );
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    });
}
```

### REMPLACER PAR :

```javascript
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
        
        const selectedSkin = document.querySelector('#br-skins-grid .skin-option.selected');
        const playerSkin = {
            color: selectedSkin?.dataset.color || '#2196F3',
            color2: selectedSkin?.dataset.color2 || '#1565C0'
        };
        
        try {
            const result = await joinGame(gameCode, playerName, playerSkin);
            console.log('Partie rejointe ! Code: ' + result.gameCode);
            brLobby.classList.add('hidden');
            
            // NOUVEAU : Afficher la salle d'attente
            new WaitingRoom(result.gameCode, false, playerName);
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    });
}
```

---

## 🎮 COMMENT ÇA MARCHE

### Pour l'hôte :
1. Créer une partie
2. Salle d'attente s'affiche avec le code
3. Attendre que des joueurs rejoignent
4. Quand il y a **minimum 2 joueurs** → Bouton "🚀 LANCER LA PARTIE" devient actif
5. Cliquer pour lancer → Partie démarre !

### Pour les joueurs :
1. Rejoindre avec le code
2. Salle d'attente s'affiche
3. Voir les autres joueurs
4. Attendre que l'hôte lance
5. Partie démarre automatiquement !

---

## ✅ FEATURES

- ✅ Minimum 2 joueurs requis
- ✅ Maximum 10 joueurs
- ✅ L'hôte a un badge 👑
- ✅ Bouton "LANCER" désactivé si < 2 joueurs
- ✅ Code de partie affiché en grand
- ✅ Liste des joueurs en temps réel
- ✅ Bouton "Quitter" pour tous

---

**FAITES CES 2 MODIFICATIONS ET C'EST PRÊT !** 🚀

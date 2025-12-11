# 🎮 TANK BATTLE ROYALE - PLAN D'IMPLÉMENTATION

## 🎯 CONCEPT

Un mode Battle Royale où :
- **2-10 joueurs** s'affrontent sur une grande map
- **Buissons** pour se cacher (les autres ne voient pas votre tank)
- **Zone qui rétrécit** en fonction du temps et du nombre de joueurs
- **Dernier survivant** gagne

---

## 🗺️ MAP BATTLE ROYALE

### Taille
- **Solo** : 1200x800 (actuel)
- **Battle Royale** : 2400x1600 (2x plus grande)

### Éléments
1. **Buissons** 🌿 (15-20)
   - Taille : 80x80px
   - Effet : Cache le tank (invisible pour les autres)
   - Visuel : Emoji 🌿 avec transparence

2. **Rochers** 🪨 (10-15)
   - Taille : 60x60px
   - Effet : Obstacle solide (collision)
   - Visuel : Emoji 🪨

3. **Arbres** 🌲 (8-12)
   - Taille : 100x100px
   - Effet : Obstacle solide
   - Visuel : Emoji 🌲

4. **Power-ups** ⚡ (spawn aléatoire)
   - Santé, vitesse, bouclier
   - Apparaissent toutes les 20 secondes

---

## 🔴 ZONE QUI RÉTRÉCIT

### Mécanisme
```
Début : Zone = toute la map (2400x1600)
  ↓
Phase 1 (30s) : Zone rétrécit à 80% (1920x1280)
  ↓
Phase 2 (30s) : Zone rétrécit à 60% (1440x960)
  ↓
Phase 3 (30s) : Zone rétrécit à 40% (960x640)
  ↓
Phase 4 (30s) : Zone rétrécit à 20% (480x320)
  ↓
Phase Finale : Combat final dans petite zone
```

### Dégâts hors zone
- **5 HP/seconde** quand hors de la zone
- Indicateur visuel (bord rouge clignotant)
- Message "⚠️ HORS ZONE !"

### Adaptation au nombre de joueurs
```javascript
// Si beaucoup de joueurs morts rapidement
if (playersAlive < totalPlayers * 0.5) {
    // Accélérer le rétrécissement
    shrinkSpeed *= 1.5;
}
```

---

## 🌿 SYSTÈME DE BUISSONS

### Mécanisme
```javascript
// Quand le joueur entre dans un buisson
if (playerInBush) {
    player.hidden = true; // Invisible pour les autres
    player.opacity = 0.3; // Semi-transparent pour soi-même
}

// Quand le joueur sort du buisson
if (!playerInBush) {
    player.hidden = false;
    player.opacity = 1.0;
}

// Quand le joueur tire depuis un buisson
if (playerInBush && playerShoots) {
    player.hidden = false; // Révélé !
    setTimeout(() => {
        if (playerInBush) player.hidden = true;
    }, 2000); // Révélé pendant 2 secondes
}
```

### Visuel
- **Pour soi-même** : Tank semi-transparent (30% opacité)
- **Pour les autres** : Tank complètement invisible
- **Indicateur** : Icône 🌿 en haut à droite quand caché

---

## 🛠️ SOLUTION TECHNIQUE : FIREBASE

### Pourquoi Firebase ?
- ✅ **Gratuit** jusqu'à 100 connexions simultanées
- ✅ **Pas de serveur** à gérer
- ✅ **Compatible Netlify** (juste du JavaScript)
- ✅ **Temps réel** (synchronisation automatique)
- ✅ **Simple** à mettre en place

### Architecture
```
Firebase Realtime Database
├── games/
│   ├── game_abc123/
│   │   ├── status: "waiting" | "playing" | "finished"
│   │   ├── players/
│   │   │   ├── player1/
│   │   │   │   ├── x: 450
│   │   │   │   ├── y: 320
│   │   │   │   ├── angle: 45
│   │   │   │   ├── health: 100
│   │   │   │   ├── hidden: false
│   │   │   │   ├── alive: true
│   │   │   ├── player2/
│   │   │   │   └── ...
│   │   ├── zone/
│   │   │   ├── centerX: 1200
│   │   │   ├── centerY: 800
│   │   │   ├── radius: 1200
│   │   ├── bullets/
│   │   │   ├── bullet1/
│   │   │   │   ├── x: 500
│   │   │   │   ├── y: 300
│   │   │   │   ├── angle: 90
│   │   │   │   ├── ownerId: "player1"
```

### Synchronisation
- **Position** : Envoyée 10 fois/seconde (100ms)
- **Tirs** : Envoyés immédiatement
- **Collisions** : Calculées côté client (chacun calcule)
- **Zone** : Gérée par l'hôte, synchronisée avec tous

---

## 🎨 INTERFACE

### Lobby
```
┌─────────────────────────────────────┐
│      🎮 TANK BRAWLER 🎮             │
├─────────────────────────────────────┤
│                                     │
│   [🎯 MODE SOLO]                    │
│   Combattez contre les vagues       │
│                                     │
│   [🌐 BATTLE ROYALE]                │
│   Affrontez d'autres joueurs        │
│                                     │
└─────────────────────────────────────┘
```

### Lobby Battle Royale
```
┌─────────────────────────────────────┐
│     🌐 BATTLE ROYALE LOBBY          │
├─────────────────────────────────────┤
│                                     │
│  [CRÉER UNE PARTIE]                 │
│  [REJOINDRE UNE PARTIE]             │
│                                     │
│  Code de partie: [______]           │
│                                     │
│  Joueurs en ligne: 12               │
│                                     │
└─────────────────────────────────────┘
```

### Salle d'attente
```
┌─────────────────────────────────────┐
│   SALLE - CODE: A7B2 (2/10)         │
├─────────────────────────────────────┤
│                                     │
│  👤 Joueur1 (Hôte) ✅               │
│  👤 Joueur2        ✅               │
│  ⬜ En attente...                   │
│                                     │
│  La partie démarre dans: 30s        │
│  (ou quand 2+ joueurs prêts)        │
│                                     │
│  [PRÊT]  [QUITTER]                  │
└─────────────────────────────────────┘
```

### HUD en jeu
```
┌─────────────────────────────────────┐
│ ❤️ 85/100  🌿 CACHÉ                 │
│ 👥 Vivants: 5/10                    │
│ 🔴 Zone: Phase 2 (45s)              │
└─────────────────────────────────────┘
```

---

## 📊 DONNÉES À SYNCHRONISER

### Fréquence élevée (100ms)
```javascript
{
    playerId: "player123",
    x: 450,
    y: 320,
    angle: 45,
    turretAngle: 90,
    timestamp: 1234567890
}
```

### Événements (immédiat)
```javascript
// Tir
{
    type: "shoot",
    playerId: "player123",
    bulletId: "bullet456",
    x: 450,
    y: 320,
    angle: 90
}

// Hit
{
    type: "hit",
    targetId: "player789",
    damage: 10,
    shooterId: "player123"
}

// Mort
{
    type: "death",
    playerId: "player789",
    killerId: "player123"
}

// Entrée/sortie buisson
{
    type: "visibility",
    playerId: "player123",
    hidden: true
}
```

### État de la zone (1 fois/seconde)
```javascript
{
    centerX: 1200,
    centerY: 800,
    radius: 960,
    phase: 2,
    nextShrink: 30 // secondes
}
```

---

## 🎮 GAMEPLAY

### Début de partie
1. **Spawn aléatoire** sur la map (pas trop proche des autres)
2. **Countdown** 5 secondes
3. **GO !** - Combat commence
4. **Zone** commence à rétrécir après 30s

### Pendant la partie
- Chercher des power-ups
- Se cacher dans les buissons
- Éviter la zone
- Éliminer les autres joueurs

### Fin de partie
- **Dernier survivant** = VICTOIRE ! 👑
- **Éliminé** = Spectateur (regarde les autres)
- **Classement final** affiché

---

## 🏆 SYSTÈME DE CLASSEMENT

### Points
- **Victoire** : 100 points
- **Kill** : 10 points
- **Top 3** : 50 points
- **Top 5** : 25 points
- **Survie** : 1 point/10 secondes

### Leaderboard
```
┌─────────────────────────────────────┐
│        🏆 CLASSEMENT 🏆             │
├─────────────────────────────────────┤
│  1. 👑 Joueur1    250 pts (5 wins)  │
│  2. 🥈 Joueur2    180 pts (2 wins)  │
│  3. 🥉 Joueur3    150 pts (1 win)   │
│  4.    Joueur4    120 pts           │
│  5.    Joueur5    100 pts           │
└─────────────────────────────────────┘
```

---

## 📝 FICHIERS À CRÉER

1. **`firebase-config.js`** - Configuration Firebase
2. **`battle-royale.js`** - Logique Battle Royale
3. **`multiplayer.js`** - Synchronisation multijoueur
4. **`lobby-online.html`** - Interface lobby online
5. **Modifier `index.html`** - Ajouter choix Solo/Online

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Créer compte Firebase (gratuit)
2. ✅ Configurer Realtime Database
3. ✅ Créer l'interface lobby
4. ✅ Implémenter la synchronisation
5. ✅ Ajouter la map Battle Royale
6. ✅ Implémenter la zone qui rétrécit
7. ✅ Ajouter les buissons
8. ✅ Tester avec plusieurs joueurs

**Prêt à commencer ?** 🔥

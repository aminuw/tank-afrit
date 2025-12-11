# 🎮 Tank Brawler - Architecture du Projet

## Vue d'ensemble

Tank Brawler est un jeu de tanks avec deux modes :
- **Solo** : Combattez des vagues d'ennemis IA avec système de progression
- **Battle Royale** : Affrontez d'autres joueurs en temps réel

---

## 📁 Structure des Fichiers

### Frontend (Jeu)

| Fichier | Description |
|---------|-------------|
| `index.html` | Page principale - contient les menus, overlays et canvas du jeu |
| `style.css` | Styles CSS complets (menus, animations, thèmes Noël) |
| `game.js` | **Moteur de jeu solo** - Classes Tank, Enemy, Boss, système XP, 5 maps thématiques |
| `battle-royale.js` | **Moteur Battle Royale** - Jeu multijoueur avec HUD, minimap, zone qui rétrécit |

### Backend (Serveur)

| Fichier | Description |
|---------|-------------|
| `server.js` | **Serveur Node.js** - Socket.io, gestion des rooms, synchronisation joueurs |
| `socket-client.js` | Client réseau - connexion au serveur, envoi/réception des événements |
| `socket-config.js` | Configuration de la connexion serveur (URL, options) |
| `waiting-room.js` | Interface du lobby multijoueur avant le lancement |

### Réseau (Alternatives)

| Fichier | Description |
|---------|-------------|
| `firebase-config.js` | Configuration Firebase Realtime Database (alternative à Socket.io) |
| `network-direct.js` | Connexion directe WebRTC (expérimental) |
| `p2p-manager.js` | Gestion Peer-to-Peer (expérimental) |

### Configuration

| Fichier | Description |
|---------|-------------|
| `package.json` | Dépendances Node.js (express, socket.io) |
| `package-lock.json` | Versions exactes des dépendances |

### Documentation

| Fichier | Description |
|---------|-------------|
| `README.md` | Présentation générale du projet |
| `NOTICE_INSTALLATION.md` | Guide d'installation |
| `ONLINE_DEPLOY.md` | Guide de déploiement en ligne |
| `ONLINE_DEPLOY_PRO.md` | Déploiement avancé (Render, Railway) |

---

## 🎯 Mode Solo (`game.js`)

**Classes principales :**
- `Tank` - Tank de base avec mouvement, tir, dash
- `EnemyTank` - IA ennemie avec patrouille et attaque
- `BossTank` - Boss avec patterns d'attaque spéciaux
- `Bullet` - Projectiles avec traînée visuelle
- `Explosion` - Effets de particules
- `FloatingText` - Texte de dégâts

**Fonctionnalités :**
- Système XP et niveaux
- 5 compétences à améliorer
- 5 maps thématiques (Noël, Désert, Hiver, Forêt, Lave)
- Vagues d'ennemis + Boss

---

## 🌐 Mode Battle Royale (`battle-royale.js`)

**Fonctionnalités :**
- Multijoueur temps réel via Socket.io
- Zone qui rétrécit (storm)
- HUD style Fortnite (PV, kills, joueurs en vie)
- Minimap avec positions des joueurs
- Buissons pour se cacher (stealth)

**Architecture réseau :**
```
[Client] <--Socket.io--> [Serveur Node.js] <--Socket.io--> [Autres Clients]
```

---

## 🚀 Lancement

### Mode Solo
Ouvrir `index.html` dans un navigateur

### Mode Battle Royale
```bash
npm install
node server.js
# Ouvrir http://localhost:3000
```

---

## 📦 Dépendances

- `express` - Serveur HTTP
- `socket.io` - Communication temps réel

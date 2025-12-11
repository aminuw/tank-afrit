# 🎮 Tank Brawler - Architecture du Projet

## Vue d'ensemble

Tank Brawler est un jeu de tanks avec deux modes :
- **Solo** : Combattez des vagues d'ennemis IA avec système de progression
- **Battle Royale** : Affrontez d'autres joueurs en temps réel via Socket.io

---

## 📁 Structure des Fichiers

### Frontend (Jeu)

| Fichier | Description |
|---------|-------------|
| `index.html` | Page principale - menus, overlays et canvas |
| `style.css` | Styles CSS complets (menus, animations, thème Noël) |
| `game.js` | **Moteur solo** - Classes Tank, Enemy, Boss, XP, 5 maps |
| `battle-royale.js` | **Moteur BR** - Multijoueur, HUD, minimap, zone |

### Backend (Serveur Socket.io)

| Fichier | Description |
|---------|-------------|
| `server.js` | Serveur Node.js - Express + Socket.io |
| `socket-client.js` | Client réseau - API pour le jeu |
| `waiting-room.js` | Lobby multijoueur |

### Configuration

| Fichier | Description |
|---------|-------------|
| `package.json` | Dépendances (express, socket.io) |

### Documentation

| Fichier | Description |
|---------|-------------|
| `README.md` | Présentation générale |
| `NOTICE_INSTALLATION.md` | Guide d'installation |
| `ONLINE_DEPLOY.md` | Guide déploiement Railway |

---

## � Architecture Réseau

```
┌──────────────┐     Socket.io      ┌──────────────┐
│   Client 1   │◄──────────────────►│              │
└──────────────┘                    │              │
                                    │  server.js   │
┌──────────────┐     Socket.io      │   (Node.js)  │
│   Client 2   │◄──────────────────►│              │
└──────────────┘                    └──────────────┘
```

### Événements Socket.io

| Client → Serveur | Serveur → Client |
|------------------|------------------|
| `createGame` | `gameJoined` |
| `joinGame` | `updatePlayerList` |
| `playerInput` | `playerMoved` |
| `shoot` | `bulletFired` |
| `playerHit` | `playerKilled` |
| `startGame` | `gameStarted` |
| - | `zoneUpdate` |
| - | `gameOver` |

---

## 🚀 Lancement

### Mode Solo
Ouvrir `index.html` directement

### Mode Battle Royale
```bash
npm install
node server.js
# http://localhost:3000
```

### Déploiement Railway
1. Push sur GitHub
2. Connecter Railway au repo
3. Variable : `PORT` (auto)

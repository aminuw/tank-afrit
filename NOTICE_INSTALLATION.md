# 🎮 TANK BRAWLER - NOTICE D'INSTALLATION & DÉPLOIEMENT

## 🌟 Architecture (P2P Hybride)
Ce projet utilise une architecture moderne "Serverless" idéale pour l'hébergement gratuit.
- **Site Web** : HTML/JS Statique (Aucun serveur back-end requis).
- **Lobby** : Géré par Firebase (Liste des parties).
- **Jeu** : Peer-to-Peer (WebRTC) via PeerJS. Les ordinateurs des joueurs se connectent directement.

---

## 💻 TESTER EN LOCAL

1. **Prérequis** : Avoir un serveur web local (WAMP, XAMPP, Live Server VSCode).
   * *Note : PeerJS nécessite souvent HTTPS ou localhost pour fonctionner correctement.*
2. **Lancer** : 
   - Ouvrez votre navigateur.
   - Accédez à `http://localhost/tank/index.html` (selon votre config).
3. **Tester le Multijoueur** :
   - Ouvrez deux fenêtres (l'une normale, l'autre en Navigation Privée).
   - Fenêtre 1 : Cliquez sur **CRÉER UNE PARTIE**.
   - Fenêtre 2 : Recopiez le CODE (ex: `A7B2`) et cliquez sur **REJOINDRE**.

---

## ☁️ DÉPLOYER SUR NETLIFY (Gratuit)

C'est la méthode recommandée pour jouer avec des amis en ligne.

1. **Préparer les fichiers** :
   - Assurez-vous que tous les fichiers sont dans le dossier du projet (`index.html`, `game.js`, `p2p-manager.js`, etc.).
   
2. **Méthode Facile (Drag & Drop)** :
   - Allez sur [app.netlify.com](https://app.netlify.com).
   - Connectez-vous.
   - Dans l'onglet "Sites", glissez-déposez tout votre dossier `tank` dans la zone de drop.
   - Attendez quelques secondes... C'est en ligne !

3. **Méthode Git (Automatique)** :
   - Si votre projet est sur GitHub/GitLab, connectez simplement Netlify à votre repo.
   - Le déploiement se fera à chaque "Push".

---

## 🛠️ DÉPANNAGE

**Le jeu reste bloqué sur "Connexion..." ?**
- Vérifiez votre connexion internet (PeerJS a besoin d'accéder au serveur de signalement public).
- Certains réseaux d'entreprise/école bloquent le P2P (WebRTC). Essayez en 4G/Partage de connexion.

**Je ne vois pas les autres joueurs ?**
- Assurez-vous d'avoir bien rechargé la page après la dernière mise à jour (`Ctrl + F5`).
- Vérifiez que le pare-feu ne bloque pas les connexions.

---

*Développé avec ❤️ pour Tank Brawler LAN Edition*

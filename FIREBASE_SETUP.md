# 🔥 GUIDE D'INSTALLATION FIREBASE

## 📋 ÉTAPES D'INSTALLATION

### 1. Créer un compte Firebase (GRATUIT)

1. Aller sur https://console.firebase.google.com/
2. Cliquer sur "Ajouter un projet"
3. Nom du projet : `tank-battle-royale` (ou autre)
4. Désactiver Google Analytics (pas nécessaire)
5. Cliquer sur "Créer le projet"

---

### 2. Activer Realtime Database

1. Dans le menu gauche, cliquer sur "Realtime Database"
2. Cliquer sur "Créer une base de données"
3. Localisation : **Europe (europe-west1)** (plus proche)
4. Règles de sécurité : Choisir **"Mode test"** pour commencer
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
5. Cliquer sur "Activer"

⚠️ **IMPORTANT** : Les règles en mode test expirent après 30 jours. Pour la production, il faudra les sécuriser.

---

### 3. Obtenir la configuration Firebase

1. Cliquer sur l'icône ⚙️ (Paramètres) en haut à gauche
2. Cliquer sur "Paramètres du projet"
3. Faire défiler jusqu'à "Vos applications"
4. Cliquer sur l'icône `</>` (Web)
5. Nom de l'application : `Tank Battle Royale`
6. **NE PAS** cocher "Firebase Hosting"
7. Cliquer sur "Enregistrer l'application"
8. **COPIER** le code de configuration qui apparaît

Vous devriez voir quelque chose comme :
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tank-battle-royale.firebaseapp.com",
  databaseURL: "https://tank-battle-royale-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tank-battle-royale",
  storageBucket: "tank-battle-royale.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKrkx3sfcpVWz_S2VcgusXiZDX5RDimUc",
  authDomain: "tank-afrit.firebaseapp.com",
  databaseURL: "https://tank-afrit-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tank-afrit",
  storageBucket: "tank-afrit.firebasestorage.app",
  messagingSenderId: "582023151560",
  appId: "1:582023151560:web:7c64f404bd5315f7844afd",
  measurementId: "G-8DNJ7HF6TK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

---

### 4. Configurer le projet

1. Ouvrir le fichier `firebase-config.js`
2. **REMPLACER** les valeurs de `firebaseConfig` par celles que vous avez copiées
3. Sauvegarder le fichier

**Avant** :
```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    // ...
};
```

**Après** :
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "tank-battle-royale.firebaseapp.com",
    databaseURL: "https://tank-battle-royale-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tank-battle-royale",
    storageBucket: "tank-battle-royale.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

---

### 5. Ajouter Firebase SDK à index.html

Ajouter ces lignes **AVANT** `<script src="game.js"></script>` :

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

<!-- Firebase Config -->
<script src="firebase-config.js"></script>

<!-- Game Script -->
<script src="game.js"></script>
```

---

### 6. Tester Firebase

1. Ouvrir `index.html` dans votre navigateur
2. Ouvrir la console (F12)
3. Vous devriez voir : `✅ Firebase initialized successfully`
4. Si vous voyez une erreur, vérifier :
   - La configuration dans `firebase-config.js`
   - Les scripts Firebase dans `index.html`
   - La connexion internet

---

## 🔒 SÉCURISER LA BASE DE DONNÉES (OPTIONNEL)

Pour éviter les abus, vous pouvez sécuriser votre base de données :

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": "!data.exists() || data.child('host').val() === auth.uid",
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid"
          }
        }
      }
    }
  }
}
```

Mais cela nécessite l'authentification Firebase (plus complexe).

---

## 📊 LIMITES GRATUITES

Firebase offre généreusement :
- ✅ **100 connexions simultanées**
- ✅ **1 GB de données stockées**
- ✅ **10 GB de téléchargement/mois**
- ✅ **Pas de limite de temps**

C'est **largement suffisant** pour un jeu Battle Royale avec 10-20 joueurs !

---

## 🚀 DÉPLOYER SUR NETLIFY

1. Créer un compte sur https://netlify.com (gratuit)
2. Glisser-déposer votre dossier `je` sur Netlify
3. Votre jeu sera en ligne en quelques secondes !
4. URL : `https://votre-site.netlify.app`

**Netlify est compatible** avec Firebase car tout se passe côté client (JavaScript).

---

## ✅ CHECKLIST FINALE

- [ ] Compte Firebase créé
- [ ] Realtime Database activée
- [ ] Configuration copiée dans `firebase-config.js`
- [ ] Scripts Firebase ajoutés dans `index.html`
- [ ] Console affiche "Firebase initialized successfully"
- [ ] Prêt à tester le mode Battle Royale !

---

## 🆘 PROBLÈMES COURANTS

### Erreur : "Firebase not defined"
**Solution** : Vérifier que les scripts Firebase sont bien chargés dans `index.html`

### Erreur : "Permission denied"
**Solution** : Vérifier les règles de sécurité dans Firebase Console

### Erreur : "Network error"
**Solution** : Vérifier la connexion internet et le `databaseURL`

---

**Vous êtes prêt !** 🎮🔥

Passez à l'étape suivante : Tester le mode Battle Royale !

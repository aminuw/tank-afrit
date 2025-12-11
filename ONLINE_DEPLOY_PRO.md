# ⚡ HÉBERGEMENT PRO (Haute Performance & Zéro Lag)

Si Render est trop lent (ce qui arrive souvent en version gratuite), voici les meilleures alternatives pour héberger votre serveur Node.js gratuitement ou pour quelques euros.

---

## 🚄 OPTION 1 : RAILWAY (Recommandé)
Railway est beaucoup plus rapide que Render car il ne met pas votre site en veille profonde.

### Comment faire :
1. Allez sur [Railway.app](https://railway.app/).
2. Connectez-vous avec GitHub.
3. Cliquez sur **New Project** -> **Deploy from GitHub repo**.
4. Sélectionnez votre repo `tank-battle`.
5. Railway va détecter `package.json` et tout installer automatiquement.
6. Une fois déployé, allez dans **Settings** -> **Generate Domain**.
7. C'est fait.

---

## 🦅 OPTION 2 : KOYEB (Mode Gamer)
Koyeb utilise des MicroVMs ultra-rapides à Francfort (idéal pour nous en Europe).

### Comment faire :
1. Allez sur [Koyeb.com](https://www.koyeb.com/).
2. Créez un compte (Gratuit sans carte bancaire pour le début).
3. Cliquez **Create App** -> **GitHub**.
4. Choisissez le repo.
5. Dans "Builder", laissez **Node.js**.
6. Dans "Regions", choisissez **Frankfurt (Germany)**.
   > *C'est le secret pour avoir un ping de 20ms au lieu de 150ms aux USA.*
7. **Deploy**.

---

## 🏠 OPTION 3 : VOTRE PC (Le Roi du Ping)
Rappel : Rien ne battra jamais votre propre PC en terme de vitesse.
Si vous jouez avec des amis, utilisez la méthode **Ngrok** ou **Localtunnel** (`npx localtunnel --port 3000`).
C'est 0ms de latence pour vous, et le minimum physique pour vos amis.

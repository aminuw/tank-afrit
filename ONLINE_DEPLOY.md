# ☁️ COMMENT METTRE VOTRE JEU EN LIGNE (GRATUIT 24/7)

Vous voulez que votre jeu soit accessible tout le temps, sans laisser votre PC allumé, comme Agar.io ?
Il faut l'héberger sur un service Cloud compatible Node.js.

Voici la meilleure solution gratuite actuelle : **Render.com**.

## ÉTAPE 1 : Mettre votre code sur GitHub
1. Créez un compte sur [GitHub.com](https://github.com).
2. Créez un nouveau Repository (ex: `tank-brawler`).
3. Envoyez vos fichiers dessus (VSCode > Source Control > Publish to GitHub).

## ÉTAPE 2 : Créer le Serveur sur Render
1. Allez sur [Render.com](https://render.com) et créez un compte.
2. Cliquez sur **"New +"** -> **"Web Service"**.
3. Connectez votre compte GitHub et sélectionnez votre repo `tank-brawler`.
4. Remplissez les infos :
   - **Name**: `tank-battle` (ce sera `tank-battle.onrender.com`)
   - **Region**: Frankfurt (Allemagne) pour moins de lag.
   - **Branch**: `main` (ou master).
   - **Root Directory**: (Laissez vide).
   - **Runtime**: **Node**.
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Sélectionnez **Free**.
5. Cliquez sur **Create Web Service**.

## ÉTAPE 3 : JOUER !
Render va prendre quelques minutes pour installer et lancer votre serveur.
Une fois fini, vous aurez une URL du type : `https://xxxxx.onrender.com`.

Partagez ce lien. C'est tout !
Votre jeu est maintenant en ligne, accessible mondialement, H24.

---

### Alternative Rapide : Glitch.com
Si vous ne voulez pas utiliser GitHub :
1. Allez sur [Glitch.com](https://glitch.com).
2. Cliquez "New Project" -> "Import from GitHub" (ou Glitch Hello Node).
3. Copiez-collez vos fichiers (`server.js`, `index.html`, etc.) dans l'interface Glitch.
4. C'est en ligne instantanément.

# ✅ GUIDE DE TEST - CORRECTIONS

## 🎯 TEST 1 : SPAWN DES ENNEMIS

### Objectif
Vérifier que tous les ennemis apparaissent dans la map et ne restent jamais bloqués hors limites.

### Procédure
1. Lancer le jeu
2. Commencer une partie (n'importe quelle difficulté)
3. Observer l'apparition des ennemis

### ✅ Critères de Réussite
- [ ] Tous les ennemis apparaissent **visibles** à l'écran
- [ ] Aucun ennemi n'apparaît en dehors des limites
- [ ] Les ennemis apparaissent avec une marge de ~80px des bords
- [ ] La vague se termine toujours (compteur arrive à 0)
- [ ] Pas d'ennemis "fantômes" invisibles

### 🐛 Si ça ne marche pas
- Vérifier que `game.js` a bien été sauvegardé
- Rafraîchir la page (Ctrl+F5)
- Vérifier la console pour les erreurs

---

## 🔒 TEST 2 : COLLISION AVEC LA CAGE

### Objectif
Vérifier que le joueur ne peut pas traverser la cage du boss.

### Procédure
1. Lancer le jeu
2. Attendre que le boss apparaisse en cage (début de vague)
3. Essayer de traverser la cage dans toutes les directions :
   - Par le haut
   - Par le bas
   - Par la gauche
   - Par la droite
   - En diagonale

### ✅ Critères de Réussite
- [ ] Le joueur est **bloqué** par la cage
- [ ] Le joueur ne peut **pas traverser** la cage
- [ ] Le joueur est **repoussé** quand il touche la cage
- [ ] La collision est **fluide** (pas de glitches)
- [ ] Le joueur peut toujours **tirer** sur le boss en cage (invulnérable)

### 📝 Comportements Attendus
- **Avant libération** : Cage = mur solide
- **Pendant ouverture** : Cage = toujours solide
- **Après libération** : Cage disparaît, plus de collision

---

## 🎮 TEST 3 : GAMEPLAY COMPLET

### Objectif
Vérifier que le jeu fonctionne parfaitement de bout en bout.

### Procédure
1. Lancer le jeu
2. Jouer 2-3 vagues complètes
3. Observer tous les aspects du jeu

### ✅ Checklist Complète

#### Ennemis
- [ ] Apparaissent tous dans la map
- [ ] Se déplacent correctement
- [ ] Tirent sur le joueur
- [ ] Meurent quand leur HP atteint 0
- [ ] Aucun ennemi bloqué hors limites

#### Boss
- [ ] Apparaît en cage au début de la vague
- [ ] Message "⚠️ BOSS EN CAGE ⚠️" s'affiche
- [ ] Cage est visible et animée
- [ ] Boss est **invulnérable** en cage
- [ ] Message "INVULNÉRABLE" s'affiche si on tire dessus
- [ ] Compteur affiche "Ennemis: X 🔒"

#### Libération du Boss
- [ ] Quand tous les ennemis morts, cage tremble
- [ ] Animation d'ouverture (1 seconde)
- [ ] Messages "👑 BOSS VAGUE X 👑" et "LIBÉRÉ !"
- [ ] Slow-motion activé
- [ ] Boss devient **actif** et attaque
- [ ] Compteur affiche "Ennemis: 0 👑"

#### Collision Cage
- [ ] Joueur ne peut pas traverser la cage
- [ ] Collision fonctionne de tous les côtés
- [ ] Pas de glitches ou bugs visuels

#### Fin de Vague
- [ ] Boss vaincu = explosion massive
- [ ] Message "BOSS VAINCU! +XXX"
- [ ] Vague se termine
- [ ] Vie régénérée à 100%
- [ ] Vague suivante démarre

---

## 🔥 TEST 4 : STRESS TEST

### Objectif
Vérifier que le jeu reste stable même dans des conditions extrêmes.

### Procédure
1. Lancer en difficulté **PALMIERRRRR** 🌴💀
2. Jouer jusqu'à la vague 5+
3. Observer les performances

### ✅ Critères de Réussite
- [ ] FPS reste à ~60 (fluide)
- [ ] Pas de lag quand beaucoup d'ennemis
- [ ] Pas de ralentissement avec boss + ennemis
- [ ] Collision cage toujours fonctionnelle
- [ ] Tous les ennemis toujours dans la map

---

## 📊 RÉSULTATS ATTENDUS

### Avant les Corrections
❌ Ennemis parfois hors map  
❌ Vagues ne se terminaient pas  
❌ Joueur traversait la cage  
❌ Cage = décor sans collision  

### Après les Corrections
✅ Tous les ennemis dans la map  
✅ Vagues se terminent toujours  
✅ Collision cage solide  
✅ Gameplay parfait  

---

## 🎯 SI TOUT FONCTIONNE

**FÉLICITATIONS !** 🎉

Votre jeu est maintenant :
- ✅ **Sans bugs** de spawn
- ✅ **Avec collision** de cage réaliste
- ✅ **100% jouable** du début à la fin
- ✅ **Prêt pour le mode online** !

---

## 🚀 PROCHAINE ÉTAPE

Consultez `ONLINE_MODE_IDEAS.md` pour les propositions de mode multijoueur !

Le jeu est **INCROYABLE** ! 🔥👑🎮

# Modèle 3D du t-shirt

Déposer ici `tee.glb` : la section 3D de l'accueil l'utilise automatiquement à la place du tee généré.

- Un seul t-shirt, sans mannequin, idéalement blanc et oversize, en `.glb` (moins de 15 Mo).
- Le print (`assets/img/print-alpha.png`) est projeté sur la poitrine par le code : le modèle doit être vierge.

Réglages facultatifs dans `tee.json` :

```json
{ "rotateY": 3.1416, "color": "#f2f1ee", "printY": 0.30, "printX": -0.01, "printScale": 1 }
```

- `rotateY` : rotation (radians) si le dos du modèle fait face à la caméra (3.1416 = demi-tour).
- `color` : couleur forcée du tissu (remplace la texture du modèle).
- `printY` / `printX` : position du centre du print (fraction de la hauteur du tee, depuis le haut / depuis le centre).
- `printScale` : taille du print.

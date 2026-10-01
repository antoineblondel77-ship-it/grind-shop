# GRIND — thème WooCommerce

Maquette de boutique merch (Drop 001 — T-shirt Parental Advisory), DA inspirée du clip *GRIND*.

## Installation

1. Copier ce dossier dans `wp-content/themes/grind`.
2. Installer et activer WooCommerce.
3. Activer le thème **GRIND**, puis créer le produit (variable, attribut `Taille` : S → XXL).

Le contenu (produit, réglages WooCommerce) est en base de données et n'est pas versionné ici.

## Structure

- `front-page.php` — accueil (hero vidéo, drop, lookbook)
- `woocommerce.php` — boutique et fiche produit
- `assets/css/main.css` — tokens de couleurs/typo en haut du fichier
- `assets/js/main.js` — header, menu mobile, boutons de taille

## Démo en ligne

[Ouvrir dans WordPress Playground](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/antoineblondel77-ship-it/grind-shop/main/playground/blueprint.json) — WordPress + WooCommerce dans le navigateur, produit créé automatiquement (`playground/blueprint.json`). Chaque visite repart d'une copie neuve.

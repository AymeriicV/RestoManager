# PROJECT_STATE

Projet: Operyx
Date de reprise: 2026-05-13

## Objectif

Construire une plateforme SaaS restauration et ses clients mobiles, avec une base web principale et des applications natives de soutien.

## Etat

- Le web SaaS reste le coeur du produit.
- L'application Android générique est ajoutée sous [mobile/android](/home/RestoManager/mobile/android).
- L'architecture vise plusieurs instances Operyx, pas une instance unique.

## Priorites mobiles

1. Encapsuler le web proprement.
2. Gérer les impressions Bluetooth Android.
3. Préparer caméra, partages, notifications et stockage local.
4. Garder une UI premium, sombre, stable et rapide.

## Build Android

```bash
cd mobile/android
npm install
npx cap sync android
npx cap open android
```

## Validation cible

- ouverture de l'app Android
- configuration d'une URL d'instance
- affichage du site dans l'app
- scan Bluetooth des imprimantes appairées
- impression test HACCP


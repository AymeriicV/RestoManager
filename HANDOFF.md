# HANDOFF

## Etat actuel

- Le projet Operyx principal reste le web SaaS.
- Une nouvelle application Android générique est ajoutée sous [mobile/android](/home/RestoManager/mobile/android).
- L'app Android n'est pas liée à une seule instance: elle peut ouvrir n'importe quelle instance Operyx configurée par URL.

## Android

- App ID: `com.operyx.app`
- App Name: `Operyx`
- Shell web local premium dans `android/app/src/main/assets/public`
- Projet Android Studio compatible dans `mobile/android/android`
- Print Bluetooth: plugin natif `OpteryxPrinter`

## Ce qui doit rester stable

- Le site web actuel reste la source principale.
- Les futures instances doivent pouvoir être ouvertes depuis la même app Android.
- Les workflows du site ne doivent pas être dupliqués côté Android.

## Build

```bash
cd mobile/android
npm install
npx cap sync android
npx cap open android
```

## APK

- Debug APK: `mobile/android/android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: à signer dans Android Studio avant distribution privée.

## Prochaine reprise

- Tester le build Android Studio sur un appareil réel.
- Valider le scan Bluetooth et l'impression test sur une imprimante appairée.
- Étendre le flux d'impression à plusieurs marques si besoin client.

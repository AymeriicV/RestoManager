# Operyx Android

Application Android Capacitor pour Operyx.

Le principe:

- le projet web reste la source principale
- l'app Android embarque un shell premium
- chaque instance Operyx peut être renseignée dans l'app
- l'app ouvre le site dans une vue native pleine écran
- le Bluetooth imprimante est géré par un plugin natif Android

## Structure

- `android/` contient le projet Android Studio
- `android/app/src/main/assets/public/` contient le shell web local
- `capacitor.config.ts` relie Capacitor au projet

## Installation locale

Ouvre ce dossier dans Android Studio:

```text
mobile/android/android
```

Si Android Studio lance une configuration Java vide, sélectionne la configuration `Operyx Android` dans la barre du haut, puis relance `Run`.

```bash
cd mobile/android
npm install
npx cap sync android
npx cap open android
```

## Build APK debug

Dans Android Studio:

1. Ouvre `mobile/android/android`
2. Synchronise Gradle
3. Branche un téléphone Android
4. Lance `Run`

Ou en ligne de commande si le wrapper Gradle est généré par Android Studio ou déjà présent:

```bash
cd mobile/android/android
./gradlew assembleDebug
```

APK généré:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## Bluetooth impression

Le module natif `OperyxPrinter` fournit:

- scan des périphériques Bluetooth appairés
- sauvegarde de l'imprimante favorite
- impression d'une étiquette test DLC
- base d'abstraction pour ESC/POS et futurs constructeurs

## Pont vers le site

Le shell envoie aussi des événements `postMessage` au site chargé dans l'iframe:

- `operyx-mobile:ready`
- `operyx-mobile:navigation`
- `operyx-mobile:printer`
- `operyx-mobile:file-selected`

Le site consomme déjà la capture mobile pour le module factures et peut étendre le même pont à l'impression ou à d'autres raccourcis sans refaire l'UI Android.

## Écrans mobiles

Le shell inclut des modes rapides natifs pour:

- Planning
- Badgeuse
- HACCP
- Températures
- Factures / caméra

Ces écrans servent de raccourcis premium au-dessus du site principal et gardent l'expérience tactile simple sur Android.

## Remarques

- L'app fonctionne avec n'importe quelle instance Operyx.
- Pour chaque nouveau client, il suffit de saisir son URL d'instance.
- Les fonctionnalités iPhone restent à part; ici on cible Android Bluetooth natif.

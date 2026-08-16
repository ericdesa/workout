# Suivi Salle — application Angular personnelle

Application de suivi de séances de musculation, basée sur le programme
"Fitness Park débutant". Pensée pour un usage solo, sans compte ni backend :
toutes les données restent sur l'appareil (`localStorage`).

- **Mobile** → onglet "Séance" : choisir A/B/C, saisir les charges/répétitions
  de chaque exercice avec la dernière performance affichée en repère.
- **Desktop** → consultation de l'historique, du programme, des réglages.
- **Historique** → grille façon "contribution graph" GitHub (points verts =
  jour avec séance).
- **Réglages** → export du fichier JSON (partage natif vers l'app Mail sur
  mobile si disponible, sinon téléchargement à joindre manuellement) et
  import (fusion ou remplacement).

## Démarrer en local

```bash
npm install
npm start        # http://localhost:4200
```

## Build de production

```bash
npm run build
# fichiers générés dans dist/workout/browser
```

## Sauvegarde des données

Les données ne vivent que dans le `localStorage` du navigateur utilisé : si tu
changes de téléphone, réinstalles l'app, ou vides les données du site, elles
sont perdues. Pense à utiliser régulièrement **Réglages → Exporter** pour te
garder une copie (par email à toi-même, iCloud/Drive, etc.), et
**Réglages → Importer** pour la restaurer.

## Personnaliser le programme

Le programme (séances A/B/C, exercices, séries/reps/repos) est défini dans
`src/app/data/program.ts`. Modifie ce fichier si ton programme évolue.

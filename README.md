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
# fichiers générés dans dist/fitness-tracker/browser
```

## Déploiement sur GitHub Pages

Un workflow GitHub Actions est déjà présent :
`.github/workflows/deploy.yml`.

1. Crée un dépôt GitHub (par ex. `suivi-salle`) et pousse ce projet dessus :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<ton-user>/<ton-repo>.git
   git push -u origin main
   ```
2. Dans les réglages du dépôt GitHub → **Settings → Pages**, choisis
   **Source: GitHub Actions**.
3. Chaque push sur `main` relance automatiquement le build et publie le site
   (le workflow utilise `--base-href "/<nom-du-repo>/"`, donc aucune
   configuration manuelle n'est nécessaire).
4. L'URL sera de la forme `https://<ton-user>.github.io/<ton-repo>/`.

Le fichier `index.html` est dupliqué en `404.html` au moment du build : cela
permet aux routes Angular (`/historique`, `/session/...`, etc.) de fonctionner
même en rechargeant la page ou en y accédant directement, ce que GitHub Pages
ne gère pas nativement (pas de routing serveur).

## Sauvegarde des données

Les données ne vivent que dans le `localStorage` du navigateur utilisé : si tu
changes de téléphone, réinstalles l'app, ou vides les données du site, elles
sont perdues. Pense à utiliser régulièrement **Réglages → Exporter** pour te
garder une copie (par email à toi-même, iCloud/Drive, etc.), et
**Réglages → Importer** pour la restaurer.

## Personnaliser le programme

Le programme (séances A/B/C, exercices, séries/reps/repos) est défini dans
`src/app/data/program.ts`. Modifie ce fichier si ton programme évolue.

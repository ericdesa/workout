import { ProgramSeance } from '../models/fitness.model';

// Repris du classeur "Programme Fitness Park - débutant"
// Objectif : raffermissement / recomposition corporelle
// Fréquence : 3 séances / semaine, idéalement avec 1 jour de repos entre deux
// Échauffement : tapis 5-7 min à 5,5-6,5 km/h
// Note : "Arm extension" retiré du programme (douleur épaule gauche)

export const PROGRAM: ProgramSeance[] = [
  {
    code: 'A',
    label: 'Séance A',
    exercices: [
      { id: 'leg-press', nom: 'Leg press', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'low-row', nom: 'Low row', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'arm-curl', nom: 'Arm curl', series: 3, repsLabel: '10–12', reposLabel: '60–90 s' },
      { id: 'abductor', nom: 'Abductor', series: 3, repsLabel: '10–15', reposLabel: '60–90 s' },
      { id: 'prone-leg-curl', nom: 'Prone leg curl', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'total-abdominal', nom: 'Total abdominal', series: 2, repsLabel: '10–15', reposLabel: '60 s' },
      { id: 'tapis', nom: 'Tapis', type: 'cardio', series: 1, repsLabel: '5–10 min', reposLabel: '—' }
    ]
  },
  {
    code: 'B',
    label: 'Séance B',
    exercices: [
      { id: 'leg-press', nom: 'Leg press', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'tirage-vertical', nom: 'Tirage vertical poitrine', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'chest-press', nom: 'Chest press', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'abductor', nom: 'Abductor', series: 3, repsLabel: '10–15', reposLabel: '60–90 s' },
      { id: 'prone-leg-curl', nom: 'Prone leg curl', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'total-abdominal', nom: 'Total abdominal', series: 2, repsLabel: '10–15', reposLabel: '60 s' },
      { id: 'tapis', nom: 'Tapis', type: 'cardio', series: 1, repsLabel: '5–10 min', reposLabel: '—' }
    ]
  },
  {
    code: 'C',
    label: 'Séance C',
    exercices: [
      { id: 'leg-press', nom: 'Leg press', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'low-row', nom: 'Low row', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'chest-press', nom: 'Chest press', series: 3, repsLabel: '10–12', reposLabel: '90 s' },
      { id: 'arm-curl', nom: 'Arm curl', series: 3, repsLabel: '10–12', reposLabel: '60–90 s' },
      { id: 'abductor', nom: 'Abductor', series: 3, repsLabel: '10–15', reposLabel: '60–90 s' },
      { id: 'total-abdominal', nom: 'Total abdominal', series: 2, repsLabel: '10–15', reposLabel: '60 s' },
      { id: 'tapis', nom: 'Tapis', type: 'cardio', series: 1, repsLabel: '5–10 min', reposLabel: '—' }
    ]
  }
];

export const REGLES_PROGRESSION: { titre: string; texte: string }[] = [
  { titre: 'Facile', texte: 'Toutes les séries faciles et propres → augmenter légèrement la charge.' },
  { titre: 'Correct / difficile', texte: 'Garder la même charge et améliorer progressivement les répétitions.' },
  { titre: 'Très difficile', texte: 'Réduire la charge. Technique et amplitude avant le poids.' },
  { titre: 'Douleur articulaire', texte: "Arrêter l'exercice. Ne pas forcer à travers la douleur." },
  { titre: 'Récupération', texte: 'Idéalement 1 jour de repos entre les séances.' },
  { titre: 'Objectif', texte: 'Régularité et progression, pas épuisement systématique.' }
];

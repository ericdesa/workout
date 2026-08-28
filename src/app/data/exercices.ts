import { Exercise } from '../models/fitness.model';

export const EXERCICES_INITIAUX: Exercise[] = [
  { id: 'leg-press', nom: 'Leg press', type: 'musculation' },
  { id: 'low-row', nom: 'Low row', type: 'musculation' },
  { id: 'arm-curl', nom: 'Arm curl', type: 'musculation' },
  { id: 'abductor', nom: 'Abductor', type: 'musculation' },
  { id: 'prone-leg-curl', nom: 'Prone leg curl', type: 'musculation' },
  { id: 'total-abdominal', nom: 'Total abdominal', type: 'musculation' },
  { id: 'tirage-vertical', nom: 'Tirage vertical poitrine', type: 'musculation' },
  { id: 'chest-press', nom: 'Chest press', type: 'musculation' },
  { id: 'tapis', nom: 'Tapis', type: 'cardio' }
];

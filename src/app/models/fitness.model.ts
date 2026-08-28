export type ExerciseType = 'musculation' | 'cardio';

export interface Exercise {
  id: string;
  nom: string;
  type: ExerciseType;
}

export type Difficulte = 'facile' | 'correct' | 'difficile' | 'tres_difficile';

export const DIFFICULTE_LABELS: Record<Difficulte, string> = {
  facile: 'Facile',
  correct: 'Correct',
  difficile: 'Difficile',
  tres_difficile: 'Très difficile'
};

export interface MuscuSet {
  kg: number | null;
  reps: number | null;
}

export interface ExerciseLog {
  exerciceId: string;
  exerciceNom: string;
  type: ExerciseType;
  position: number | null; // position de l'appareil (nombre)
  sets: MuscuSet[]; // musculation : charge (kg) + répétitions
  distance: number | null; // cardio : en mètres
  dureeMin: number | null; // cardio : minutes
  dureeSec: number | null; // cardio : secondes
  difficulte: Difficulte | null;
  commentaire: string;
}

export interface SessionLog {
  id: string;
  date: string; // ISO yyyy-MM-dd
  exercices: ExerciseLog[];
  notes: string;
}

export interface FitnessData {
  version: 2;
  sessions: SessionLog[];
}

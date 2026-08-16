export type SeanceCode = 'A' | 'B' | 'C';

export interface ProgramExercise {
  id: string;
  nom: string;
  series: number;
  repsLabel: string;
  reposLabel: string;
}

export interface ProgramSeance {
  code: SeanceCode;
  label: string;
  exercices: ProgramExercise[];
}

export type Difficulte = 'facile' | 'correct' | 'difficile' | 'tres_difficile';

export const DIFFICULTE_LABELS: Record<Difficulte, string> = {
  facile: 'Facile',
  correct: 'Correct',
  difficile: 'Difficile',
  tres_difficile: 'Très difficile'
};

export interface SetEntry {
  kg: number | null;
  reps: number | null;
}

export interface ExerciseLog {
  exerciceId: string;
  exerciceNom: string;
  sets: SetEntry[];
  difficulte: Difficulte | null;
  douleur: boolean;
  commentaire: string;
}

export interface SessionLog {
  id: string;
  date: string; // ISO yyyy-MM-dd
  seanceCode: SeanceCode;
  exercices: ExerciseLog[];
  notes: string;
}

export interface FitnessData {
  version: 1;
  sessions: SessionLog[];
}

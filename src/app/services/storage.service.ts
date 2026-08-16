import { Injectable, signal } from '@angular/core';
import { FitnessData, SessionLog } from '../models/fitness.model';

const STORAGE_KEY = 'fitness_tracker_data_v1';

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly sessions = signal<SessionLog[]>(this.load().sessions);

  private load(): FitnessData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, sessions: [] };
      const parsed = JSON.parse(raw) as FitnessData;
      if (!parsed.sessions) return { version: 1, sessions: [] };
      return parsed;
    } catch {
      return { version: 1, sessions: [] };
    }
  }

  private persist(sessions: SessionLog[]): void {
    const data: FitnessData = { version: 1, sessions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.sessions.set(sessions);
  }

  saveSession(session: SessionLog): void {
    const current = this.sessions();
    const idx = current.findIndex((s) => s.id === session.id);
    const next = idx >= 0 ? [...current.slice(0, idx), session, ...current.slice(idx + 1)] : [...current, session];
    next.sort((a, b) => (a.date < b.date ? 1 : -1));
    this.persist(next);
  }

  deleteSession(id: string): void {
    this.persist(this.sessions().filter((s) => s.id !== id));
  }

  getSession(id: string): SessionLog | undefined {
    return this.sessions().find((s) => s.id === id);
  }

  /** Dernier log enregistré pour un exercice donné, avant une date/session donnée (exclue). */
  getLastExerciseLog(exerciceId: string, excludeSessionId?: string) {
    const sessions = this.sessions().filter((s) => s.id !== excludeSessionId);
    for (const session of sessions) {
      const found = session.exercices.find((e) => e.exerciceId === exerciceId);
      if (found) {
        return { date: session.date, log: found };
      }
    }
    return null;
  }

  exportJson(): string {
    const data: FitnessData = { version: 1, sessions: this.sessions() };
    return JSON.stringify(data, null, 2);
  }

  importJson(raw: string, mode: 'remplacer' | 'fusionner'): { ok: true; count: number } | { ok: false; error: string } {
    let parsed: FitnessData;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'Fichier JSON invalide.' };
    }
    if (!parsed || !Array.isArray(parsed.sessions)) {
      return { ok: false, error: "Le fichier ne contient pas de séances valides." };
    }
    if (mode === 'remplacer') {
      this.persist(parsed.sessions);
      return { ok: true, count: parsed.sessions.length };
    }
    const current = this.sessions();
    const byId = new Map(current.map((s) => [s.id, s]));
    for (const s of parsed.sessions) byId.set(s.id, s);
    const merged = Array.from(byId.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
    this.persist(merged);
    return { ok: true, count: parsed.sessions.length };
  }

  clearAll(): void {
    this.persist([]);
  }
}

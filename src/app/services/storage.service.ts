import { Injectable, signal } from '@angular/core';
import { Exercise, ExerciseLog, SessionLog } from '../models/fitness.model';
import { EXERCICES_INITIAUX } from '../data/exercices';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface LastPerformance {
  date: string;
  log: ExerciseLog;
  ago: number; // nombre de séances écoulées depuis
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly sessions = signal<SessionLog[]>([]);
  readonly exercices = signal<Exercise[]>([]);
  readonly sessionsLoaded = signal(false);

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  private uid(): string {
    const id = this.auth.userId;
    if (!id) throw new Error('Non authentifié');
    return id;
  }

  async loadSessions(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('sessions')
      .select('*')
      .eq('user_id', this.uid())
      .order('date', { ascending: false });
    if (error) throw error;
    this.sessions.set(
      (data ?? []).map((row: any) => ({
        id: row.id,
        date: row.date,
        exercices: row.exercices ?? [],
        notes: row.notes ?? ''
      }))
    );
    this.sessionsLoaded.set(true);
  }

  async loadExercices(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('exercices')
      .select('*')
      .eq('user_id', this.uid())
      .order('created_at', { ascending: true });
    if (error) throw error;
    let list: Exercise[] = (data ?? []).map((row: any) => ({
      id: row.id,
      nom: row.nom,
      type: row.type
    }));
    if (list.length === 0) {
      await this.seedExercices();
      list = EXERCICES_INITIAUX;
    }
    this.exercices.set(list);
  }

  private async seedExercices(): Promise<void> {
    const rows = EXERCICES_INITIAUX.map((e) => ({
      id: e.id,
      user_id: this.uid(),
      nom: e.nom,
      type: e.type,
      created_at: new Date().toISOString()
    }));
    const { error } = await this.supabase.client.from('exercices').insert(rows);
    if (error) throw error;
  }

  async addExercice(ex: Pick<Exercise, 'nom' | 'type'>): Promise<Exercise> {
    const id = 'ex-' + crypto.randomUUID().slice(0, 12);
    const { error } = await this.supabase.client.from('exercices').insert({
      id,
      user_id: this.uid(),
      nom: ex.nom,
      type: ex.type,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    const created: Exercise = { id, nom: ex.nom, type: ex.type };
    this.exercices.set([...this.exercices(), created]);
    return created;
  }

  async updateExercice(ex: Exercise): Promise<void> {
    const { error } = await this.supabase.client
      .from('exercices')
      .update({ nom: ex.nom, type: ex.type })
      .eq('id', ex.id)
      .eq('user_id', this.uid());
    if (error) throw error;
    this.exercices.set(this.exercices().map((e) => (e.id === ex.id ? ex : e)));
  }

  async deleteExercice(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('exercices')
      .delete()
      .eq('id', id)
      .eq('user_id', this.uid());
    if (error) throw error;
    this.exercices.set(this.exercices().filter((e) => e.id !== id));
  }

  async saveSession(session: SessionLog): Promise<void> {
    const { error } = await this.supabase.client.from('sessions').upsert(
      {
        id: session.id,
        user_id: this.uid(),
        date: session.date,
        exercices: session.exercices,
        notes: session.notes
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
    const current = this.sessions();
    const idx = current.findIndex((s) => s.id === session.id);
    const next =
      idx >= 0
        ? [...current.slice(0, idx), session, ...current.slice(idx + 1)]
        : [...current, session];
    next.sort((a, b) => (a.date < b.date ? 1 : -1));
    this.sessions.set(next);
  }

  async deleteSession(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', this.uid());
    if (error) throw error;
    this.sessions.set(this.sessions().filter((s) => s.id !== id));
  }

  getSession(id: string): SessionLog | undefined {
    return this.sessions().find((s) => s.id === id);
  }

  getLastPerformance(exerciceId: string, excludeSessionId?: string, beforeDate?: string): LastPerformance | null {
    const list = this.sessions().filter(
      (s) =>
        s.id !== excludeSessionId &&
        (beforeDate == null || s.date <= beforeDate)
    );
    for (let i = 0; i < list.length; i++) {
      const found = list[i].exercices.find((e) => e.exerciceId === exerciceId);
      if (found) {
        return { date: list[i].date, log: found, ago: i + 1 };
      }
    }
    return null;
  }

  exportJson(): string {
    const data = { version: 2, sessions: this.sessions() };
    return JSON.stringify(data, null, 2);
  }

  async importJson(
    raw: string,
    mode: 'remplacer' | 'fusionner'
  ): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
    let parsed: { version: number; sessions: SessionLog[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'Fichier JSON invalide.' };
    }
    if (!parsed || !Array.isArray(parsed.sessions)) {
      return { ok: false, error: "Le fichier ne contient pas de séances valides." };
    }

    if (mode === 'remplacer') {
      await this.supabase.client.from('sessions').delete().eq('user_id', this.uid());
    }

    const rows = parsed.sessions.map((s) => ({
      id: s.id,
      user_id: this.uid(),
      date: s.date,
      exercices: s.exercices,
      notes: s.notes
    }));

    const { error } = await this.supabase.client.from('sessions').upsert(rows, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };

    await this.loadSessions();
    return { ok: true, count: parsed.sessions.length };
  }

  async clearAll(): Promise<void> {
    const { error } = await this.supabase.client
      .from('sessions')
      .delete()
      .eq('user_id', this.uid());
    if (error) throw error;
    this.sessions.set([]);
  }
}

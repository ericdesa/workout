import { Injectable, signal } from '@angular/core';
import { SessionLog } from '../models/fitness.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly sessions = signal<SessionLog[]>([]);

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
        seanceCode: row.seance_code,
        exercices: row.exercices,
        notes: row.notes
      }))
    );
  }

  async saveSession(session: SessionLog): Promise<void> {
    const { error } = await this.supabase.client.from('sessions').upsert(
      {
        id: session.id,
        user_id: this.uid(),
        date: session.date,
        seance_code: session.seanceCode,
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
    const data = { version: 1, sessions: this.sessions() };
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
      seance_code: s.seanceCode,
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

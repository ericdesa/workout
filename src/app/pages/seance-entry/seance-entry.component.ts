import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorageService, LastPerformance } from '../../services/storage.service';
import { Difficulte, DIFFICULTE_LABELS, Exercise, ExerciseLog, ExerciseType, SessionLog, SetRow } from '../../models/fitness.model';

interface ExerciseFormRow {
  exerciceId: string;
  exerciceNom: string;
  type: ExerciseType;
  dernier: LastPerformance | null;
  position: number | null;
  sets: SetRow[];
  difficulte: Difficulte | null;
  commentaire: string;
}

@Component({
  selector: 'app-seance-entry',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './seance-entry.component.html',
  styleUrl: './seance-entry.component.scss'
})
export class SeanceEntryComponent implements OnDestroy {
  rows: ExerciseFormRow[] = [];
  notes = '';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  saveError = '';
  private sessionId = crypto.randomUUID();
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  readonly aujourdhui = new Date();
  readonly difficulteOptions: { value: Difficulte; label: string }[] = (
    Object.keys(DIFFICULTE_LABELS) as Difficulte[]
  ).map((value) => ({ value, label: DIFFICULTE_LABELS[value] }));

  constructor(private router: Router, private storage: StorageService) {}

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }

  get exercicesDisponibles(): Exercise[] {
    const usedIds = new Set(this.rows.map((r) => r.exerciceId));
    const list = this.storage.exercices().filter((e) => !usedIds.has(e.id));
    return [...list].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }

  lastPerf(ex: Exercise): LastPerformance | null {
    return this.storage.getLastPerformance(ex.id, this.sessionId);
  }

  perfResume(dernier: LastPerformance): string {
    const log = dernier.log;
    const sets = log.sets.filter((s) => this.setIsFilled(s));
    if (log.type === 'cardio') {
      const parts = sets.map((s) => {
        const bits = [
          s.distance != null ? `${s.distance} m` : null,
          s.dureeMin != null ? `${s.dureeMin} min${s.dureeSec ? ' ' + s.dureeSec + ' s' : ''}` : null
        ].filter(Boolean);
        return bits.join(' / ');
      });
      return parts.join(', ') || '—';
    }
    const setsTxt = sets.map((s) => `${s.kg ?? '?'}kg×${s.reps ?? '?'}`).join(', ');
    return setsTxt || '—';
  }

  setIsFilled(s: SetRow): boolean {
    return s.kg !== null || s.reps !== null || s.distance !== null || s.dureeMin !== null || s.dureeSec !== null;
  }

  agoLabel(ago: number): string {
    if (ago === 1) return 'il y a 1 séance';
    return `il y a ${ago} séances`;
  }

  optionLabel(ex: Exercise): string {
    const typeTxt = ex.type === 'musculation' ? 'Musculation' : 'Cardio';
    const dernier = this.lastPerf(ex);
    if (!dernier) return `${ex.nom} — ${typeTxt} — jamais fait`;
    return `${ex.nom} — ${typeTxt} — ${this.perfResume(dernier)} (${this.agoLabel(dernier.ago)})`;
  }

  scheduleAutoSave(): void {
    this.saveStatus = 'idle';
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.performAutoSave(), 2000);
  }

  private async performAutoSave(): Promise<void> {
    this.saveStatus = 'saving';
    try {
      await this.saveToSupabase();
      this.saveStatus = 'saved';
    } catch (e: any) {
      this.saveStatus = 'error';
      this.saveError = e?.message ?? 'Erreur réseau';
    }
  }

  private async saveToSupabase(): Promise<void> {
    const exercices: ExerciseLog[] = this.rows.map((r) => ({
      exerciceId: r.exerciceId,
      exerciceNom: r.exerciceNom,
      type: r.type,
      position: r.position,
      sets: r.sets.filter((s) => this.setIsFilled(s)),
      difficulte: r.difficulte,
      commentaire: r.commentaire.trim()
    }));

    const session: SessionLog = {
      id: this.sessionId,
      date: this.todayIso(),
      exercices,
      notes: this.notes.trim()
    };

    await this.storage.saveSession(session);
  }

  isDone(row: ExerciseFormRow): boolean {
    return row.sets.some((s) => this.setIsFilled(s));
  }

  ajouterExercice(id: string): void {
    const ex = this.storage.exercices().find((e) => e.id === id);
    if (!ex) return;
    const dernier = this.storage.getLastPerformance(ex.id, this.sessionId);
    const dernierSet = dernier?.log.sets.find((s) => this.setIsFilled(s));
    this.rows.push({
      exerciceId: ex.id,
      exerciceNom: ex.nom,
      type: ex.type,
      dernier,
      position: dernier?.log.position ?? null,
      sets: [{ ...(dernierSet ?? { kg: null, reps: null, distance: null, dureeMin: null, dureeSec: null }) }],
      difficulte: dernier?.log.difficulte ?? null,
      commentaire: ''
    });
    this.scheduleAutoSave();
  }

  supprimerExercice(index: number): void {
    this.rows.splice(index, 1);
    this.scheduleAutoSave();
  }

  ajouterSerie(row: ExerciseFormRow): void {
    const prev = row.sets.length ? row.sets[row.sets.length - 1] : null;
    row.sets.push({
      kg: prev?.kg ?? null,
      reps: prev?.reps ?? null,
      distance: prev?.distance ?? null,
      dureeMin: prev?.dureeMin ?? null,
      dureeSec: prev?.dureeSec ?? null
    });
    this.scheduleAutoSave();
  }

  retirerSerie(row: ExerciseFormRow, i: number): void {
    row.sets.splice(i, 1);
    this.scheduleAutoSave();
  }

  private todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async enregistrer(): Promise<void> {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.saveStatus = 'saving';
    try {
      await this.saveToSupabase();
      this.saveStatus = 'saved';
      this.router.navigate(['/session', this.sessionId]);
    } catch (e: any) {
      this.saveStatus = 'error';
      this.saveError = e?.message ?? 'Erreur réseau';
    }
  }
}

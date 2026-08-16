import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Difficulte, DIFFICULTE_LABELS, ExerciseLog, ExerciseType, SeanceCode, SessionLog } from '../../models/fitness.model';

interface ExerciseFormRow {
  exerciceId: string;
  exerciceNom: string;
  type: ExerciseType;
  repsLabel: string;
  seriesCible: number;
  reposLabel: string;
  dernier: { date: string; log: ExerciseLog } | null;
  sets: { kg: number | null; reps: number | null }[];
  distance: number | null;
  duration: number | null;
  difficulte: Difficulte | null;
  douleur: boolean;
  commentaire: string;
  custom?: boolean;
}

interface AddExercisePicker {
  mode: 'program' | 'custom';
  programExerciseId: string;
  customName: string;
  customType: ExerciseType;
  customSeries: number;
  customRepsLabel: string;
  customReposLabel: string;
}

@Component({
  selector: 'app-seance-entry',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './seance-entry.component.html',
  styleUrl: './seance-entry.component.css'
})
export class SeanceEntryComponent implements OnInit, OnDestroy {
  code: SeanceCode = 'A';
  label = '';
  rows: ExerciseFormRow[] = [];
  notes = '';
  showAddExercise = false;
  addPicker: AddExercisePicker = {
    mode: 'program',
    programExerciseId: '',
    customName: '',
    customType: 'musculation',
    customSeries: 3,
    customRepsLabel: '10–12',
    customReposLabel: '90 s'
  };
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  saveError = '';
  private sessionId = crypto.randomUUID();
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  readonly aujourdhui = new Date();
  readonly difficulteOptions: { value: Difficulte; label: string }[] = (
    Object.keys(DIFFICULTE_LABELS) as Difficulte[]
  ).map((value) => ({ value, label: DIFFICULTE_LABELS[value] }));

  private programExercices: { id: string; nom: string; type: ExerciseType; series: number; repsLabel: string; reposLabel: string }[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private storage: StorageService) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') as SeanceCode;
    const seance = this.storage.program().find((p) => p.code === code) ?? this.storage.program()[0];
    if (!seance) return;
    this.code = seance.code as SeanceCode;
    this.label = seance.label;
    this.programExercices = seance.exercices.map((ex) => ({
      id: ex.id,
      nom: ex.nom,
      type: ex.type ?? 'musculation',
      series: ex.series,
      repsLabel: ex.repsLabel,
      reposLabel: ex.reposLabel
    }));

    this.rows = seance.exercices.map((ex) => this.buildRow(ex));

    this.addPicker.programExerciseId = this.availableProgramExercises()[0]?.id ?? '';
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
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
      sets: r.type === 'musculation'
        ? r.sets.filter((s) => s.kg !== null || s.reps !== null)
        : [],
      distance: r.type === 'cardio' ? r.distance : undefined,
      duration: r.type === 'cardio' ? r.duration : undefined,
      difficulte: r.difficulte,
      douleur: r.douleur,
      commentaire: r.commentaire.trim()
    }));

    const session: SessionLog = {
      id: this.sessionId,
      date: this.todayIso(),
      seanceCode: this.code,
      exercices,
      notes: this.notes.trim()
    };

    await this.storage.saveSession(session);
  }

  isDone(row: ExerciseFormRow): boolean {
    if (row.type === 'cardio') {
      return row.distance != null || row.duration != null;
    }
    return row.sets.some((s) => s.kg != null || s.reps != null);
  }

  dernierResume(row: ExerciseFormRow): string {
    if (!row.dernier) return 'Pas encore fait';
    const d = new Date(row.dernier.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    if (row.type === 'cardio') {
      const dist = row.dernier.log.distance;
      const dur = row.dernier.log.duration;
      const parts = [
        dist != null ? `${dist} km` : null,
        dur != null ? `${dur} min` : null
      ].filter(Boolean);
      return `${d} — ${parts.join(', ') || '—'}`;
    }
    const sets = row.dernier.log.sets.filter((s) => s.kg !== null || s.reps !== null);
    const setsTxt = sets.map((s) => `${s.kg ?? '?'}kg×${s.reps ?? '?'}`).join(', ');
    return `${d} — ${setsTxt || '—'}`;
  }

  availableProgramExercises() {
    const usedIds = new Set(this.rows.map((r) => r.exerciceId));
    return this.programExercices.filter((pe) => !usedIds.has(pe.id));
  }

  toggleAddExercise(): void {
    this.showAddExercise = !this.showAddExercise;
    if (this.showAddExercise) {
      this.addPicker.programExerciseId = this.availableProgramExercises()[0]?.id ?? '';
      this.addPicker.customName = '';
    }
  }

  ajouterExercice(): void {
    if (this.addPicker.mode === 'program') {
      const pe = this.programExercices.find((e) => e.id === this.addPicker.programExerciseId);
      if (!pe) return;
      this.rows.push(this.buildRow(pe));
    } else {
      const name = this.addPicker.customName.trim();
      if (!name) return;
      this.rows.push(this.buildRow({
        id: `custom-${Date.now()}`,
        nom: name,
        type: this.addPicker.customType,
        series: this.addPicker.customType === 'cardio' ? 1 : this.addPicker.customSeries,
        repsLabel: this.addPicker.customType === 'cardio' ? '5–10 min' : this.addPicker.customRepsLabel,
        reposLabel: this.addPicker.customType === 'cardio' ? '—' : this.addPicker.customReposLabel
      }));
    }
    this.showAddExercise = false;
  }

  supprimerExercice(index: number): void {
    this.rows.splice(index, 1);
  }

  private buildRow(ex: { id: string; nom: string; type?: ExerciseType; series: number; repsLabel: string; reposLabel: string }): ExerciseFormRow {
    const type: ExerciseType = ex.type ?? 'musculation';
    const dernier = this.storage.getLastExerciseLog(ex.id);
    const dernierKg = dernier?.log.sets.find((s) => s.kg !== null)?.kg ?? null;
    return {
      exerciceId: ex.id,
      exerciceNom: ex.nom,
      type,
      repsLabel: ex.repsLabel,
      seriesCible: ex.series,
      reposLabel: ex.reposLabel,
      dernier,
      sets: type === 'musculation'
        ? Array.from({ length: ex.series }, () => ({ kg: dernierKg, reps: null }))
        : [],
      distance: null,
      duration: null,
      difficulte: null,
      douleur: false,
      commentaire: '',
      custom: ex.id.startsWith('custom-')
    };
  }

  ajouterSerie(row: ExerciseFormRow): void {
    const dernierKg = row.sets.length ? row.sets[row.sets.length - 1].kg : null;
    row.sets.push({ kg: dernierKg, reps: null });
  }

  retirerSerie(row: ExerciseFormRow, i: number): void {
    row.sets.splice(i, 1);
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

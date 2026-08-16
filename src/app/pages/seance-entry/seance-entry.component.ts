import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
}

@Component({
  selector: 'app-seance-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seance-entry.component.html',
  styleUrl: './seance-entry.component.css'
})
export class SeanceEntryComponent implements OnInit {
  code: SeanceCode = 'A';
  label = '';
  rows: ExerciseFormRow[] = [];
  notes = '';
  readonly aujourdhui = new Date();
  readonly difficulteOptions: { value: Difficulte; label: string }[] = (
    Object.keys(DIFFICULTE_LABELS) as Difficulte[]
  ).map((value) => ({ value, label: DIFFICULTE_LABELS[value] }));

  constructor(private route: ActivatedRoute, private router: Router, private storage: StorageService) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') as SeanceCode;
    const seance = this.storage.program().find((p) => p.code === code) ?? this.storage.program()[0];
    if (!seance) return;
    this.code = seance.code as SeanceCode;
    this.label = seance.label;

    this.rows = seance.exercices.map((ex) => {
      const dernier = this.storage.getLastExerciseLog(ex.id);
      const seriesCible = ex.series;
      const type: ExerciseType = ex.type ?? 'musculation';
      const dernierKg = dernier?.log.sets.find((s) => s.kg !== null)?.kg ?? null;
      return {
        exerciceId: ex.id,
        exerciceNom: ex.nom,
        type,
        repsLabel: ex.repsLabel,
        seriesCible,
        reposLabel: ex.reposLabel,
        dernier,
        sets: type === 'musculation'
          ? Array.from({ length: seriesCible }, () => ({ kg: dernierKg, reps: null }))
          : [],
        distance: null,
        duration: null,
        difficulte: null,
        douleur: false,
        commentaire: ''
      };
    });
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
      id: crypto.randomUUID(),
      date: this.todayIso(),
      seanceCode: this.code,
      exercices,
      notes: this.notes.trim()
    };

    await this.storage.saveSession(session);
    this.router.navigate(['/session', session.id]);
  }
}

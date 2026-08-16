import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { DIFFICULTE_LABELS, Difficulte, ExerciseLog, ExerciseType, ProgramExercise, SessionLog } from '../../models/fitness.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.css'
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  session: SessionLog | null = null;
  notFound = false;
  confirmDelete = false;
  showAddExercise = false;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  saveError = '';
  hasChanges = false;
  addPicker = {
    mode: 'program' as 'program' | 'custom',
    programExerciseId: '',
    customName: '',
    customType: 'musculation' as ExerciseType,
    customSeries: 3,
    customRepsLabel: '10–12',
    customReposLabel: '90 s'
  };
  private programExercices: ProgramExercise[] = [];
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  readonly difficulteLabels = DIFFICULTE_LABELS;
  readonly difficulteOptions: { value: Difficulte; label: string }[] = (
    Object.keys(DIFFICULTE_LABELS) as Difficulte[]
  ).map((value) => ({ value, label: DIFFICULTE_LABELS[value] }));

  constructor(private route: ActivatedRoute, private router: Router, private storage: StorageService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const found = this.storage.getSession(id);
    if (!found) {
      this.notFound = true;
      return;
    }
    this.session = JSON.parse(JSON.stringify(found));

    const seance = this.storage.program().find((p) => p.code === this.session!.seanceCode);
    this.programExercices = seance?.exercices ?? [];
    this.addPicker.programExerciseId = this.availableProgramExercises()[0]?.id ?? '';
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }

  scheduleAutoSave(): void {
    this.hasChanges = true;
    this.saveStatus = 'idle';
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.performAutoSave(), 2000);
  }

  private async performAutoSave(): Promise<void> {
    if (!this.session) return;
    this.saveStatus = 'saving';
    try {
      await this.storage.saveSession(this.session);
      this.saveStatus = 'saved';
      this.hasChanges = false;
    } catch (e: any) {
      this.saveStatus = 'error';
      this.saveError = e?.message ?? 'Erreur réseau';
    }
  }

  isDone(ex: ExerciseLog): boolean {
    if (this.isCardio(ex)) {
      return ex.distance != null || ex.duration != null;
    }
    return ex.sets.some((s) => s.kg != null || s.reps != null);
  }

  isCardio(ex: ExerciseLog): boolean {
    if (ex.exerciceId.startsWith('custom-')) {
      return ex.distance != null || ex.duration != null;
    }
    const allExercices = this.storage.program().flatMap((s) => s.exercices);
    const found = allExercices.find((e) => e.id === ex.exerciceId);
    return found?.type === 'cardio';
  }

  ajouterSerie(ex: SessionLog['exercices'][number]): void {
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({ kg: last?.kg ?? null, reps: null });
  }

  retirerSerie(ex: SessionLog['exercices'][number], i: number): void {
    ex.sets.splice(i, 1);
  }

  supprimerExercice(index: number): void {
    this.session!.exercices.splice(index, 1);
  }

  availableProgramExercises(): ProgramExercise[] {
    const usedIds = new Set(this.session!.exercices.map((e) => e.exerciceId));
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
      this.session!.exercices.push({
        exerciceId: pe.id,
        exerciceNom: pe.nom,
        sets: pe.type !== 'cardio' ? Array.from({ length: pe.series }, () => ({ kg: null, reps: null })) : [],
        difficulte: null,
        douleur: false,
        commentaire: ''
      });
    } else {
      const name = this.addPicker.customName.trim();
      if (!name) return;
      const isCardio = this.addPicker.customType === 'cardio';
      this.session!.exercices.push({
        exerciceId: `custom-${Date.now()}`,
        exerciceNom: name,
        sets: isCardio ? [] : Array.from({ length: this.addPicker.customSeries }, () => ({ kg: null, reps: null })),
        distance: isCardio ? null : undefined,
        duration: isCardio ? null : undefined,
        difficulte: null,
        douleur: false,
        commentaire: ''
      });
    }
    this.showAddExercise = false;
  }

  async enregistrer(): Promise<void> {
    if (!this.session) return;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.saveStatus = 'saving';
    try {
      await this.storage.saveSession(this.session);
      this.saveStatus = 'saved';
      this.hasChanges = false;
      this.router.navigate(['/historique']);
    } catch (e: any) {
      this.saveStatus = 'error';
      this.saveError = e?.message ?? 'Erreur réseau';
    }
  }

  async supprimer(): Promise<void> {
    if (!this.session) return;
    await this.storage.deleteSession(this.session.id);
    this.router.navigate(['/historique']);
  }

  dateLongue(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
}

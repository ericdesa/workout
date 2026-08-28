import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { DIFFICULTE_LABELS, Difficulte, ExerciseLog, Exercise, SessionLog } from '../../models/fitness.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.scss'
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  session: SessionLog | null = null;
  notFound = false;
  confirmDelete = false;
  showAddExercise = false;
  selectedToAdd = '';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  saveError = '';
  hasChanges = false;
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
    this.selectedToAdd = this.availableExercises()[0]?.id ?? '';
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
    return ex.sets.some((s) => s.kg !== null || s.reps !== null || s.distance !== null || s.dureeMin !== null || s.dureeSec !== null);
  }

  ajouterSerie(ex: ExerciseLog): void {
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({
      kg: last?.kg ?? null,
      reps: last?.reps ?? null,
      distance: last?.distance ?? null,
      dureeMin: last?.dureeMin ?? null,
      dureeSec: last?.dureeSec ?? null
    });
    this.scheduleAutoSave();
  }

  retirerSerie(ex: ExerciseLog, i: number): void {
    ex.sets.splice(i, 1);
    this.scheduleAutoSave();
  }

  supprimerExercice(index: number): void {
    this.session!.exercices.splice(index, 1);
    this.scheduleAutoSave();
  }

  availableExercises(): Exercise[] {
    const usedIds = new Set(this.session!.exercices.map((e) => e.exerciceId));
    const list = this.storage.exercices().filter((e) => !usedIds.has(e.id));
    return [...list].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }

  toggleAddExercise(): void {
    this.showAddExercise = !this.showAddExercise;
    if (this.showAddExercise) {
      this.selectedToAdd = this.availableExercises()[0]?.id ?? '';
    }
  }

  ajouterExercice(): void {
    const ex = this.storage.exercices().find((e) => e.id === this.selectedToAdd);
    if (!ex) return;
    const dernier = this.storage.getLastPerformance(ex.id, this.session!.id);
    const dernierSet = dernier?.log.sets.find(
      (s) => s.kg !== null || s.reps !== null || s.distance !== null || s.dureeMin !== null || s.dureeSec !== null
    );
    this.session!.exercices.push({
      exerciceId: ex.id,
      exerciceNom: ex.nom,
      type: ex.type,
      position: dernier?.log.position ?? null,
      sets: [dernierSet ? { ...dernierSet } : { kg: null, reps: null, distance: null, dureeMin: null, dureeSec: null }],
      difficulte: dernier?.log.difficulte ?? null,
      commentaire: ''
    });
    this.showAddExercise = false;
    this.scheduleAutoSave();
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

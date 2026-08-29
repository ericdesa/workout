import { Component, OnDestroy, effect, untracked, EffectRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService, LastPerformance } from '../../services/storage.service';
import { SessionContextService } from '../../services/session-context.service';
import {
  DIFFICULTE_LABELS,
  Difficulte,
  ExerciseLog,
  Exercise,
  SessionLog,
  SetRow,
} from '../../models/fitness.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.scss',
})
export class SessionDetailComponent implements OnDestroy {
  session: SessionLog | null = null;
  notFound = false;
  private initialized = false;
  private loadTriggered = false;
  private lookUpEffect: EffectRef;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private sessionContext: SessionContextService,
    private cdr: ChangeDetectorRef,
  ) {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.lookUpEffect = effect(() => {
      if (this.initialized) return;
      const loaded = this.storage.sessionsLoaded();
      if (!loaded && !this.loadTriggered) {
        this.loadTriggered = true;
        untracked(() => {
          this.storage.loadSessions().catch(() => {});
        });
        return;
      }
      if (!loaded) return;
      const list = this.storage.sessions();
      const found = list.find((s) => s.id === id);
      if (found) {
        this.initialized = true;
        untracked(() => {
          this.session = JSON.parse(JSON.stringify(found));
          this.cdr.detectChanges();
          this.selectedToAdd = this.availableExercises()[0]?.id ?? '';
          const session = this.session!;
          this.sessionContext.register((date) => {
            session.date = date;
            this.sessionContext.setDate(date);
            this.scheduleAutoSave();
          });
          this.sessionContext.setDate(session.date);
        });
      } else {
        this.initialized = true;
        untracked(() => {
          this.notFound = true;
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.lookUpEffect.destroy();
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.sessionContext.clear();
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
    return ex.sets.some(
      (s) =>
        s.kg !== null ||
        s.reps !== null ||
        s.distance !== null ||
        s.dureeMin !== null ||
        s.dureeSec !== null,
    );
  }

  dernierePerf(ex: ExerciseLog): LastPerformance | null {
    return this.storage.getLastPerformance(ex.exerciceId, this.session?.id, this.session?.date);
  }

  setIsFilled(s: SetRow): boolean {
    return (
      s.kg !== null ||
      s.reps !== null ||
      s.distance !== null ||
      s.dureeMin !== null ||
      s.dureeSec !== null
    );
  }

  perfResume(dernier: LastPerformance): string {
    const log = dernier.log;
    const sets = log.sets.filter((s) => this.setIsFilled(s));
    if (log.type === 'cardio') {
      const parts = sets.map((s) => {
        const bits = [
          s.distance != null ? `${s.distance} m` : null,
          s.dureeMin != null ? `${s.dureeMin} min${s.dureeSec ? ' ' + s.dureeSec + ' s' : ''}` : null,
        ].filter(Boolean);
        return bits.join(' / ');
      });
      return parts.join(', ') || '—';
    }
    const setsTxt = sets.map((s) => `${s.kg ?? '?'}kg×${s.reps ?? '?'}`).join(', ');
    return setsTxt || '—';
  }

  agoLabel(ago: number): string {
    if (ago === 1) return 'il y a 1 séance';
    return `il y a ${ago} séances`;
  }

  ajouterSerie(ex: ExerciseLog): void {
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({
      kg: last?.kg ?? null,
      reps: last?.reps ?? null,
      distance: last?.distance ?? null,
      dureeMin: last?.dureeMin ?? null,
      dureeSec: last?.dureeSec ?? null,
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
    const ex = this.storage
      .exercices()
      .find((e) => e.id === this.selectedToAdd);
    if (!ex) return;
    const dernier = this.storage.getLastPerformance(ex.id, this.session!.id, this.session!.date);
    const dernierSet = dernier?.log.sets.find(
      (s) =>
        s.kg !== null ||
        s.reps !== null ||
        s.distance !== null ||
        s.dureeMin !== null ||
        s.dureeSec !== null,
    );
    this.session!.exercices.push({
      exerciceId: ex.id,
      exerciceNom: ex.nom,
      type: ex.type,
      position: dernier?.log.position ?? null,
      sets: [
        dernierSet
          ? { ...dernierSet }
          : {
              kg: null,
              reps: null,
              distance: null,
              dureeMin: null,
              dureeSec: null,
            },
      ],
      difficulte: dernier?.log.difficulte ?? null,
      commentaire: '',
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
      this.router.navigate(['/accueil']);
    } catch (e: any) {
      this.saveStatus = 'error';
      this.saveError = e?.message ?? 'Erreur réseau';
    }
  }

  async supprimer(): Promise<void> {
    if (!this.session) return;
    await this.storage.deleteSession(this.session.id);
    this.router.navigate(['/accueil']);
  }
}

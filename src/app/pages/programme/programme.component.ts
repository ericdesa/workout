import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { PROGRAM, REGLES_PROGRESSION } from '../../data/program';
import { ProgramExercise, ProgramSeance, ExerciseType } from '../../models/fitness.model';

@Component({
  selector: 'app-programme',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './programme.component.html',
  styleUrl: './programme.component.scss'
})
export class ProgrammeComponent {
  readonly regles = REGLES_PROGRESSION;
  editing = signal(false);
  draft = signal<ProgramSeance[]>([]);
  saving = signal(false);
  message = signal<string | null>(null);

  constructor(private storage: StorageService) {}

  get program(): ProgramSeance[] {
    return this.storage.program();
  }

  startEditing(): void {
    this.draft.set(JSON.parse(JSON.stringify(this.program)));
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.message.set(null);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.storage.saveProgram(this.draft());
      this.editing.set(false);
      this.message.set('Programme enregistré.');
    } catch (e: any) {
      this.message.set('Erreur : ' + (e.message ?? e));
    } finally {
      this.saving.set(false);
    }
  }

  async resetToDefault(): Promise<void> {
    await this.storage.resetProgram();
    this.editing.set(false);
    this.message.set('Programme réinitialisé par défaut.');
  }

  addExercise(seanceIndex: number): void {
    const d = this.draft();
    const newEx: ProgramExercise = {
      id: 'ex-' + crypto.randomUUID().slice(0, 8),
      nom: 'Nouvel exercice',
      type: 'musculation',
      series: 3,
      repsLabel: '10–12',
      reposLabel: '90 s'
    };
    d[seanceIndex].exercices.push(newEx);
    this.draft.set([...d]);
  }

  moveExercise(seanceIndex: number, from: number, delta: -1 | 1): void {
    const d = this.draft();
    const exs = d[seanceIndex].exercices;
    const to = from + delta;
    if (to < 0 || to >= exs.length) return;
    const [item] = exs.splice(from, 1);
    exs.splice(to, 0, item);
    this.draft.set([...d]);
  }

  removeExercise(seanceIndex: number, exIndex: number): void {
    const d = this.draft();
    d[seanceIndex].exercices.splice(exIndex, 1);
    this.draft.set([...d]);
  }

  updateExercise(seanceIndex: number, exIndex: number, field: keyof ProgramExercise, value: any): void {
    const d = this.draft();
    (d[seanceIndex].exercices[exIndex] as any)[field] = value;
    this.draft.set([...d]);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private dragSeanceIndex = -1;
  private dragFromIndex = -1;

  onDragStart(event: DragEvent, seanceIndex: number, exIndex: number): void {
    this.dragSeanceIndex = seanceIndex;
    this.dragFromIndex = exIndex;
    const el = event.target as HTMLElement;
    el.closest('tr')!.classList.add('dragging');
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).closest('tr')!.classList.remove('dragging');
    this.dragSeanceIndex = -1;
    this.dragFromIndex = -1;
  }

  onDragOver(event: DragEvent, seanceIndex: number, exIndex: number): void {
    event.preventDefault();
    if (seanceIndex !== this.dragSeanceIndex) return;
    event.dataTransfer!.dropEffect = 'move';
    const tr = (event.target as HTMLElement).closest('tr')!;
    const rows = Array.from(tr.parentElement!.children) as HTMLElement[];
    rows.forEach((r) => r.classList.remove('drag-over-top', 'drag-over-bottom'));
    const rect = tr.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (event.clientY < mid) {
      tr.classList.add('drag-over-top');
    } else {
      tr.classList.add('drag-over-bottom');
    }
  }

  onDragLeave(event: DragEvent): void {
    const tr = (event.target as HTMLElement).closest('tr');
    tr?.classList.remove('drag-over-top', 'drag-over-bottom');
  }

  onDrop(event: DragEvent, seanceIndex: number, exIndex: number): void {
    event.preventDefault();
    const tr = (event.target as HTMLElement).closest('tr');
    tr?.classList.remove('drag-over-top', 'drag-over-bottom');
    if (seanceIndex !== this.dragSeanceIndex) return;

    const from = this.dragFromIndex;
    let to = exIndex;
    const rect = tr!.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (event.clientY > mid && to < from) to++;
    if (event.clientY < mid && to > from) to--;
    if (from === to) return;

    const d = this.draft();
    const exs = d[seanceIndex].exercices;
    const [item] = exs.splice(from, 1);
    exs.splice(to, 0, item);
    this.draft.set([...d]);
  }
}

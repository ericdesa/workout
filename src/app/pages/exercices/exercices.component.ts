import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { Exercise, ExerciseType } from '../../models/fitness.model';

interface EditingRow {
  id: string;
  nom: string;
  type: ExerciseType;
}

@Component({
  selector: 'app-exercices',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './exercices.component.html',
  styleUrl: './exercices.component.scss'
})
export class ExercicesComponent {
  readonly exercices = computed(() => {
    const list = this.storage.exercices();
    return [...list].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });

  readonly muscuCount = computed(() => this.exercices().filter((e) => e.type === 'musculation').length);
  readonly cardioCount = computed(() => this.exercices().filter((e) => e.type === 'cardio').length);

  readonly derniersIndicateurs = computed(() => {
    const sessions = this.storage.sessions().slice(0, 5);
    const map: Record<string, { emojis: string; dates: string }> = {};
    for (const ex of this.exercices()) {
      map[ex.id] = {
        emojis: sessions
          .map((s) =>
            s.exercices.some((e) => e.exerciceId === ex.id) ? '🟩' : '⬜',
          )
          .join(' '),
        dates: sessions.map((s) => this.dateCourte(s.date)).join(' · '),
      };
    }
    return map;
  });

  private dateCourte(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  newNom = '';
  newType: ExerciseType = 'musculation';
  editing = signal<EditingRow | null>(null);
  saving = signal(false);
  message = signal<string | null>(null);

  constructor(private storage: StorageService) {}

  async ajouter(): Promise<void> {
    const nom = this.newNom.trim();
    if (!nom) return;
    this.saving.set(true);
    try {
      await this.storage.addExercice({ nom, type: this.newType });
      this.newNom = '';
      this.message.set('Exercice ajouté.');
    } catch (e: any) {
      this.message.set('Erreur : ' + (e.message ?? e));
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(ex: Exercise): void {
    this.editing.set({ id: ex.id, nom: ex.nom, type: ex.type });
  }

  annulerEdit(): void {
    this.editing.set(null);
  }

  async saveEdit(): Promise<void> {
    const e = this.editing();
    if (!e) return;
    this.saving.set(true);
    try {
      await this.storage.updateExercice({ id: e.id, nom: e.nom.trim() || e.nom, type: e.type });
      this.editing.set(null);
      this.message.set('Exercice enregistré.');
    } catch (err: any) {
      this.message.set('Erreur : ' + (err.message ?? err));
    } finally {
      this.saving.set(false);
    }
  }

  async supprimer(ex: Exercise): Promise<void> {
    if (!confirm(`Supprimer l'exercice « ${ex.nom} » ?`)) return;
    try {
      await this.storage.deleteExercice(ex.id);
      this.message.set('Exercice supprimé.');
    } catch (err: any) {
      this.message.set('Erreur : ' + (err.message ?? err));
    }
  }
}

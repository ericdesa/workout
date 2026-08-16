import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { DIFFICULTE_LABELS, Difficulte, SessionLog } from '../../models/fitness.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.css'
})
export class SessionDetailComponent implements OnInit {
  session: SessionLog | null = null;
  notFound = false;
  confirmDelete = false;
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
  }

  ajouterSerie(ex: SessionLog['exercices'][number]): void {
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({ kg: last?.kg ?? null, reps: null });
  }

  retirerSerie(ex: SessionLog['exercices'][number], i: number): void {
    ex.sets.splice(i, 1);
  }

  async enregistrer(): Promise<void> {
    if (!this.session) return;
    await this.storage.saveSession(this.session);
    this.router.navigate(['/historique']);
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

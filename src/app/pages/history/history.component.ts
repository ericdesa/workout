import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { ContributionGraphComponent } from '../../components/contribution-graph/contribution-graph.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, ContributionGraphComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent {
  readonly year = signal(new Date().getFullYear());

  readonly activeDates = computed(() => new Set(this.storage.sessions().map((s) => s.date)));

  readonly sessions = computed(() => this.storage.sessions());

  readonly streak = computed(() => this.computeStreakSemaines());

  constructor(private storage: StorageService) {}

  changerAnnee(delta: number): void {
    this.year.update((y) => y + delta);
  }

  dateLongue(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  private computeStreakSemaines(): number {
    const sessions = this.storage.sessions();
    if (!sessions.length) return 0;
    const semaines = new Set(
      sessions.map((s) => {
        const d = new Date(s.date);
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        return `${d.getFullYear()}-${week}`;
      })
    );
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 104; i++) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-${week}`;
      if (semaines.has(key)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
}

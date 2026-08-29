import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { ContributionGraphComponent } from '../../components/contribution-graph/contribution-graph.component';

@Component({
  selector: 'app-seance-select',
  standalone: true,
  imports: [RouterLink, ContributionGraphComponent],
  templateUrl: './seance-select.component.html',
  styleUrl: './seance-select.component.scss',
})
export class SeanceSelectComponent {
  readonly sessions = computed(() => this.storage.sessions());

  readonly activeDates = computed(
    () => new Set(this.sessions().map((s) => s.date)),
  );

  readonly streak = computed(() => this.computeStreakSemaines());

  constructor(
    private storage: StorageService,
    private router: Router,
  ) {}

  nouvelleSeance(): void {
    this.router.navigate(['/seance']);
  }

  dateLongue(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private computeStreakSemaines(): number {
    const sessions = this.sessions();
    if (!sessions.length) return 0;
    const semaines = new Set(
      sessions.map((s) => {
        const d = new Date(s.date);
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) /
            7,
        );
        return `${d.getFullYear()}-${week}`;
      }),
    );
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 104; i++) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
      );
      const key = `${d.getFullYear()}-${week}`;
      if (semaines.has(key)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
}

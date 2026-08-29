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
}

import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-seance-select',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seance-select.component.html',
  styleUrl: './seance-select.component.scss'
})
export class SeanceSelectComponent {
  readonly dernieresSessions = computed(() => this.storage.sessions().slice(0, 5));

  readonly aujourdhui = new Date();

  constructor(private storage: StorageService, private router: Router) {}

  nouvelleSeance(): void {
    this.router.navigate(['/seance']);
  }

  dateCourte(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}

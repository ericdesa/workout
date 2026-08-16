import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { PROGRAM } from '../../data/program';
import { SeanceCode } from '../../models/fitness.model';

@Component({
  selector: 'app-seance-select',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seance-select.component.html',
  styleUrl: './seance-select.component.css'
})
export class SeanceSelectComponent {
  readonly program = PROGRAM;

  readonly derniereSeance = computed<SeanceCode | null>(() => {
    const sessions = this.storage.sessions();
    return sessions.length ? sessions[0].seanceCode : null;
  });

  readonly suggestion = computed<SeanceCode>(() => {
    const derniere = this.derniereSeance();
    if (!derniere) return 'A';
    const ordre: SeanceCode[] = ['A', 'B', 'C'];
    const idx = ordre.indexOf(derniere);
    return ordre[(idx + 1) % ordre.length];
  });

  readonly dernieresSessions = computed(() => this.storage.sessions().slice(0, 3));

  constructor(private storage: StorageService, private router: Router) {}

  demarrer(code: SeanceCode): void {
    this.router.navigate(['/seance', code]);
  }

  dateCourte(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}

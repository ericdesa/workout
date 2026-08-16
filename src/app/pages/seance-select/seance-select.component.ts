import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { SeanceCode } from '../../models/fitness.model';

@Component({
  selector: 'app-seance-select',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seance-select.component.html',
  styleUrl: './seance-select.component.css'
})
export class SeanceSelectComponent {
  readonly program = computed(() => this.storage.program());

  readonly derniereSeance = computed<SeanceCode | null>(() => {
    const sessions = this.storage.sessions();
    return sessions.length ? sessions[0].seanceCode : null;
  });

  readonly suggestion = computed(() => {
    const derniere = this.derniereSeance();
    const prog = this.program();
    if (!prog.length) return null;
    const codes = prog.map((p) => p.code as SeanceCode);
    if (!derniere) return codes[0];
    const idx = codes.indexOf(derniere);
    return codes[(idx + 1) % codes.length];
  });

  readonly dernieresSessions = computed(() => this.storage.sessions().slice(0, 3));

  constructor(private storage: StorageService, private router: Router) {}

  demarrer(code: string): void {
    this.router.navigate(['/seance', code]);
  }

  dateCourte(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}

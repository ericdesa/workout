import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import { SessionContextService } from './services/session-context.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly userEmail = computed(() => this.auth.user()?.email ?? null);
  readonly isSessionDetail = signal(false);
  readonly isReglages = signal(false);

  constructor(
    public auth: AuthService,
    private storage: StorageService,
    private router: Router,
    public sessionContext: SessionContextService,
  ) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isSessionDetail.set(/^\/session\/.+/.test(e.urlAfterRedirects));
        this.isReglages.set(/^\/reglages/.test(e.urlAfterRedirects));
      });

    this.auth['supabase'].client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await Promise.all([
            this.storage.loadSessions(),
            this.storage.loadExercices(),
          ]);
        } else {
          this.storage.sessions.set([]);
          this.storage.sessionsLoaded.set(false);
          this.storage.exercices.set([]);
          if (event === 'SIGNED_OUT') {
            this.router.navigate(['/login']);
          }
        }
      },
    );

    if (this.auth.isLoggedIn()) {
      this.storage.loadSessions();
      this.storage.loadExercices();
    }
  }

  goBack() {
    this.router.navigate(['/accueil']);
  }

  dateLongue(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  changeDate(value: string): void {
    this.sessionContext.changeDate(value);
  }
}

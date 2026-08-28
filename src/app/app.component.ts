import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly userEmail = computed(() => this.auth.user()?.email ?? null);

  constructor(
    public auth: AuthService,
    private storage: StorageService,
    private router: Router,
  ) {
    this.auth['supabase'].client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await Promise.all([
            this.storage.loadSessions(),
            this.storage.loadExercices(),
          ]);
        } else {
          this.storage.sessions.set([]);
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
}

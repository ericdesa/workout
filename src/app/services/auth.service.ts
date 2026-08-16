import { Injectable, signal, computed } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(true);
  private readonly _emailSent = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = computed(() => this._user());
  readonly loading = computed(() => this._loading());
  readonly emailSent = computed(() => this._emailSent());
  readonly error = computed(() => this._error());
  readonly isLoggedIn = computed(() => !!this._user());

  constructor(private supabase: SupabaseService) {
    this.supabase.client.auth.getSession().then(({ data: { session } }) => {
      this._user.set(session?.user ?? null);
      this._loading.set(false);
    });

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._user.set(session?.user ?? null);
      this._loading.set(false);
    });
  }

  async signIn(email: string): Promise<void> {
    this._error.set(null);
    this._emailSent.set(false);
    const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
    const { error } = await this.supabase.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}${baseHref}` }
    });
    if (error) {
      this._error.set(error.message);
    } else {
      this._emailSent.set(true);
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
  }

  get userId(): string | null {
    return this._user()?.id ?? null;
  }
}

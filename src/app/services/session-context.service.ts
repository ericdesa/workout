import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionContextService {
  readonly date = signal<string | null>(null);
  private onChange: ((date: string) => void) | null = null;

  register(onChange: (date: string) => void): void {
    this.onChange = onChange;
  }

  setDate(date: string | null): void {
    this.date.set(date);
  }

  changeDate(date: string): void {
    if (this.onChange) {
      this.onChange(date);
    } else {
      this.date.set(date);
    }
  }

  clear(): void {
    this.onChange = null;
    this.date.set(null);
  }
}

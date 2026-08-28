import { Injectable, signal, computed } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private readonly _updateAvailable = signal(false);

  readonly updateAvailable = computed(() => this._updateAvailable());

  constructor(private swUpdate: SwUpdate) {
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_DETECTED') {
        this.swUpdate.checkForUpdate();
      }
    });
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this._updateAvailable.set(true);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.forceUpdateCheck();
      }
    });
  }

  forceUpdateCheck(): void {
    this.swUpdate
      .checkForUpdate()
      .then((updateFound) => {
        if (updateFound) {
          this._updateAvailable.set(true);
        }
      })
      .catch(() => {
        // aucune mise à jour disponible ou hors ligne
      });
  }

  reload(): void {
    this.swUpdate.activateUpdate().then(() => window.location.reload());
  }
}

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideServiceWorker('ngsw-worker.js', { enabled: true }),
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
};

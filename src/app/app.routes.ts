import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  {
    path: 'accueil',
    loadComponent: () => import('./pages/seance-select/seance-select.component').then((m) => m.SeanceSelectComponent)
  },
  {
    path: 'seance/:code',
    loadComponent: () => import('./pages/seance-entry/seance-entry.component').then((m) => m.SeanceEntryComponent)
  },
  {
    path: 'historique',
    loadComponent: () => import('./pages/history/history.component').then((m) => m.HistoryComponent)
  },
  {
    path: 'session/:id',
    loadComponent: () => import('./pages/session-detail/session-detail.component').then((m) => m.SessionDetailComponent)
  },
  {
    path: 'programme',
    loadComponent: () => import('./pages/programme/programme.component').then((m) => m.ProgrammeComponent)
  },
  {
    path: 'reglages',
    loadComponent: () => import('./pages/reglages/reglages.component').then((m) => m.ReglagesComponent)
  },
  { path: '**', redirectTo: 'accueil' }
];

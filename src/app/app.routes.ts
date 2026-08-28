import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'debug',
    loadComponent: () => import('./pages/debug/debug.component').then((m) => m.DebugComponent)
  },
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  {
    path: 'accueil',
    loadComponent: () => import('./pages/seance-select/seance-select.component').then((m) => m.SeanceSelectComponent),
    canMatch: [authGuard]
  },
  {
    path: 'seance',
    loadComponent: () => import('./pages/seance-entry/seance-entry.component').then((m) => m.SeanceEntryComponent),
    canMatch: [authGuard]
  },
  {
    path: 'session/:id',
    loadComponent: () => import('./pages/session-detail/session-detail.component').then((m) => m.SessionDetailComponent),
    canMatch: [authGuard]
  },
  {
    path: 'reglages',
    loadComponent: () => import('./pages/reglages/reglages.component').then((m) => m.ReglagesComponent),
    canMatch: [authGuard]
  },
  { path: '**', redirectTo: 'accueil' }
];

import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-reglages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reglages.component.html',
  styleUrl: './reglages.component.css'
})
export class ReglagesComponent {
  readonly nbSessions = () => this.storage.sessions().length;
  message = signal<string | null>(null);
  confirmReset = false;
  modeImport: 'fusionner' | 'remplacer' = 'fusionner';

  constructor(private storage: StorageService) {}

  private fileName(): string {
    const d = new Date().toISOString().slice(0, 10);
    return `suivi-salle-${d}.json`;
  }

  async exporter(): Promise<void> {
    const json = this.storage.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], this.fileName(), { type: 'application/json' });

    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean; share?: (data: unknown) => Promise<void> };
    if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: 'Export suivi salle',
          text: 'Sauvegarde de mes séances de sport.'
        });
        this.message.set('Partage envoyé.');
        return;
      } catch {
        // l'utilisateur a annulé le partage, on retombe sur le téléchargement
      }
    }
    this.telecharger(blob);
    this.message.set('Fichier téléchargé. Tu peux le joindre à un email depuis ton application de messagerie.');
  }

  private telecharger(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName();
    a.click();
    URL.revokeObjectURL(url);
  }

  ouvrirEmail(): void {
    const subject = encodeURIComponent('Sauvegarde suivi salle');
    const body = encodeURIComponent(
      "Le fichier de sauvegarde a été téléchargé sur l'appareil. N'oublie pas de le joindre à cet email avant de l'envoyer."
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  onFichierChoisi(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = this.storage.importJson(String(reader.result), this.modeImport);
      if (result.ok) {
        this.message.set(`Import réussi : ${result.count} séance(s) traitée(s).`);
      } else {
        this.message.set(`Erreur : ${result.error}`);
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  reinitialiser(): void {
    this.storage.clearAll();
    this.confirmReset = false;
    this.message.set('Toutes les données ont été supprimées.');
  }
}

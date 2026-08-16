import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

interface DayCell {
  date: Date | null;
  iso: string | null;
  active: boolean;
  isFuture: boolean;
  isToday: boolean;
}

interface MonthLabel {
  name: string;
  col: number;
}

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const JOURS_COURT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

@Component({
  selector: 'app-contribution-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contribution-graph.component.html',
  styleUrl: './contribution-graph.component.css'
})
export class ContributionGraphComponent implements OnChanges {
  @Input() activeDates: Set<string> = new Set();
  @Input() year: number = new Date().getFullYear();

  days: DayCell[] = [];
  monthLabels: MonthLabel[] = [];
  totalCols = 0;
  readonly jours = JOURS_COURT;
  total = 0;

  ngOnChanges(): void {
    this.build();
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private build(): void {
    const jan1 = new Date(this.year, 0, 1);
    const paddingDays = jan1.getDay(); // 0 = dimanche
    const dec31 = new Date(this.year, 11, 31);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: DayCell[] = [];
    for (let i = 0; i < paddingDays; i++) {
      cells.push({ date: null, iso: null, active: false, isFuture: false, isToday: false });
    }

    let count = 0;
    const cursor = new Date(jan1);
    while (cursor <= dec31) {
      const iso = this.toIso(cursor);
      const isFuture = cursor.getTime() > today.getTime();
      const active = !isFuture && this.activeDates.has(iso);
      if (active) count++;
      cells.push({
        date: new Date(cursor),
        iso,
        active,
        isFuture,
        isToday: cursor.getTime() === today.getTime()
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    this.total = count;
    this.days = cells;
    this.totalCols = Math.ceil(cells.length / 7);

    const labels: MonthLabel[] = [];
    for (let m = 0; m < 12; m++) {
      const firstOfMonth = new Date(this.year, m, 1);
      const idx = paddingDays + Math.round((firstOfMonth.getTime() - jan1.getTime()) / 86400000);
      labels.push({ name: MOIS_COURT[m], col: Math.floor(idx / 7) + 1 });
    }
    this.monthLabels = labels;
  }

  tooltip(cell: DayCell): string {
    if (!cell.date) return '';
    const d = cell.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    return cell.active ? `${d} — séance ✅` : `${d} — pas de séance`;
  }
}

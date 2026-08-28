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
  imports: [],
  templateUrl: './contribution-graph.component.html',
  styleUrl: './contribution-graph.component.scss'
})
export class ContributionGraphComponent implements OnChanges {
  @Input() activeDates: Set<string> = new Set();

  days: DayCell[] = [];
  monthLabels: MonthLabel[] = [];
  totalCols = 0;
  readonly jours = JOURS_COURT;
  total = 0;
  intervalLabel = '';

  private endMonth = new Date();
  private today: Date = new Date();

  ngOnChanges(): void {
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.endMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.build();
  }

  naviguer(delta: number): void {
    this.endMonth.setMonth(this.endMonth.getMonth() + delta);
    this.build();
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private build(): void {
    const start = new Date(this.endMonth);
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);

    const paddingDays = start.getDay(); // 0 = dimanche
    const lastOfEnd = new Date(this.endMonth.getFullYear(), this.endMonth.getMonth() + 1, 0);

    const cells: DayCell[] = [];
    for (let i = 0; i < paddingDays; i++) {
      cells.push({ date: null, iso: null, active: false, isFuture: false, isToday: false });
    }

    let count = 0;
    const cursor = new Date(start);
    while (cursor <= lastOfEnd) {
      const iso = this.toIso(cursor);
      const isFuture = cursor.getTime() > this.today.getTime();
      const active = !isFuture && this.activeDates.has(iso);
      if (active) count++;
      cells.push({
        date: new Date(cursor),
        iso,
        active,
        isFuture,
        isToday: cursor.getTime() === this.today.getTime()
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    this.total = count;
    this.days = cells;
    this.totalCols = Math.ceil(cells.length / 7);

    const labels: MonthLabel[] = [];
    let m = start.getMonth();
    let year = start.getFullYear();
    for (let i = 0; i < 6; i++) {
      const firstOfMonth = new Date(year, m, 1);
      const idx = paddingDays + Math.round((firstOfMonth.getTime() - start.getTime()) / 86400000);
      labels.push({ name: MOIS_COURT[m], col: Math.floor(idx / 7) + 1 });
      m++;
      if (m > 11) {
        m = 0;
        year++;
      }
    }
    this.monthLabels = labels;

    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    this.intervalLabel = `${fmt(start)} – ${fmt(this.endMonth)}`;
  }

  tooltip(cell: DayCell): string {
    if (!cell.date) return '';
    const d = cell.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    return cell.active ? `${d} — séance ✅` : `${d} — pas de séance`;
  }
}

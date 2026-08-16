import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PROGRAM, REGLES_PROGRESSION } from '../../data/program';

@Component({
  selector: 'app-programme',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programme.component.html',
  styleUrl: './programme.component.css'
})
export class ProgrammeComponent {
  readonly program = PROGRAM;
  readonly regles = REGLES_PROGRESSION;
}

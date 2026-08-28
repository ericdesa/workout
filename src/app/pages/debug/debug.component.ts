import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SwUpdateService } from '../../services/sw-update.service';

@Component({
  selector: 'app-debug',
  standalone: true,
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss'
})
export class DebugComponent {
  readonly buildNumber = environment.buildNumber;
  readonly emailRedirectTo = environment.emailRedirectTo;
  readonly supabaseUrl = environment.supabaseUrl;

  constructor(public auth: AuthService, public sw: SwUpdateService) {}
}

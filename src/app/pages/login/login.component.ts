import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  otpCode = '';

  constructor(public auth: AuthService, private router: Router) {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.router.navigate(['/accueil']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.email.trim()) return;
    await this.auth.signIn(this.email.trim());
  }

  async onOtpSubmit(): Promise<void> {
    if (!this.email.trim() || !this.otpCode.trim()) return;
    await this.auth.verifyOtp(this.email.trim(), this.otpCode);
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NzButtonModule, NzInputModule],
  templateUrl: './register.component.html',
  styleUrl: './auth.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly notification = inject(NzNotificationService);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (group) => {
        const password = group.get('password')?.value;
        const confirmation = group.get('confirmPassword')?.value;
        return confirmation && password !== confirmation ? { passwordMismatch: true } : null;
      },
    },
  );
  loading = false;
  error = '';

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const { confirmPassword: _confirmation, ...request } = this.form.getRawValue();
    this.auth.register(request).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success('Registration successful', 'You can now sign in.');
        void this.router.navigate(['/login'], { queryParams: { registered: '1' } });
      },
      error: (response: HttpErrorResponse) => {
        this.loading = false;
        const validationErrors = response.error?.errors as Record<string, string[]> | undefined;
        this.error =
          response.error?.message ??
          Object.values(validationErrors ?? {}).flat()[0] ??
          (response.status === 409
            ? 'An account already uses this email.'
            : 'Unable to create the account.');
      },
    });
  }
}

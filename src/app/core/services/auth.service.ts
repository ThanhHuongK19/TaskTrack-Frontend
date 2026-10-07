import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Account,
  AuthenticationResponse,
  LoginRequest,
  RegisterRequest,
} from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly storedSession = this.readSession();

  private readonly accessToken = signal(this.storedSession?.token ?? null);
  readonly currentAccount = signal<Account | null>(this.storedSession?.account ?? null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  login(request: LoginRequest): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(`${this.apiUrl}/login`, request)
      .pipe(tap((session) => this.saveSession(session)));
  }

  register(request: RegisterRequest): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/register`, request);
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getCurrentUser(): Account | null {
    return this.currentAccount();
  }

  isAdmin(): boolean {
    return this.currentAccount()?.role === 1;
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/']);
  }

  handleUnauthorized(): void {
    const returnUrl = this.router.url;
    this.clearSession();
    if (!returnUrl.startsWith('/login') && !returnUrl.startsWith('/register')) {
      void this.router.navigate(['/login'], {
        queryParams: returnUrl.startsWith('/admin') ? { returnUrl } : undefined,
      });
    }
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.currentAccount.set(null);
    if (this.browser) localStorage.removeItem('tasktrack.session');
  }

  private saveSession(session: AuthenticationResponse): void {
    this.accessToken.set(session.token);
    this.currentAccount.set(session.account);
    if (this.browser) {
      localStorage.setItem('tasktrack.session', JSON.stringify(session));
    }
  }

  private readSession(): AuthenticationResponse | null {
    if (!this.browser) return null;
    try {
      const raw = localStorage.getItem('tasktrack.session');
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthenticationResponse;
      const encodedPayload = session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedPayload)) as { exp?: number };
      if (!payload.exp || payload.exp * 1000 <= Date.now()) {
        localStorage.removeItem('tasktrack.session');
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem('tasktrack.session');
      return null;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('zimshop_token'));
  isLoggedIn$ = this.loggedIn$.asObservable();
  get isLoggedIn(): boolean { return this.loggedIn$.value; }

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => { localStorage.setItem('zimshop_token', res.token); this.loggedIn$.next(true); }));
  }
  logout() { localStorage.removeItem('zimshop_token'); this.loggedIn$.next(false); }
}

import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { User } from '../../data/storage/user.model';

export type CurrentUser = Omit<User, 'password'>;

export interface LoginCredentials {
  login: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USERS_KEY = 'clinic_users';
  private readonly CURRENT_USER_KEY = 'clinic_current_user';

  private readonly currentUserState = signal<CurrentUser | null>(
    this.loadCurrentUser(),
  );

  readonly currentUser = this.currentUserState.asReadonly();

  login(credentials: LoginCredentials): Observable<CurrentUser> {
    const users = this.getUsers();

    const user = users.find(
      (item) =>
        item.username.toLowerCase() === credentials.login.toLowerCase() &&
        item.password === credentials.password,
    );

    if (!user) {
      return throwError(() => new Error('Неверный логин или пароль'));
    }

    const { password, ...safeUser } = user;

    return of(safeUser).pipe(
      delay(500),
      tap((currentUser) => {
        localStorage.setItem(
          this.CURRENT_USER_KEY,
          JSON.stringify(currentUser),
        );

        this.currentUserState.set(currentUser);
      }),
    );
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserState.set(null);
  }

  private loadCurrentUser(): CurrentUser | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as CurrentUser;
    } catch {
      localStorage.removeItem(this.CURRENT_USER_KEY);
      return null;
    }
  }

  private getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);

    if (!users) {
      return [];
    }

    try {
      return JSON.parse(users) as User[];
    } catch {
      return [];
    }
  }
}

export type UserRole = 'ADMIN' | 'DOCTOR';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  doctorId: string | null;
}

export type CurrentUser = Omit<User, 'password'>;
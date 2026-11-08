import { User } from '../user.model';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin123',
    fullName: 'Кристиано Роналдо1',
    role: 'ADMIN',
    doctorId: null,
  },
  {
    id: 'user-2',
    username: 'doctor',
    password: 'doctor123',
    fullName: 'Иванов Иван Иванович',
    role: 'DOCTOR',
    doctorId: 'doctor-1',
  },
];

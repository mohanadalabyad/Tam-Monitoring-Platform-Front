import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User } from '../auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    {
      id: '1',
      email: 'admin@tam.ps',
      name: 'مدير النظام',
      role: 'admin',
      status: 'active',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2025-01-15')
    },
    {
      id: '2',
      email: 'moderator@tam.ps',
      name: 'مشرف المحتوى',
      role: 'moderator',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-01-14')
    },
    {
      id: '3',
      email: 'viewer@tam.ps',
      name: 'مشاهد',
      role: 'viewer',
      status: 'active',
      createdAt: new Date('2024-02-01'),
      lastLogin: new Date('2025-01-13')
    },
    {
      id: '4',
      email: 'user2@tam.ps',
      name: 'مستخدم تجريبي',
      role: 'viewer',
      status: 'inactive',
      createdAt: new Date('2024-03-01'),
      lastLogin: new Date('2025-01-10')
    }
  ];

  constructor() {}

  getUsers(): Observable<User[]> {
    return of([...this.users]).pipe(delay(500));
  }

  getUserById(id: string): Observable<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return of(user).pipe(delay(300));
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): Observable<User> {
    const newUser: User = {
      ...userData,
      id: (this.users.length + 1).toString(),
      createdAt: new Date()
    };
    this.users.unshift(newUser);
    return of(newUser).pipe(delay(600));
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    this.users[index] = { ...this.users[index], ...userData };
    return of(this.users[index]).pipe(delay(500));
  }

  deleteUser(id: string): Observable<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    this.users.splice(index, 1);
    return of(undefined).pipe(delay(400));
  }
}

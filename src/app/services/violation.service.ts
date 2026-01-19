import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Violation } from '../models/violation.model';

@Injectable({
  providedIn: 'root'
})
export class ViolationService {
  private violations: Violation[] = [
    {
      id: '1',
      title: 'Illegal Construction',
      description: 'Unauthorized building construction without proper permits',
      category: 'Construction',
      location: 'Downtown Area, Main Street',
      reporterName: 'John Doe',
      reporterEmail: 'john@example.com',
      reporterPhone: '+970-123-4567',
      status: 'investigating',
      reportedDate: new Date('2025-12-01')
    },
    {
      id: '2',
      title: 'Environmental Pollution',
      description: 'Industrial waste dumping in public area',
      category: 'Environment',
      location: 'Industrial Zone, North District',
      reporterName: 'Jane Smith',
      reporterEmail: 'jane@example.com',
      status: 'pending',
      reportedDate: new Date('2025-12-05')
    },
    {
      id: '3',
      title: 'Traffic Violation',
      description: 'Blocked public road access',
      category: 'Traffic',
      location: 'City Center, Palestine Street',
      reporterName: 'Ahmad Hassan',
      reporterEmail: 'ahmad@example.com',
      reporterPhone: '+970-987-6543',
      status: 'resolved',
      reportedDate: new Date('2025-11-28')
    }
  ];

  constructor() { }

  getViolations(): Observable<Violation[]> {
    return of([...this.violations]).pipe(delay(500));
  }

  getViolationById(id: string): Observable<Violation | undefined> {
    const violation = this.violations.find(v => v.id === id);
    return of(violation).pipe(delay(300));
  }

  submitViolation(violation: Violation): Observable<Violation> {
    const newViolation: Violation = {
      ...violation,
      id: (this.violations.length + 1).toString(),
      status: 'pending',
      reportedDate: new Date()
    };
    this.violations.unshift(newViolation);
    return of(newViolation).pipe(delay(800));
  }

  getCategories(): string[] {
    return [
      'Construction',
      'Environment',
      'Traffic',
      'Public Safety',
      'Health',
      'Noise',
      'Other'
    ];
  }
}

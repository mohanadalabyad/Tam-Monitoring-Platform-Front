import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ExportColumnDefinition, ExportViolationRequest } from '../models/export-violation.model';

@Injectable({
  providedIn: 'root'
})
export class ExportViolationService {
  private apiUrl = `${environment.apiUrl}/ViolationExport`;

  constructor(private http: HttpClient) {}

  /**
   * Get available column definitions for the given violation type.
   */
  getAvailableColumns(violationType: 'Private' | 'Public'): Observable<ExportColumnDefinition[]> {
    const params = { violationType };
    return this.http.get<ExportColumnDefinition[]>(`${this.apiUrl}/columns`, { params });
  }

  /**
   * Export violations to Excel. Returns blob for file download.
   */
  exportViolations(request: ExportViolationRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, request, {
      responseType: 'blob'
    });
  }
}

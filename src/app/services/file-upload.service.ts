import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface FileUploadResponse {
  fileName: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = `${environment.apiUrl}/FileUpload`;

  constructor(private http: HttpClient) {}

  /**
   * Upload a single file
   * @param file File to upload
   * @returns Observable with file upload response containing fileName and url
   */
  uploadFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<FileUploadResponse>>(`${this.apiUrl}/upload`, formData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'فشل رفع الملف');
          }
          return response.data;
        })
      );
  }

  /**
   * Upload multiple files in parallel
   * @param files Array of files to upload
   * @returns Observable with array of file upload responses
   */
  uploadFiles(files: File[]): Observable<FileUploadResponse[]> {
    if (files.length === 0) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const uploadObservables = files.map(file => this.uploadFile(file));
    
    // Use forkJoin to upload all files in parallel
    return forkJoin(uploadObservables);
  }
}

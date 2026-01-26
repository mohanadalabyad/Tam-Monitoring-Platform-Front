import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { EducationLevelDto, AddEducationLevelDto, UpdateEducationLevelDto, EducationLevelFilter } from '../models/education-level.model';

@Injectable({
  providedIn: 'root'
})
export class EducationLevelService {
  private apiUrl = `${environment.apiUrl}/EducationLevel`;

  constructor(private http: HttpClient) {}

  /**
   * Get all education levels with optional pagination
   * For main management pages: pass isActive as undefined to get ALL education levels
   * For assignment contexts: pass isActive: true to get only active education levels
   */
  getAllEducationLevels(
    isActive?: boolean,
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<EducationLevelDto> | EducationLevelDto[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    if (pageNumber !== undefined) {
      params = params.set('pageNumber', pageNumber.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<ApiResponse<PaginationResponse<EducationLevelDto> | EducationLevelDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all education levels with filter
   */
  getAllEducationLevelsWithFilter(
    filter: EducationLevelFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<EducationLevelDto> | EducationLevelDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<EducationLevelDto> | EducationLevelDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get education level by ID
   */
  getEducationLevelById(id: number): Observable<EducationLevelDto> {
    return this.http.get<ApiResponse<EducationLevelDto>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Create a new education level
   */
  createEducationLevel(educationLevelData: AddEducationLevelDto): Observable<EducationLevelDto> {
    return this.http.post<ApiResponse<EducationLevelDto>>(this.apiUrl, educationLevelData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Update education level
   */
  updateEducationLevel(educationLevelData: UpdateEducationLevelDto): Observable<EducationLevelDto> {
    return this.http.put<ApiResponse<EducationLevelDto>>(this.apiUrl, educationLevelData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Delete an education level
   */
  deleteEducationLevel(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Toggle education level activity
   */
  toggleEducationLevelActivity(id: number): Observable<EducationLevelDto> {
    return this.http.post<ApiResponse<EducationLevelDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Get public lookup - all active education levels (no pagination, AllowAnonymous)
   */
  getPublicLookup(): Observable<ApiResponse<EducationLevelDto[]>> {
    return this.http.get<ApiResponse<EducationLevelDto[]>>(`${this.apiUrl}/public/lookup`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          // Ensure data is always an array
          if (Array.isArray(response.data)) {
            return response;
          }
          // If data is paginated, extract items
          if (response.data && typeof response.data === 'object' && 'items' in response.data) {
            return {
              ...response,
              data: (response.data as any).items || []
            };
          }
          return {
            ...response,
            data: []
          };
        })
      );
  }
}

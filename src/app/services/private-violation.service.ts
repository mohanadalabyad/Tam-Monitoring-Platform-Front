import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import {
  PrivateViolationDto,
  AddPrivateViolationDto,
  UpdatePrivateViolationDto,
  PrivateViolationFilter
} from '../models/violation.model';

@Injectable({
  providedIn: 'root'
})
export class PrivateViolationService {
  private apiUrl = `${environment.apiUrl}/PrivateViolation`;

  constructor(private http: HttpClient) {}

  /**
   * Get current user's violations (authenticated only)
   */
  getMyViolations(
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<PrivateViolationDto> | PrivateViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) {
      params = params.set('pageNumber', pageNumber.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<ApiResponse<PaginationResponse<PrivateViolationDto> | PrivateViolationDto[]>>(
      `${this.apiUrl}/my-violations`,
      { params }
    );
  }

  /**
   * Get all private violations with optional pagination (requires PrivateViolation.Read permission)
   */
  getAllPrivateViolations(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<PrivateViolationDto> | PrivateViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) {
      params = params.set('pageNumber', pageNumber.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<PaginationResponse<PrivateViolationDto> | PrivateViolationDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all private violations with filter (requires PrivateViolation.Read permission)
   */
  getAllPrivateViolationsWithFilter(
    filter: PrivateViolationFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<PrivateViolationDto> | PrivateViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<PrivateViolationDto> | PrivateViolationDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get private violation by ID (requires PrivateViolation.Read permission)
   */
  getPrivateViolationById(id: number): Observable<PrivateViolationDto> {
    return this.http.get<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${id}`)
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
   * Create private violation (requires PrivateViolation.Create permission)
   */
  createPrivateViolation(dto: AddPrivateViolationDto): Observable<PrivateViolationDto> {
    return this.http.post<ApiResponse<PrivateViolationDto>>(this.apiUrl, dto)
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
   * Update private violation (authenticated, only if Pending and user is creator)
   */
  updatePrivateViolation(dto: UpdatePrivateViolationDto): Observable<PrivateViolationDto> {
    return this.http.put<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${dto.id}`, dto)
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
   * Approve violation (requires PrivateViolation.Approve permission)
   */
  approveViolation(id: number): Observable<PrivateViolationDto> {
    return this.http.post<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${id}/approve`, {})
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
   * Reject violation (requires PrivateViolation.Reject permission)
   */
  rejectViolation(id: number): Observable<PrivateViolationDto> {
    return this.http.post<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${id}/reject`, {})
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
   * Publish violation (requires PrivateViolation.Publish permission)
   */
  publishViolation(id: number): Observable<PrivateViolationDto> {
    return this.http.post<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${id}/publish`, {})
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
   * Unpublish violation (requires PrivateViolation.Unpublish permission)
   */
  unpublishViolation(id: number): Observable<PrivateViolationDto> {
    return this.http.post<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${id}/unpublish`, {})
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
   * Delete private violation (requires PrivateViolation.Delete permission)
   */
  deletePrivateViolation(id: number): Observable<void> {
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
   * Toggle private violation activity (requires PrivateViolation.ToggleActivity permission)
   */
  togglePrivateViolationActivity(id: number): Observable<PrivateViolationDto> {
    return this.http.post<ApiResponse<PrivateViolationDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }
}

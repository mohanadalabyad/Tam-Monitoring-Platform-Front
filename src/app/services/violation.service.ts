import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import {
  ViolationDto,
  AddPublicViolationDto,
  AddPrivateViolationDto,
  UpdatePublicViolationDto,
  UpdatePrivateViolationDto,
  ViolationFilter
} from '../models/violation.model';

@Injectable({
  providedIn: 'root'
})
export class ViolationService {
  private apiUrl = `${environment.apiUrl}/Violation`;

  constructor(private http: HttpClient) {}

  /**
   * Create public violation (no auth required)
   */
  createPublicViolation(violationData: AddPublicViolationDto): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/public`, violationData)
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
   * Create private violation (auth required)
   */
  createPrivateViolation(violationData: AddPrivateViolationDto): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/private`, violationData)
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
   * Get all violations with optional pagination
   */
  getAllViolations(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<ViolationDto> | ViolationDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<ViolationDto> | ViolationDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all violations with filter
   */
  getAllViolationsWithFilter(
    filter: ViolationFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<ViolationDto> | ViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<ViolationDto> | ViolationDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get violation by ID (with full details)
   */
  getViolationById(id: number): Observable<ViolationDto> {
    return this.http.get<ApiResponse<ViolationDto>>(`${this.apiUrl}/${id}`)
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
   * Update public violation (no auth required, only if status is Pending)
   */
  updatePublicViolation(violationData: UpdatePublicViolationDto): Observable<ViolationDto> {
    return this.http.put<ApiResponse<ViolationDto>>(`${this.apiUrl}/public`, violationData)
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
   * Update private violation (auth required, only if status is Pending and user is creator)
   */
  updatePrivateViolation(violationData: UpdatePrivateViolationDto): Observable<ViolationDto> {
    return this.http.put<ApiResponse<ViolationDto>>(`${this.apiUrl}/private`, violationData)
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
   * @deprecated Use updatePublicViolation or updatePrivateViolation instead
   * Legacy method for backward compatibility
   */
  updateViolation(violationData: UpdatePrivateViolationDto): Observable<ViolationDto> {
    return this.updatePrivateViolation(violationData);
  }

  /**
   * Delete violation (soft delete)
   */
  deleteViolation(id: number): Observable<void> {
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
   * Toggle violation activity
   */
  toggleViolationActivity(id: number): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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
   * Approve violation
   */
  approveViolation(id: number): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/${id}/approve`, {})
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
   * Reject violation
   */
  rejectViolation(id: number): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/${id}/reject`, {})
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
   * Publish violation (must be approved first)
   */
  publishViolation(id: number): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/${id}/publish`, {})
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
   * Unpublish violation
   */
  unpublishViolation(id: number): Observable<ViolationDto> {
    return this.http.post<ApiResponse<ViolationDto>>(`${this.apiUrl}/${id}/unpublish`, {})
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
   * Get print view URL (public, no auth required)
   */
  getPrintViewUrl(id: number): string {
    return `${environment.apiUrl}/Violation/${id}/print`;
  }

  /**
   * Get print view HTML content
   */
  getPrintViewHtml(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${id}/print`, { responseType: 'text' });
  }
}

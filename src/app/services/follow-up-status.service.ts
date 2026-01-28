import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { FollowUpStatusDto, AddFollowUpStatusDto, UpdateFollowUpStatusDto, FollowUpStatusFilter } from '../models/follow-up-status.model';

@Injectable({
  providedIn: 'root'
})
export class FollowUpStatusService {
  private apiUrl = `${environment.apiUrl}/FollowUpStatus`;

  constructor(private http: HttpClient) {}

  /**
   * Get all follow-up statuses with optional pagination
   * For main management pages: pass isActive as undefined to get ALL statuses
   * For assignment contexts: pass isActive: true to get only active statuses
   */
  getAllFollowUpStatuses(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<FollowUpStatusDto> | FollowUpStatusDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<FollowUpStatusDto> | FollowUpStatusDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all follow-up statuses with filter
   */
  getAllFollowUpStatusesWithFilter(
    filter: FollowUpStatusFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<FollowUpStatusDto> | FollowUpStatusDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<FollowUpStatusDto> | FollowUpStatusDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get follow-up status by ID
   */
  getFollowUpStatusById(id: number): Observable<FollowUpStatusDto> {
    return this.http.get<ApiResponse<FollowUpStatusDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new follow-up status
   */
  createFollowUpStatus(statusData: AddFollowUpStatusDto): Observable<FollowUpStatusDto> {
    return this.http.post<ApiResponse<FollowUpStatusDto>>(this.apiUrl, statusData)
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
   * Update follow-up status
   */
  updateFollowUpStatus(statusData: UpdateFollowUpStatusDto): Observable<FollowUpStatusDto> {
    return this.http.put<ApiResponse<FollowUpStatusDto>>(this.apiUrl, statusData)
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
   * Delete a follow-up status
   */
  deleteFollowUpStatus(id: number): Observable<void> {
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
   * Toggle follow-up status activity
   */
  toggleFollowUpStatusActivity(id: number): Observable<FollowUpStatusDto> {
    return this.http.post<ApiResponse<FollowUpStatusDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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
   * Get public lookup - all active follow-up statuses (no pagination, AllowAnonymous)
   */
  getPublicLookup(): Observable<ApiResponse<FollowUpStatusDto[]>> {
    return this.http.get<ApiResponse<FollowUpStatusDto[]>>(`${this.apiUrl}/public-lookup`)
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

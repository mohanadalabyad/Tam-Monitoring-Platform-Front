import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { ViolationFollowUpDto, AddViolationFollowUpDto, UpdateViolationFollowUpDto, ViolationFollowUpFilter } from '../models/violation-follow-up.model';

@Injectable({
  providedIn: 'root'
})
export class ViolationFollowUpService {
  private apiUrl = `${environment.apiUrl}/ViolationFollowUp`;

  constructor(private http: HttpClient) {}

  /**
   * Get all follow-ups for a specific violation
   */
  getByViolationId(violationId: number, violationType: string): Observable<ApiResponse<ViolationFollowUpDto[]>> {
    return this.http.get<ApiResponse<ViolationFollowUpDto[]>>(
      `${this.apiUrl}/violation/${violationId}`,
      { params: new HttpParams().set('violationType', violationType) }
    );
  }

  /**
   * Get all violation follow-ups with optional pagination
   */
  getAllViolationFollowUps(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<ViolationFollowUpDto> | ViolationFollowUpDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<ViolationFollowUpDto> | ViolationFollowUpDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all violation follow-ups with filter
   */
  getAllViolationFollowUpsWithFilter(
    filter: ViolationFollowUpFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<ViolationFollowUpDto> | ViolationFollowUpDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<ViolationFollowUpDto> | ViolationFollowUpDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get violation follow-up by ID
   */
  getViolationFollowUpById(id: number): Observable<ViolationFollowUpDto> {
    return this.http.get<ApiResponse<ViolationFollowUpDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new violation follow-up
   */
  addFollowUp(dto: AddViolationFollowUpDto): Observable<ViolationFollowUpDto> {
    return this.http.post<ApiResponse<ViolationFollowUpDto>>(this.apiUrl, dto)
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
   * Update violation follow-up
   */
  updateFollowUp(dto: UpdateViolationFollowUpDto): Observable<ViolationFollowUpDto> {
    return this.http.put<ApiResponse<ViolationFollowUpDto>>(this.apiUrl, dto)
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
   * Delete a violation follow-up
   */
  deleteFollowUp(id: number): Observable<void> {
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
   * Toggle violation follow-up activity
   */
  toggleViolationFollowUpActivity(id: number): Observable<ViolationFollowUpDto> {
    return this.http.post<ApiResponse<ViolationFollowUpDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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

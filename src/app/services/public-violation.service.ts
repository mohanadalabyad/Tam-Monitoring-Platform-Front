import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import {
  PublicViolationDto,
  AddPublicViolationDto,
  UpdatePublicViolationDto,
  PublicViolationFilter
} from '../models/public-violation.model';

@Injectable({
  providedIn: 'root'
})
export class PublicViolationService {
  private apiUrl = `${environment.apiUrl}/PublicViolation`;

  constructor(private http: HttpClient) {}

  /**
   * Create public violation (no auth required)
   * Uses FormData with multipart/form-data for file uploads
   */
  createPublicViolation(
    cityId: number,
    categoryId: number,
    subCategoryId: number,
    violationType: number,
    violationDate: string,
    address: string,
    description: string,
    canContact: boolean,
    email: string | undefined,
    files: File[]
  ): Observable<PublicViolationDto> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('CityId', cityId.toString());
    formData.append('CategoryId', categoryId.toString());
    formData.append('SubCategoryId', subCategoryId.toString());
    formData.append('ViolationType', violationType.toString());
    formData.append('ViolationDate', violationDate);
    formData.append('Address', address);
    formData.append('Description', description);
    formData.append('CanContact', canContact.toString());
    
    if (email) {
      formData.append('Email', email);
    }
    
    // Append files (backend expects Files array)
    files.forEach(file => {
      formData.append('Files', file, file.name);
    });

    return this.http.post<ApiResponse<PublicViolationDto>>(this.apiUrl, formData)
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
   * Get public violation by ID
   */
  getPublicViolationById(id: number): Observable<PublicViolationDto> {
    return this.http.get<ApiResponse<PublicViolationDto>>(`${this.apiUrl}/${id}`)
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
   * Get all public violations with optional pagination
   */
  getAllPublicViolations(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<PublicViolationDto> | PublicViolationDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<PublicViolationDto> | PublicViolationDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all public violations with filter
   */
  getAllPublicViolationsWithFilter(
    filter: PublicViolationFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<PublicViolationDto> | PublicViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<PublicViolationDto> | PublicViolationDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Update description
   */
  updateDescription(id: number, description: string): Observable<PublicViolationDto> {
    return this.http.put<ApiResponse<PublicViolationDto>>(
      `${this.apiUrl}/${id}/description`,
      { description }
    )
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
   * Verify violation
   */
  verifyViolation(id: number): Observable<PublicViolationDto> {
    return this.http.post<ApiResponse<PublicViolationDto>>(`${this.apiUrl}/${id}/verify`, {})
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
   * Unverify violation
   */
  unverifyViolation(id: number): Observable<PublicViolationDto> {
    return this.http.post<ApiResponse<PublicViolationDto>>(`${this.apiUrl}/${id}/unverify`, {})
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
   * Publish violation
   */
  publishViolation(id: number): Observable<PublicViolationDto> {
    return this.http.post<ApiResponse<PublicViolationDto>>(`${this.apiUrl}/${id}/publish`, {})
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
  unpublishViolation(id: number): Observable<PublicViolationDto> {
    return this.http.post<ApiResponse<PublicViolationDto>>(`${this.apiUrl}/${id}/unpublish`, {})
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
   * Delete public violation (soft delete)
   */
  deletePublicViolation(id: number): Observable<void> {
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
   * Toggle public violation activity
   */
  togglePublicViolationActivity(id: number): Observable<PublicViolationDto> {
    return this.http.post<ApiResponse<PublicViolationDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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

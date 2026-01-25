import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import {
  PublishedViolationDto,
  PublishedViolationFilter
} from '../models/published-violation.model';

@Injectable({
  providedIn: 'root'
})
export class PublishedViolationService {
  private apiUrl = `${environment.apiUrl}/PublishedViolation`;

  constructor(private http: HttpClient) {}

  /**
   * Get all published violations (public endpoint, no auth required)
   */
  getAllPublishedViolations(
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<PublishedViolationDto> | PublishedViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) {
      params = params.set('pageNumber', pageNumber.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<ApiResponse<PaginationResponse<PublishedViolationDto> | PublishedViolationDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all published violations with filter (public endpoint, no auth required)
   */
  getAllPublishedViolationsWithFilter(
    filter: PublishedViolationFilter,
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<PublishedViolationDto> | PublishedViolationDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());

    return this.http.post<ApiResponse<PaginationResponse<PublishedViolationDto> | PublishedViolationDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get published violation by ID and type (public endpoint, no auth required)
   * @param id Violation ID
   * @param violationType "Public" or "Private"
   */
  getPublishedViolationById(id: number, violationType: string): Observable<PublishedViolationDto> {
    return this.http.get<ApiResponse<PublishedViolationDto>>(
      `${this.apiUrl}/${violationType}/${id}`
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
}

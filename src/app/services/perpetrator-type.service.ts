import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import {
  PerpetratorTypeDto,
  AddPerpetratorTypeDto,
  UpdatePerpetratorTypeDto,
  PerpetratorTypeFilter
} from '../models/perpetrator-type.model';

@Injectable({
  providedIn: 'root'
})
export class PerpetratorTypeService {
  private apiUrl = `${environment.apiUrl}/PerpetratorType`;

  constructor(private http: HttpClient) {}

  getAllPerpetratorTypes(
    isActive?: boolean,
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<PerpetratorTypeDto> | PerpetratorTypeDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<PerpetratorTypeDto> | PerpetratorTypeDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  getAllPerpetratorTypesWithFilter(
    filter: PerpetratorTypeFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<PerpetratorTypeDto> | PerpetratorTypeDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<PerpetratorTypeDto> | PerpetratorTypeDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  getPerpetratorTypeById(id: number): Observable<PerpetratorTypeDto> {
    return this.http.get<ApiResponse<PerpetratorTypeDto>>(`${this.apiUrl}/${id}`).pipe(
      map((response: ApiResponse<PerpetratorTypeDto>) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      })
    );
  }

  createPerpetratorType(dto: AddPerpetratorTypeDto): Observable<PerpetratorTypeDto> {
    return this.http.post<ApiResponse<PerpetratorTypeDto>>(this.apiUrl, dto).pipe(
      map((response: ApiResponse<PerpetratorTypeDto>) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      })
    );
  }

  /** Backend expects PUT api/PerpetratorType (no id in path) with dto in body. */
  updatePerpetratorType(dto: UpdatePerpetratorTypeDto): Observable<PerpetratorTypeDto> {
    return this.http.put<ApiResponse<PerpetratorTypeDto>>(this.apiUrl, dto).pipe(
      map((response: ApiResponse<PerpetratorTypeDto>) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      })
    );
  }

  deletePerpetratorType(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map((response: ApiResponse<void>) => {
        if (!response.success) {
          throw new Error(response.message);
        }
      })
    );
  }

  togglePerpetratorTypeActivity(id: number): Observable<PerpetratorTypeDto> {
    return this.http.post<ApiResponse<PerpetratorTypeDto>>(`${this.apiUrl}/${id}/toggle-activity`, {}).pipe(
      map((response: ApiResponse<PerpetratorTypeDto>) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      })
    );
  }

  /**
   * Public lookup - active perpetrator types filtered by categoryId (same pattern as subcategory).
   * Call with the selected category ID to get perpetrator types for that category.
   */
  getPublicLookup(categoryId?: number): Observable<ApiResponse<PerpetratorTypeDto[]>> {
    let params = new HttpParams();
    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId.toString());
    }
    params = params.set('isActive', 'true');

    return this.http.get<ApiResponse<PerpetratorTypeDto[]>>(`${this.apiUrl}/public/lookup`, { params }).pipe(
      map(response => {
        if (!response.success) {
          return response;
        }
        if (Array.isArray(response.data)) {
          return response;
        }
        if (response.data && typeof response.data === 'object' && 'items' in response.data) {
          return {
            ...response,
            data: (response.data as any).items || []
          };
        }
        return { ...response, data: [] };
      })
    );
  }

  /** Alias for components that call delete(id). */
  delete(id: number): Observable<void> {
    return this.deletePerpetratorType(id);
  }

  /** Alias for components that call update(dto). */
  update(dto: UpdatePerpetratorTypeDto): Observable<PerpetratorTypeDto> {
    return this.updatePerpetratorType(dto);
  }

  /** Alias for components that call create(dto). */
  create(dto: AddPerpetratorTypeDto): Observable<PerpetratorTypeDto> {
    return this.createPerpetratorType(dto);
  }

  /** Alias for components that call toggleActivity(id). */
  toggleActivity(id: number): Observable<PerpetratorTypeDto> {
    return this.togglePerpetratorTypeActivity(id);
  }
}

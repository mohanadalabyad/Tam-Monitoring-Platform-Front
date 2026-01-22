import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { SubCategoryDto, AddSubCategoryDto, UpdateSubCategoryDto, SubCategoryFilter } from '../models/subcategory.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private apiUrl = `${environment.apiUrl}/subcategory`;

  constructor(private http: HttpClient) {}

  /**
   * Get all subcategories with optional pagination
   * For main management pages: pass isActive as undefined to get ALL subcategories
   * For assignment contexts: pass isActive: true to get only active subcategories
   */
  getAllSubCategories(
    isActive?: boolean,
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<SubCategoryDto> | SubCategoryDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<SubCategoryDto> | SubCategoryDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all subcategories with filter
   */
  getAllSubCategoriesWithFilter(
    filter: SubCategoryFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<SubCategoryDto> | SubCategoryDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<SubCategoryDto> | SubCategoryDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get subcategory by ID
   */
  getSubCategoryById(id: number): Observable<SubCategoryDto> {
    return this.http.get<ApiResponse<SubCategoryDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new subcategory
   */
  createSubCategory(subCategoryData: AddSubCategoryDto): Observable<SubCategoryDto> {
    return this.http.post<ApiResponse<SubCategoryDto>>(this.apiUrl, subCategoryData)
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
   * Update subcategory
   */
  updateSubCategory(subCategoryData: UpdateSubCategoryDto): Observable<SubCategoryDto> {
    return this.http.put<ApiResponse<SubCategoryDto>>(this.apiUrl, subCategoryData)
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
   * Delete a subcategory
   */
  deleteSubCategory(id: number): Observable<void> {
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
   * Toggle subcategory activity
   */
  toggleSubCategoryActivity(id: number): Observable<SubCategoryDto> {
    return this.http.post<ApiResponse<SubCategoryDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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

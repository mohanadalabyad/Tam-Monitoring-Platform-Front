import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { CategoryDto, AddCategoryDto, UpdateCategoryDto, CategoryFilter } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/category`;

  constructor(private http: HttpClient) {}

  /**
   * Get all categories with optional pagination
   * For main management pages: pass isActive as undefined to get ALL categories
   * For assignment contexts: pass isActive: true to get only active categories
   */
  getAllCategories(
    isActive?: boolean,
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<CategoryDto> | CategoryDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<CategoryDto> | CategoryDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all categories with filter
   */
  getAllCategoriesWithFilter(
    filter: CategoryFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<CategoryDto> | CategoryDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<CategoryDto> | CategoryDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: number): Observable<CategoryDto> {
    return this.http.get<ApiResponse<CategoryDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new category
   */
  createCategory(categoryData: AddCategoryDto): Observable<CategoryDto> {
    return this.http.post<ApiResponse<CategoryDto>>(this.apiUrl, categoryData)
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
   * Update category
   */
  updateCategory(categoryData: UpdateCategoryDto): Observable<CategoryDto> {
    return this.http.put<ApiResponse<CategoryDto>>(this.apiUrl, categoryData)
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
   * Delete a category
   */
  deleteCategory(id: number): Observable<void> {
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
   * Toggle category activity
   */
  toggleCategoryActivity(id: number): Observable<CategoryDto> {
    return this.http.post<ApiResponse<CategoryDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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
   * Get public lookup - all active categories (no pagination, AllowAnonymous)
   */
  getPublicLookup(): Observable<ApiResponse<CategoryDto[]>> {
    return this.http.get<ApiResponse<CategoryDto[]>>(`${this.apiUrl}/public/lookup`)
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

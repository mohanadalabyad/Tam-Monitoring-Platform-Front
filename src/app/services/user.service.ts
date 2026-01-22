import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { UserDto, AddUserDto, UpdateUserDto, ChangePasswordDto, UserFilter } from '../models/user-management.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users with optional pagination and filters
   * For main management pages: pass isActive as undefined to get ALL users
   * For assignment contexts: pass isActive: true to get only active users
   */
  getAllUsers(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<UserDto> | UserDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<ApiResponse<PaginationResponse<UserDto> | UserDto[]>>(this.apiUrl, { params });
  }

  /**
   * Get all users with filter
   */
  getAllUsersWithFilter(
    filter: UserFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<UserDto> | UserDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<UserDto> | UserDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<UserDto> {
    return this.http.get<ApiResponse<UserDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new user
   */
  createUser(userData: AddUserDto): Observable<UserDto> {
    return this.http.post<ApiResponse<UserDto>>(this.apiUrl, userData)
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
   * Update an existing user
   */
  updateUser(userData: UpdateUserDto): Observable<UserDto> {
    return this.http.put<ApiResponse<UserDto>>(this.apiUrl, userData)
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
   * Delete a user
   */
  deleteUser(id: string): Observable<void> {
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
   * Toggle user activity (activate/deactivate)
   */
  toggleUserActivity(id: string): Observable<UserDto> {
    return this.http.post<ApiResponse<UserDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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
   * Change user password
   */
  changePassword(passwordData: ChangePasswordDto): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/change-password`, passwordData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }
}

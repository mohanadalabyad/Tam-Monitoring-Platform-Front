import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  PermissionDto,
  UpdatePermissionDto,
  PermissionFilter,
  AssignPermissionToRoleDto,
  UnassignPermissionFromRoleDto
} from '../models/permission.model';
import { PaginationResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionApiService {
  private apiUrl = `${environment.apiUrl}/permission`;

  constructor(private http: HttpClient) {}

  /**
   * Get all permissions with optional pagination and filters
   */
  getAllPermissions(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<PaginationResponse<PermissionDto> | PermissionDto[]> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<ApiResponse<PermissionDto[] | PaginationResponse<PermissionDto>>>(
      this.apiUrl,
      { params }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      })
    );
  }

  /**
   * Get all permissions with filter
   */
  getAllPermissionsWithFilter(
    filter: PermissionFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<PaginationResponse<PermissionDto> | PermissionDto[]> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PermissionDto[] | PaginationResponse<PermissionDto>>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      })
    );
  }

  /**
   * Get permission by ID
   */
  getPermissionById(id: number): Observable<PermissionDto> {
    return this.http.get<ApiResponse<PermissionDto>>(`${this.apiUrl}/${id}`)
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
   * Update permission display name
   */
  updatePermission(permissionData: UpdatePermissionDto): Observable<PermissionDto> {
    return this.http.put<ApiResponse<PermissionDto>>(this.apiUrl, permissionData)
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
   * Assign permission to role
   */
  assignPermissionToRole(roleId: string, permissionId: number): Observable<void> {
    const dto: AssignPermissionToRoleDto = { roleId, permissionId };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/assign-to-role`, dto)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Unassign permission from role
   */
  unassignPermissionFromRole(roleId: string, permissionId: number): Observable<void> {
    const dto: UnassignPermissionFromRoleDto = { roleId, permissionId };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/unassign-from-role`, dto)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Get permissions by role
   */
  getPermissionsByRole(roleId: string): Observable<PermissionDto[]> {
    return this.http.get<ApiResponse<PermissionDto[]>>(`${this.apiUrl}/by-role/${roleId}`)
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
   * Toggle permission activity
   */
  togglePermissionActivity(id: number): Observable<PermissionDto> {
    return this.http.post<ApiResponse<PermissionDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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

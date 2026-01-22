import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import {
  RoleDto,
  AddRoleDto,
  UpdateRoleDto,
  RoleAssignPermissionDto,
  RoleUnassignPermissionDto,
  AssignRoleToUserDto
} from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/role`;

  constructor(private http: HttpClient) {}

  /**
   * Get all roles with optional pagination
   * For main management pages: pass isActive as undefined to get ALL roles
   * For assignment contexts: pass isActive: true to get only active roles
   */
  getAllRoles(
    isActive?: boolean,
    pageNumber?: number,
    pageSize?: number
  ): Observable<ApiResponse<PaginationResponse<RoleDto> | RoleDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<RoleDto> | RoleDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get role by ID
   */
  getRoleById(id: string): Observable<RoleDto> {
    return this.http.get<ApiResponse<RoleDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new role
   */
  createRole(roleData: AddRoleDto): Observable<RoleDto> {
    return this.http.post<ApiResponse<RoleDto>>(this.apiUrl, roleData)
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
   * Update role name
   */
  updateRole(roleData: UpdateRoleDto): Observable<RoleDto> {
    return this.http.put<ApiResponse<RoleDto>>(this.apiUrl, roleData)
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
   * Delete a role
   */
  deleteRole(id: string): Observable<void> {
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
   * Assign permission to role
   */
  assignPermissionToRole(roleId: string, permissionId: number): Observable<void> {
    const dto: RoleAssignPermissionDto = { roleId, permissionId };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/assign-permission`, dto)
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
    const dto: RoleUnassignPermissionDto = { roleId, permissionId };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/unassign-permission`, dto)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Assign role to user
   */
  assignRoleToUser(userId: string, roleId: string): Observable<void> {
    const dto: AssignRoleToUserDto = { userId, roleId };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/assign-to-user`, dto)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Remove role from user
   */
  removeRoleFromUser(userId: string, roleId: string): Observable<void> {
    const dto: AssignRoleToUserDto = { userId, roleId };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/remove-from-user`, dto)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Get permission IDs by role
   */
  getPermissionIdsByRole(roleId: string): Observable<number[]> {
    return this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/${roleId}/permissions`)
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
   * Toggle role activity
   */
  toggleRoleActivity(id: string): Observable<RoleDto> {
    return this.http.post<ApiResponse<RoleDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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

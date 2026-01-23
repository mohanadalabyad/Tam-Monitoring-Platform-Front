import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { CityDto, AddCityDto, UpdateCityDto, CityFilter } from '../models/city.model';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private apiUrl = `${environment.apiUrl}/City`;

  constructor(private http: HttpClient) {}

  /**
   * Get all cities with optional pagination
   * For main management pages: pass isActive as undefined to get ALL cities
   * For assignment contexts: pass isActive: true to get only active cities
   */
  getAllCities(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<CityDto> | CityDto[]>> {
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

    return this.http.get<ApiResponse<PaginationResponse<CityDto> | CityDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get all cities with filter
   */
  getAllCitiesWithFilter(
    filter: CityFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<CityDto> | CityDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<CityDto> | CityDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get city by ID
   */
  getCityById(id: number): Observable<CityDto> {
    return this.http.get<ApiResponse<CityDto>>(`${this.apiUrl}/${id}`)
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
   * Create a new city
   */
  createCity(cityData: AddCityDto): Observable<CityDto> {
    return this.http.post<ApiResponse<CityDto>>(this.apiUrl, cityData)
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
   * Update city
   */
  updateCity(cityData: UpdateCityDto): Observable<CityDto> {
    return this.http.put<ApiResponse<CityDto>>(this.apiUrl, cityData)
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
   * Delete a city
   */
  deleteCity(id: number): Observable<void> {
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
   * Toggle city activity
   */
  toggleCityActivity(id: number): Observable<CityDto> {
    return this.http.post<ApiResponse<CityDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ViolationStatisticsDto } from '../models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/ViolationStatistics`;

  constructor(private http: HttpClient) {}

  /**
   * Get violation statistics (public endpoint, no auth required)
   * API returns camelCase directly, so we use it as is
   */
  getStatistics(): Observable<ApiResponse<ViolationStatisticsDto>> {
    return this.http.get<ApiResponse<ViolationStatisticsDto>>(this.apiUrl);
  }
}

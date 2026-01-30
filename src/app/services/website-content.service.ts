import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { WebsiteContentMap } from '../models/website-content.model';

@Injectable({
  providedIn: 'root'
})
export class WebsiteContentService {
  private apiUrl = `${environment.apiUrl}/WebsiteContent`;
  private cachedContent: WebsiteContentMap | null = null;
  private loadPromise: Observable<WebsiteContentMap> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get all website content for public site. Cached after first load.
   */
  getPublicContent(refresh = false): Observable<WebsiteContentMap> {
    if (refresh) {
      this.cachedContent = null;
      this.loadPromise = null;
    }
    if (this.cachedContent) {
      return of(this.cachedContent);
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = this.http
      .get<ApiResponse<WebsiteContentMap>>(`${this.apiUrl}/public`)
      .pipe(
        map((res) => {
          if (res.success && res.data) {
            this.cachedContent = res.data;
            return res.data;
          }
          return {};
        }),
        catchError(() => of({})),
        shareReplay(1)
      );
    return this.loadPromise;
  }

  /**
   * Get a single module's content. Uses cache if available.
   */
  getModule(key: string): Observable<unknown> {
    return this.getPublicContent().pipe(
      map((content) => content[key] ?? null)
    );
  }

  /**
   * Clear cache (e.g. after dashboard update).
   */
  clearCache(): void {
    this.cachedContent = null;
    this.loadPromise = null;
  }

  /**
   * Dashboard: get all content (authenticated).
   */
  getAllForDashboard(): Observable<ApiResponse<WebsiteContentMap>> {
    return this.http.get<ApiResponse<WebsiteContentMap>>(this.apiUrl);
  }

  /**
   * Dashboard: get one module by key.
   */
  getByModuleForDashboard(moduleKey: string): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.apiUrl}/${encodeURIComponent(moduleKey)}`);
  }

  /**
   * Dashboard: update a module's content.
   */
  updateModule(moduleKey: string, content: unknown): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${encodeURIComponent(moduleKey)}`, content).pipe(
      map((res) => {
        if (res.success) {
          this.clearCache();
        }
        return res;
      })
    );
  }
}

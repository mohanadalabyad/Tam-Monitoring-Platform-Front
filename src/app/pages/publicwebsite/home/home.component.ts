import { Component, OnInit } from '@angular/core';
import { PublishedViolationService } from '../../../services/published-violation.service';
import { StatisticsService } from '../../../services/statistics.service';
import { PublishedViolationDto, PublishedAttachmentDto } from '../../../models/published-violation.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  totalReports = 0;
  publishedReports = 0;
  pendingReports = 0;
  loadingStatistics = false;

  // بيانات الحوادث حسب المدينة (لعرض الإحصائيات فقط)
  jerusalemIncidents = 23;
  ramallahIncidents = 18;
  nablusIncidents = 15;
  bethlehemIncidents = 12;
  hebronIncidents = 14;
  jeninIncidents = 9;
  gazaIncidents = 45;
  jaffaIncidents = 6;
  haifaIncidents = 11;
  
  get totalMapIncidents(): number {
    return 153; // إجمالي الحوادث على جميع المدن المعروضة
  }

  onMapImageError(event: any): void {
    // إذا فشل تحميل الخريطة من الإنترنت، استخدم خريطة بديلة
    event.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Palestinegeographic.png/500px-Palestinegeographic.png';
  }

  latestPublishedViolations: PublishedViolationDto[] = [];
  loadingIncidents = false;

  constructor(
    private publishedViolationService: PublishedViolationService,
    private statisticsService: StatisticsService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadLatestViolations();
  }

  loadStatistics(): void {
    this.loadingStatistics = true;
    this.statisticsService.getStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalReports = response.data.totalViolations || 0;
          this.publishedReports = response.data.publishedViolations || 0;
          this.pendingReports = response.data.underReviewViolations || 0;
          console.log('Statistics loaded:', {
            total: this.totalReports,
            published: this.publishedReports,
            pending: this.pendingReports
          });
        } else {
          console.warn('Statistics response not successful:', response);
        }
        this.loadingStatistics = false;
      },
      error: (error: any) => {
        console.error('Error loading statistics:', error);
        // Keep default values (0) on error
        this.totalReports = 0;
        this.publishedReports = 0;
        this.pendingReports = 0;
        this.loadingStatistics = false;
      }
    });
  }

  loadLatestViolations(): void {
    this.loadingIncidents = true;
    this.publishedViolationService.getAllPublishedViolations(1, 3).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (response.data && typeof response.data === 'object' && 'items' in response.data) {
            const items = response.data.items || [];
            // ترتيب حسب creationDate (الأحدث أولاً)
            this.latestPublishedViolations = items
              .sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())
              .slice(0, 3);
          } else if (Array.isArray(response.data)) {
            this.latestPublishedViolations = response.data
              .sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())
              .slice(0, 3);
          }
        }
        this.loadingIncidents = false;
      },
      error: (error: any) => {
        console.error('Error loading latest violations:', error);
        this.loadingIncidents = false;
      }
    });
  }

  getLocation(violation: PublishedViolationDto): string {
    // Public violations use address, Private violations use location
    return violation.violationType === 'Public' 
      ? (violation.address || 'غير محدد')
      : (violation.location || 'غير محدد');
  }

  isImage(fileType: string): boolean {
    if (!fileType) return false;
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    return imageTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
  }

  getAttachmentUrl(filePath: string): string {
    if (!filePath) return '';
    // If filePath already contains http/https, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    // Otherwise, construct full URL from API base URL
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  openAttachment(attachment: PublishedAttachmentDto): void {
    const url = this.getAttachmentUrl(attachment.filePath);
    if (url) {
      window.open(url, '_blank');
    }
  }
}

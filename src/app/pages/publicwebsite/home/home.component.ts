import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { PublishedViolationService } from '../../../services/published-violation.service';
import { StatisticsService } from '../../../services/statistics.service';
import { PublishedViolationDto, PublishedAttachmentDto } from '../../../models/published-violation.model';
import { ViolationStatisticsDto, CityStatisticsItemDto } from '../../../models/statistics.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  totalReports = 0;
  publishedReports = 0;
  pendingReports = 0;
  loadingStatistics = false;
  cityStatistics: CityStatisticsItemDto[] = [];

  // Map properties
  map: any = null;
  cityLayers: Map<number, any> = new Map();

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

  ngAfterViewInit(): void {
    // Map will be initialized after statistics are loaded
  }

  loadStatistics(): void {
    this.loadingStatistics = true;
    this.statisticsService.getStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalReports = response.data.totalViolations || 0;
          this.publishedReports = response.data.publishedViolations || 0;
          this.pendingReports = response.data.underReviewViolations || 0;
          this.cityStatistics = response.data.cityStatistics || [];
          console.log('Statistics loaded:', {
            total: this.totalReports,
            published: this.publishedReports,
            pending: this.pendingReports,
            cities: this.cityStatistics.length
          });
          // Initialize map and render city statistics after view is ready
          setTimeout(() => {
            if (document.getElementById('city-statistics-map')) {
              this.initMap();
              this.renderCityStatistics();
            }
          }, 300);
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
        this.cityStatistics = [];
        this.loadingStatistics = false;
      }
    });
  }

  initMap(): void {
    if (this.map) {
      return; // Map already initialized
    }

    // Check if Leaflet is available
    if (typeof (window as any).L === 'undefined') {
      console.error('Leaflet library is not loaded');
      return;
    }

    // Check if map container exists
    const mapElement = document.getElementById('city-statistics-map');
    if (!mapElement) {
      console.error('Map container element not found');
      return;
    }

    // Initialize Leaflet map
    this.map = (window as any).L.map('city-statistics-map').setView([31.9522, 35.2332], 8);

    // Add OpenStreetMap tiles
    (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add geocoder control
    if ((window as any).L.Control && (window as any).L.Control.Geocoder) {
      (window as any).L.Control.geocoder({
        defaultMarkGeocode: false
      }).on('markgeocode', (e: any) => {
        const latlng = e.geocode.center;
        this.map.setView(latlng, 13);
      }).addTo(this.map);
    }
  }

  renderCityStatistics(): void {
    if (!this.map || !this.cityStatistics || this.cityStatistics.length === 0) {
      return;
    }

    // Clear existing layers
    this.cityLayers.forEach((layer) => {
      this.map.removeLayer(layer);
    });
    this.cityLayers.clear();

    // Find max violations for color scaling
    const maxViolations = Math.max(...this.cityStatistics.map(c => c.totalViolations), 1);

    // Render each city
    this.cityStatistics.forEach((city) => {
      if (!city.area) {
        // Skip cities without area GeoJSON
        return;
      }

      try {
        // Parse GeoJSON
        const geoJson = typeof city.area === 'string' ? JSON.parse(city.area) : city.area;

        // Calculate color based on violation count
        const intensity = city.totalViolations / maxViolations;
        const color = this.getColorForViolations(city.totalViolations, maxViolations);

        // Create GeoJSON layer
        const geoJsonLayer = (window as any).L.geoJSON(geoJson, {
          style: {
            fillColor: color,
            fillOpacity: 0.6,
            color: '#333',
            weight: 2,
            opacity: 0.8
          },
          onEachFeature: (feature: any, layer: any) => {
            // Add popup with city statistics
            const popupContent = `
              <div style="text-align: right; direction: rtl; font-family: 'Cairo', sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #5b3872;">${city.cityName || 'مدينة غير معروفة'}</h3>
                <p style="margin: 5px 0;"><strong>إجمالي البلاغات:</strong> ${city.totalViolations}</p>
                <p style="margin: 5px 0;"><strong>البلاغات المنشورة:</strong> ${city.approvedPublishedCount}</p>
              </div>
            `;
            layer.bindPopup(popupContent);
          }
        }).addTo(this.map);

        this.cityLayers.set(city.cityId, geoJsonLayer);
      } catch (error) {
        console.error(`Error parsing GeoJSON for city ${city.cityId}:`, error);
      }
    });

    // Fit map to show all cities
    if (this.cityLayers.size > 0) {
      const group = new (window as any).L.featureGroup(Array.from(this.cityLayers.values()));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }

    // Add legend
    this.addMapLegend(maxViolations);
  }

  getColorForViolations(count: number, max: number): string {
    if (count === 0) return '#e0e0e0'; // Gray for no violations
    const intensity = count / max;
    if (intensity <= 0.2) return '#90EE90'; // Light green
    if (intensity <= 0.4) return '#FFD700'; // Yellow
    if (intensity <= 0.6) return '#FFA500'; // Orange
    if (intensity <= 0.8) return '#FF6347'; // Tomato red
    return '#DC143C'; // Crimson for high violations
  }

  addMapLegend(maxViolations: number): void {
    if (!this.map) return;

    // Remove existing legend if any
    const existingLegend = document.getElementById('map-legend');
    if (existingLegend) {
      existingLegend.remove();
    }

    const legend = (window as any).L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = (window as any).L.DomUtil.create('div', 'map-legend');
      div.id = 'map-legend';
      div.style.cssText = 'background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); direction: rtl; text-align: right; font-family: "Cairo", sans-serif;';
      
      const ranges = [
        { min: 0, max: Math.ceil(maxViolations * 0.2), color: '#90EE90', label: '0 - ' + Math.ceil(maxViolations * 0.2) },
        { min: Math.ceil(maxViolations * 0.2) + 1, max: Math.ceil(maxViolations * 0.4), color: '#FFD700', label: (Math.ceil(maxViolations * 0.2) + 1) + ' - ' + Math.ceil(maxViolations * 0.4) },
        { min: Math.ceil(maxViolations * 0.4) + 1, max: Math.ceil(maxViolations * 0.6), color: '#FFA500', label: (Math.ceil(maxViolations * 0.4) + 1) + ' - ' + Math.ceil(maxViolations * 0.6) },
        { min: Math.ceil(maxViolations * 0.6) + 1, max: Math.ceil(maxViolations * 0.8), color: '#FF6347', label: (Math.ceil(maxViolations * 0.6) + 1) + ' - ' + Math.ceil(maxViolations * 0.8) },
        { min: Math.ceil(maxViolations * 0.8) + 1, max: maxViolations, color: '#DC143C', label: (Math.ceil(maxViolations * 0.8) + 1) + '+' }
      ];

      let html = '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: #5b3872;">عدد البلاغات</h4>';
      ranges.forEach(range => {
        html += `
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background: ${range.color}; border: 1px solid #333; margin-left: 10px;"></div>
            <span style="font-size: 12px;">${range.label}</span>
          </div>
        `;
      });
      html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px;">
        <strong>إجمالي المدن:</strong> ${this.cityStatistics.length}<br>
        <strong>إجمالي البلاغات:</strong> ${this.totalReports}
      </div>`;

      div.innerHTML = html;
      return div;
    };
    legend.addTo(this.map);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.cityLayers.clear();
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
    // Return city name instead of address/location
    return violation.cityName || 'غير محدد';
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

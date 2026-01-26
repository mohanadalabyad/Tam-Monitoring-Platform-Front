import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityService } from '../../../services/city.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { CityDto, AddCityDto, UpdateCityDto } from '../../../models/city.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, MapPin, Power, PowerOff } from 'lucide-angular';

@Component({
  selector: 'app-cities-management',
  templateUrl: './cities-management.component.html',
  styleUrls: ['./cities-management.component.scss']
})
export class CitiesManagementComponent implements OnInit {
  cities: CityDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  cityForm!: FormGroup;
  editingCity: CityDto | null = null;
  viewMode: ViewMode = 'table';
  togglingCities: Set<number> = new Set();

  // Map-related properties
  map: any = null;
  marker: any = null;
  circle: any = null;
  centerLat: number | null = null;
  centerLng: number | null = null;
  radiusKm: number = 0;

  columns: TableColumn[] = [
    { key: 'name', label: 'الاسم', sortable: true, filterable: false },
    { key: 'governorate', label: 'المحافظة', sortable: true, filterable: false },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('City', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleCityActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  MapPin = MapPin;
  Power = Power;
  PowerOff = PowerOff;

  constructor(
    private cityService: CityService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('cities-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadCities();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('cities-view-mode', view);
  }

  initForm(): void {
    this.cityForm = this.fb.group({
      name: ['', Validators.required],
      governorate: ['', Validators.required],
      area: [''], // Auto-populated from map
      centerLat: [null],
      centerLng: [null],
      radiusKm: [0, [Validators.required, Validators.min(0.1)]]
    });

    // Watch for radius changes to update circle
    this.cityForm.get('radiusKm')?.valueChanges.subscribe((value) => {
      this.radiusKm = value || 0;
      if (this.map && this.radiusKm > 0) {
        this.updateCircle();
      }
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('City', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editCity(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('City', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteCity(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadCities(): void {
    this.loading = true;
    // Main management page: get ALL cities (active and inactive) - pass undefined for isActive
    this.cityService.getAllCities(undefined, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل المدن');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل المدن');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة مدينة جديدة';
    this.editingCity = null;
    this.cityForm.reset({ 
      name: '', 
      governorate: '', 
      area: '',
      centerLat: null,
      centerLng: null,
      radiusKm: 0
    });
    this.centerLat = null;
    this.centerLng = null;
    this.radiusKm = 0;
    this.showModal = true;
    // Initialize map after modal is shown
    setTimeout(() => {
      this.initMap();
    }, 300);
  }

  editCity(city: CityDto): void {
    this.modalTitle = 'تعديل مدينة';
    this.editingCity = city;
    this.cityForm.patchValue({
      name: city.name,
      governorate: city.governorate,
      area: city.area
    });
    this.showModal = true;
    // Load existing area first, then initialize map
    setTimeout(() => {
      this.loadExistingArea(city.area);
      // Initialize map after loading area (so it can display the circle)
      setTimeout(() => {
        this.initMap();
      }, 100);
    }, 300);
  }

  deleteCity(city: CityDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف المدينة "${city.name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.cityService.deleteCity(city.id).subscribe({
          next: () => {
            this.cities = this.cities.filter(c => c.id !== city.id);
            this.toasterService.showSuccess('تم حذف المدينة بنجاح');
          },
          error: (error) => {
            console.error('Error deleting city:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف المدينة');
          }
        });
      }
    });
  }

  saveCity(): void {
    // Convert circle to GeoJSON before saving
    if (this.centerLat && this.centerLng && this.radiusKm > 0) {
      const geoJSON = this.circleToGeoJSON();
      this.cityForm.patchValue({ area: geoJSON });
    }

    if (this.cityForm.valid) {
      const formValue = this.cityForm.value;
      
      // Validate that area is set
      if (!formValue.area) {
        this.toasterService.showWarning('يرجى تحديد المنطقة على الخريطة');
        return;
      }
      
      if (this.editingCity) {
        const updateDto: UpdateCityDto = {
          id: this.editingCity.id,
          name: formValue.name,
          governorate: formValue.governorate,
          area: formValue.area
        };
        
        this.cityService.updateCity(updateDto).subscribe({
          next: (updatedCity) => {
            this.toasterService.showSuccess('تم تحديث المدينة بنجاح');
            this.closeModal();
            this.loadCities(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث المدينة');
          }
        });
      } else {
        const addDto: AddCityDto = {
          name: formValue.name,
          governorate: formValue.governorate,
          area: formValue.area
        };
        
        this.cityService.createCity(addDto).subscribe({
          next: (newCity) => {
            this.toasterService.showSuccess('تم إضافة المدينة بنجاح');
            this.closeModal();
            this.loadCities(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة المدينة');
          }
        });
      }
    } else {
      Object.keys(this.cityForm.controls).forEach(key => {
        this.cityForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    // Clean up map when closing modal
    this.destroyMap();
    this.showModal = false;
    this.editingCity = null;
    this.cityForm.reset();
    this.centerLat = null;
    this.centerLng = null;
    this.radiusKm = 0;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.cityForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleCityActivity(city: CityDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingCities.has(city.id)) {
      return; // Already toggling
    }

    this.togglingCities.add(city.id);
    
    this.cityService.toggleCityActivity(city.id).subscribe({
      next: (updatedCity) => {
        this.toasterService.showSuccess(`تم ${updatedCity.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المدينة بنجاح`);
        this.togglingCities.delete(city.id);
        // Update the city in the list
        const index = this.cities.findIndex(c => c.id === city.id);
        if (index !== -1) {
          this.cities[index] = updatedCity;
        }
        this.loadCities(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling city activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة المدينة');
        this.togglingCities.delete(city.id);
      }
    });
  }

  isToggling(cityId: number): boolean {
    return this.togglingCities.has(cityId);
  }

  // Map initialization
  initMap(): void {
    if (typeof (window as any).L === 'undefined') {
      console.error('Leaflet library not loaded');
      setTimeout(() => this.initMap(), 200);
      return;
    }

    const L = (window as any).L;
    const mapId = 'city-area-map';
    const mapElement = document.getElementById(mapId);

    if (!mapElement) {
      setTimeout(() => this.initMap(), 200);
      return;
    }

    // Clean up existing map if it exists
    if (this.map) {
      this.destroyMap();
    }

    try {
      // West Bank, Palestine center coordinates
      const westBankCenter: [number, number] = [31.9522, 35.2332];
      
      // Use existing center if available, otherwise use West Bank center
      const initialCenter: [number, number] = this.centerLat && this.centerLng
        ? [this.centerLat, this.centerLng]
        : westBankCenter;

      // Create map
      this.map = L.map(mapId).setView(initialCenter, this.centerLat && this.centerLng ? 13 : 10);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Add click event to map
      this.map.on('click', (e: any) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });

      // Add geocoding search control
      if (typeof (window as any).L.Control !== 'undefined' && (window as any).L.Control.Geocoder) {
        const geocoder = (window as any).L.Control.Geocoder.nominatim();
        (window as any).L.Control.geocoder({
          geocoder: geocoder,
          defaultMarkGeocode: false,
          position: 'topright',
          placeholder: 'ابحث عن موقع...',
          errorMessage: 'لم يتم العثور على نتائج',
          showResultIcons: true,
          collapsed: false,
          expand: 'click'
        }).on('markgeocode', (e: any) => {
          const latlng = e.geocode.center;
          this.onMapClick(latlng.lat, latlng.lng);
          this.map.setView(latlng, 16);
        }).addTo(this.map);
      }

      // If center and radius are already set, draw circle
      if (this.centerLat && this.centerLng && this.radiusKm > 0) {
        this.updateCircle();
      } else if (this.centerLat && this.centerLng) {
        // Just add marker if no radius
        this.updateMarker(this.centerLat, this.centerLng);
      }

      // Invalidate size after a short delay to ensure proper rendering
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  // Handle map click
  onMapClick(lat: number, lng: number): void {
    this.centerLat = lat;
    this.centerLng = lng;
    this.cityForm.patchValue({
      centerLat: lat,
      centerLng: lng
    });
    
    this.updateMarker(lat, lng);
    
    // Update circle if radius is set
    if (this.radiusKm > 0) {
      this.updateCircle();
    }
  }

  // Update marker position
  updateMarker(lat: number, lng: number): void {
    if (typeof (window as any).L === 'undefined' || !this.map) {
      return;
    }

    const L = (window as any).L;
    
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  // Update circle overlay
  updateCircle(): void {
    if (typeof (window as any).L === 'undefined' || !this.map) {
      return;
    }

    if (!this.centerLat || !this.centerLng || !this.radiusKm || this.radiusKm <= 0) {
      return;
    }

    const L = (window as any).L;
    
    // Remove existing circle
    if (this.circle) {
      this.map.removeLayer(this.circle);
    }

    // Convert radius from km to meters for Leaflet
    const radiusMeters = this.radiusKm * 1000;

    // Create circle
    this.circle = L.circle([this.centerLat, this.centerLng], {
      radius: radiusMeters,
      color: '#5b3872',
      fillColor: '#5b3872',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(this.map);

    // Ensure marker is visible
    if (!this.marker) {
      this.updateMarker(this.centerLat, this.centerLng);
    }

    // Fit map to show circle
    this.map.fitBounds(this.circle.getBounds());
  }

  // Convert circle to GeoJSON Polygon
  circleToGeoJSON(): string {
    if (!this.centerLat || !this.centerLng || !this.radiusKm || this.radiusKm <= 0) {
      return '';
    }
    
    // Create circle polygon with 64 points
    const points = 64;
    const coordinates: number[][] = [];
    
    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points;
      const angleRad = angle * Math.PI / 180;
      
      // Calculate point on circle
      // 1 degree latitude ≈ 111.32 km
      // 1 degree longitude ≈ 111.32 * cos(latitude) km
      const latOffset = (this.radiusKm / 111.32) * Math.cos(angleRad);
      const lngOffset = (this.radiusKm / (111.32 * Math.cos(this.centerLat * Math.PI / 180))) * Math.sin(angleRad);
      
      const lat = this.centerLat + latOffset;
      const lng = this.centerLng + lngOffset;
      
      // GeoJSON format: [lng, lat]
      coordinates.push([lng, lat]);
    }
    
    const geoJSON = {
      type: 'Polygon',
      coordinates: [coordinates]
    };
    
    return JSON.stringify(geoJSON);
  }

  // Load existing area from GeoJSON
  loadExistingArea(areaJson: string): void {
    if (!areaJson) {
      return;
    }

    try {
      const geoJSON = JSON.parse(areaJson);
      
      if (geoJSON.type === 'Polygon' && geoJSON.coordinates && geoJSON.coordinates[0]) {
        const coordinates = geoJSON.coordinates[0];
        
        // Calculate centroid (average of all points)
        let sumLat = 0;
        let sumLng = 0;
        for (const coord of coordinates) {
          sumLng += coord[0]; // GeoJSON: [lng, lat]
          sumLat += coord[1];
        }
        
        const centerLat = sumLat / coordinates.length;
        const centerLng = sumLng / coordinates.length;
        
        // Calculate approximate radius
        // Find the maximum distance from center to any point
        let maxDistance = 0;
        for (const coord of coordinates) {
          const lat = coord[1];
          const lng = coord[0];
          
          // Haversine distance calculation
          const dLat = (lat - centerLat) * Math.PI / 180;
          const dLng = (lng - centerLng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = 6371 * c; // Earth radius in km
          
          if (distance > maxDistance) {
            maxDistance = distance;
          }
        }
        
        // Set center and radius
        this.centerLat = centerLat;
        this.centerLng = centerLng;
        this.radiusKm = maxDistance;
        
        // Update form
        this.cityForm.patchValue({
          centerLat: centerLat,
          centerLng: centerLng,
          radiusKm: maxDistance
        });
      }
    } catch (error) {
      console.error('Error parsing area JSON:', error);
    }
  }

  // Destroy map instance
  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
    this.circle = null;
  }
}

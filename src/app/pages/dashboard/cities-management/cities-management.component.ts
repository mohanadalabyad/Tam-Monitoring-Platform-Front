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
      area: ['', Validators.required]
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
    this.cityForm.reset({ name: '', governorate: '', area: '' });
    this.showModal = true;
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
    if (this.cityForm.valid) {
      const formValue = this.cityForm.value;
      
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
    this.showModal = false;
    this.editingCity = null;
    this.cityForm.reset();
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
}

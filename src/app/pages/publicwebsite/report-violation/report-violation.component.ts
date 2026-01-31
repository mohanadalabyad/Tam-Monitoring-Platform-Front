import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PublicViolationService } from '../../../services/public-violation.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { PerpetratorTypeService } from '../../../services/perpetrator-type.service';
import { ToasterService } from '../../../services/toaster.service';
import { PublicViolationType, Gender } from '../../../models/public-violation.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto } from '../../../models/subcategory.model';
import { PerpetratorTypeDto } from '../../../models/perpetrator-type.model';

@Component({
  selector: 'app-report-violation',
  templateUrl: './report-violation.component.html',
  styleUrls: ['./report-violation.component.scss']
})
export class ReportViolationComponent implements OnInit {
  currentStep = 1;
  totalSteps = 4; // Reduced from 5 to 4 (removed questions step)
  violationForm!: FormGroup;
  
  // Data
  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  filteredSubCategories: SubCategoryDto[] = [];
  perpetratorTypes: PerpetratorTypeDto[] = [];
  loadingPerpetratorTypes = false;
  
  // File upload
  attachments: File[] = [];
  attachmentPreviews: { file: File; preview: string }[] = [];
  
  // State
  loading = false;
  submitting = false;
  submitted = false;
  submittedViolationId: number | null = null;
  maxDate: string = new Date().toISOString().slice(0, 10); // For date picker (YYYY-MM-DD)

  // Enums for template (use distinct name to avoid TS2663 self-reference)
  PublicViolationType = PublicViolationType;
  GenderOption = Gender;

  constructor(
    private fb: FormBuilder,
    private publicViolationService: PublicViolationService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private perpetratorTypeService: PerpetratorTypeService,
    private toasterService: ToasterService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadCities();
    this.loadCategories();
  }

  initForms(): void {
    // Main form - updated to match backend structure
    this.violationForm = this.fb.group({
      cityId: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: ['', Validators.required],
      perpetratorTypeId: [null as number | null],
      violationDate: ['', Validators.required],
      address: ['', Validators.required], // Changed from location
      description: ['', Validators.required],
      violationType: [PublicViolationType.Victim, Validators.required], // Changed from isWitness
      canContact: [false], // Changed from contactPreference
      email: [''],
      phoneNumber: [''],
      preferredContactMethod: ['']
    });

    // Watch category changes (onCategoryChange loads subcategories and perpetrator types)
    this.violationForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onCategoryChange(categoryId);
    });

    // Watch canContact changes to validate contact fields
    this.violationForm.get('canContact')?.valueChanges.subscribe(canContact => {
      this.updateContactFields(canContact);
    });
  }

  loadCities(): void {
    this.cityService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : [];
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل المدن');
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : [];
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل الفئات');
      }
    });
  }

  loadSubCategories(categoryId?: number): void {
    if (categoryId && categoryId > 0) {
      // Use public lookup endpoint with categoryId query parameter
      this.subCategoryService.getPublicLookup(Number(categoryId)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.filteredSubCategories = Array.isArray(response.data) ? response.data : [];
            // Reset subcategory selection when category changes
            this.violationForm.patchValue({ subCategoryId: '' });
          } else {
            this.filteredSubCategories = [];
            this.violationForm.patchValue({ subCategoryId: '' });
          }
        },
        error: (error) => {
          console.error('Error loading subcategories:', error);
          this.filteredSubCategories = [];
          this.violationForm.patchValue({ subCategoryId: '' });
          this.toasterService.showError('حدث خطأ أثناء تحميل الفئات الفرعية');
        }
      });
    } else {
      this.filteredSubCategories = [];
      this.violationForm.patchValue({ subCategoryId: '' });
    }
  }

  onCategoryChange(categoryId: number | string | null): void {
    // Handle empty string, null, or undefined
    if (!categoryId || categoryId === '' || categoryId === null) {
      this.filteredSubCategories = [];
      this.perpetratorTypes = [];
      this.violationForm.patchValue({ subCategoryId: '', perpetratorTypeId: null }, { emitEvent: false });
      return;
    }

    // Convert to number if it's a string (from form)
    const categoryIdNum = typeof categoryId === 'string' ? Number(categoryId) : categoryId;
    
    // Check if it's a valid number (not NaN and greater than 0)
    if (categoryIdNum && !isNaN(categoryIdNum) && categoryIdNum > 0) {
      this.loadSubCategories(categoryIdNum);
      this.loadPerpetratorTypes(categoryIdNum);
    } else {
      this.filteredSubCategories = [];
      this.perpetratorTypes = [];
      this.violationForm.patchValue({ subCategoryId: '', perpetratorTypeId: null }, { emitEvent: false });
    }
  }

  /** Load perpetrator types by categoryId (same pattern as subcategory – public lookup by category). */
  loadPerpetratorTypes(categoryId?: number): void {
    if (categoryId && categoryId > 0) {
      this.loadingPerpetratorTypes = true;
      this.perpetratorTypeService.getPublicLookup(Number(categoryId)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.perpetratorTypes = Array.isArray(response.data) ? response.data : [];
          } else {
            this.perpetratorTypes = [];
          }
          this.violationForm.patchValue({ perpetratorTypeId: null }, { emitEvent: false });
          this.loadingPerpetratorTypes = false;
        },
        error: (error) => {
          console.error('Error loading perpetrator types:', error);
          this.perpetratorTypes = [];
          this.loadingPerpetratorTypes = false;
        }
      });
    } else {
      this.perpetratorTypes = [];
      this.violationForm.patchValue({ perpetratorTypeId: null }, { emitEvent: false });
    }
  }

  updateContactFields(canContact: boolean): void {
    const emailControl = this.violationForm.get('email');
    const phoneControl = this.violationForm.get('phoneNumber');
    const preferredControl = this.violationForm.get('preferredContactMethod');

    if (canContact) {
      // Email: optional but must be valid if provided
      emailControl?.setValidators([Validators.email]);
      preferredControl?.setValidators([Validators.required]);
    } else {
      emailControl?.clearValidators();
      emailControl?.setValue('');
      phoneControl?.setValue('');
      preferredControl?.clearValidators();
      preferredControl?.setValue('');
    }
    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
    preferredControl?.updateValueAndValidity();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          this.toasterService.showWarning('يجب أن تكون الملفات صور أو فيديو');
          return;
        }
        
        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          this.toasterService.showWarning('حجم الملف يجب أن يكون أقل من 100 ميجابايت');
          return;
        }
        
        this.attachments.push(file);
        
        // Create preview for images and videos
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.attachmentPreviews.push({
              file: file,
              preview: e.target?.result as string
            });
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
          // Create object URL for video preview
          const videoUrl = URL.createObjectURL(file);
          this.attachmentPreviews.push({
            file: file,
            preview: videoUrl
          });
        } else {
          this.attachmentPreviews.push({
            file: file,
            preview: ''
          });
        }
      });
    }
  }

  removeAttachment(index: number): void {
    const preview = this.attachmentPreviews[index];
    // Clean up object URL if it's a video
    if (preview && preview.preview && preview.file.type.startsWith('video/') && preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview);
    }
    this.attachments.splice(index, 1);
    this.attachmentPreviews.splice(index, 1);
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    let isValid = true;
    
    switch (this.currentStep) {
      case 1: // Basic Information
        const basicFields = ['cityId', 'categoryId', 'subCategoryId', 'violationDate', 'address', 'description', 'violationType'];
        basicFields.forEach(field => {
          const control = this.violationForm.get(field);
          if (control && control.invalid) {
            control.markAsTouched();
            isValid = false;
          }
        });
        break;
        
      case 2: // Contact Information
        const canContact = this.violationForm.get('canContact')?.value;
        if (canContact) {
          const emailControl = this.violationForm.get('email');
          const phoneControl = this.violationForm.get('phoneNumber');
          const preferredControl = this.violationForm.get('preferredContactMethod');
          const hasEmail = (emailControl?.value ?? '').toString().trim().length > 0;
          const hasPhone = (phoneControl?.value ?? '').toString().trim().length > 0;
          if (!hasEmail && !hasPhone) {
            emailControl?.markAsTouched();
            phoneControl?.markAsTouched();
            isValid = false;
          }
          if (emailControl && emailControl.invalid) {
            emailControl.markAsTouched();
            isValid = false;
          }
          if (preferredControl && preferredControl.invalid) {
            preferredControl.markAsTouched();
            isValid = false;
          }
        }
        break;
        
      case 3: // Attachments (no validation needed, optional)
        break;
    }
    
    if (!isValid) {
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
    
    return isValid;
  }

  onSubmit(): void {
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.violationForm.invalid) {
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.submitting = true;

    // Format violation date for backend (date only, send at midnight UTC)
    const violationDate = this.violationForm.value.violationDate;
    const formattedDate = violationDate ? new Date(violationDate + 'T00:00:00').toISOString() : new Date().toISOString();

    const canContact = Boolean(this.violationForm.value.canContact);
    const emailVal = (this.violationForm.value.email ?? '').toString().trim();
    const phoneVal = (this.violationForm.value.phoneNumber ?? '').toString().trim();
    const preferredVal = (this.violationForm.value.preferredContactMethod ?? '').toString().trim();
    const perpetratorTypeIdVal = this.violationForm.value.perpetratorTypeId;
    const perpetratorTypeId = perpetratorTypeIdVal != null && perpetratorTypeIdVal !== '' ? Number(perpetratorTypeIdVal) : undefined;

    // Call service with FormData (backend handles file upload)
    this.publicViolationService.createPublicViolation(
      Number(this.violationForm.value.cityId),
      Number(this.violationForm.value.categoryId),
      Number(this.violationForm.value.subCategoryId),
      Number(this.violationForm.value.violationType),
      this.violationForm.value.gender != null && this.violationForm.value.gender !== '' ? Number(this.violationForm.value.gender) : undefined,
      formattedDate,
      this.violationForm.value.address,
      this.violationForm.value.description,
      undefined, // publish description is set in edit only
      canContact,
      canContact && emailVal ? emailVal : undefined,
      canContact && phoneVal ? phoneVal : undefined,
      canContact && preferredVal ? preferredVal : undefined,
      this.attachments,
      perpetratorTypeId
    ).subscribe({
      next: (violation) => {
        this.submitted = true;
        this.submittedViolationId = violation.id;
        this.submitting = false;
          this.toasterService.showSuccess('تم إرسال البلاغ بنجاح', 'نجاح');
      },
      error: (error) => {
        console.error('Error submitting violation:', error);
        this.submitting = false;
          this.toasterService.showError(error.message || 'حدث خطأ أثناء إرسال البلاغ');
      }
    });
  }

  resetForm(): void {
    // Clean up object URLs for videos
    this.attachmentPreviews.forEach(preview => {
      if (preview.preview && preview.file.type.startsWith('video/') && preview.preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview.preview);
      }
    });
    this.submitted = false;
    this.submittedViolationId = null;
    this.currentStep = 1;
    this.violationForm.reset();
    this.violationForm.patchValue({ violationType: PublicViolationType.Victim, perpetratorTypeId: null });
    this.attachments = [];
    this.attachmentPreviews = [];
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper methods for review section
  getSelectedCityName(): string {
    const cityId = this.violationForm.get('cityId')?.value;
    if (!cityId) return 'غير محدد';
    // Convert to number for comparison (form values are strings)
    const cityIdNum = Number(cityId);
    const city = this.cities.find(c => c.id === cityIdNum);
    return city?.name || 'غير محدد';
  }

  getSelectedCategoryName(): string {
    const categoryId = this.violationForm.get('categoryId')?.value;
    if (!categoryId) return 'غير محدد';
    // Convert to number for comparison (form values are strings)
    const categoryIdNum = Number(categoryId);
    const category = this.categories.find(c => c.id === categoryIdNum);
    return category?.name || 'غير محدد';
  }

  getSelectedSubCategoryName(): string {
    const subCategoryId = this.violationForm.get('subCategoryId')?.value;
    if (!subCategoryId) return 'غير محدد';
    // Convert to number for comparison (form values are strings)
    const subCategoryIdNum = Number(subCategoryId);
    const subCategory = this.filteredSubCategories.find(c => c.id === subCategoryIdNum);
    return subCategory?.name || 'غير محدد';
  }

  getSelectedPerpetratorTypeName(): string {
    const perpetratorTypeId = this.violationForm.get('perpetratorTypeId')?.value;
    if (perpetratorTypeId == null || perpetratorTypeId === '') return 'غير محدد';
    const idNum = Number(perpetratorTypeId);
    const pt = this.perpetratorTypes.find(p => p.id === idNum);
    return pt?.name || 'غير محدد';
  }

  getViolationDateValue(): string {
    const date = this.violationForm.get('violationDate')?.value;
    if (!date) return 'غير محدد';
    try {
      // Handle date format (YYYY-MM-DD)
      const dateObj = new Date(date + 'T00:00:00');
      if (isNaN(dateObj.getTime())) return 'غير محدد';
      return dateObj.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'غير محدد';
    }
  }

  getAddressValue(): string {
    return this.violationForm.get('address')?.value || 'غير محدد';
  }

  getDescriptionValue(): string {
    return this.violationForm.get('description')?.value || 'غير محدد';
  }

  getViolationTypeLabel(): string {
    const type = this.violationForm.get('violationType')?.value;
    return type === PublicViolationType.Victim ? 'صاحب البلاغ' : 'شاهد';
  }

  getEmailValue(): string {
    return this.violationForm.get('email')?.value || '';
  }

  getPhoneValue(): string {
    return this.violationForm.get('phoneNumber')?.value || '';
  }

  getPreferredContactLabel(): string {
    const method = this.violationForm.get('preferredContactMethod')?.value;
    if (method === 'email') return 'البريد الإلكتروني';
    if (method === 'phone') return 'الهاتف';
    return '';
  }

  getCanContactValue(): boolean {
    return this.violationForm.get('canContact')?.value || false;
  }

  /** True when canContact is checked but neither email nor phone is provided */
  isContactInfoRequiredError(): boolean {
    const canContact = this.violationForm.get('canContact')?.value;
    if (!canContact) return false;
    const email = (this.violationForm.get('email')?.value ?? '').toString().trim();
    const phone = (this.violationForm.get('phoneNumber')?.value ?? '').toString().trim();
    return email.length === 0 && phone.length === 0;
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ViolationService } from '../../../services/violation.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { QuestionService } from '../../../services/question.service';
import { ToasterService } from '../../../services/toaster.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { AddPublicViolationDto, QuestionAnswerDto, AttachmentDto } from '../../../models/violation.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto } from '../../../models/subcategory.model';
import { QuestionDto, QuestionFilter } from '../../../models/question.model';

@Component({
  selector: 'app-report-violation',
  templateUrl: './report-violation.component.html',
  styleUrls: ['./report-violation.component.scss']
})
export class ReportViolationComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  violationForm!: FormGroup;
  questionsForm!: FormGroup;
  
  // Data
  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  subCategories: SubCategoryDto[] = [];
  filteredSubCategories: SubCategoryDto[] = [];
  questions: QuestionDto[] = [];
  sortedQuestions: QuestionDto[] = [];
  filteredQuestions: QuestionDto[] = [];
  
  // File upload
  attachments: File[] = [];
  attachmentPreviews: { file: File; preview: string }[] = [];
  
  // State
  loading = false;
  submitting = false;
  submitted = false;
  submittedViolationId: number | null = null;
  maxDate: string = new Date().toISOString().split('T')[0]; // For date picker max attribute
  
  // Print view
  showPrintView = false;
  printViewHtml = '';
  loadingPrintView = false;

  constructor(
    private fb: FormBuilder,
    private violationService: ViolationService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private questionService: QuestionService,
    private toasterService: ToasterService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadCities();
    this.loadCategories();
    // Don't load questions on init - wait for category selection
  }

  initForms(): void {
    // Main form
    this.violationForm = this.fb.group({
      cityId: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: ['', Validators.required],
      violationDate: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      isWitness: [false],
      contactPreference: ['', Validators.required],
      email: [''],
      phone: [''],
      personalInfoVisible: [false],
      personalInfo: ['']
    });

    // Questions form
    this.questionsForm = this.fb.group({});

    // Watch category changes
    this.violationForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onCategoryChange(categoryId);
      // Load questions for selected category
      this.loadQuestions(categoryId);
    });

    // Watch contact preference changes
    this.violationForm.get('contactPreference')?.valueChanges.subscribe(preference => {
      this.updateContactFields(preference);
    });
  }

  loadCities(): void {
    this.cityService.getAllCities(undefined, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل المدن');
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل الفئات');
      }
    });
  }

  loadSubCategories(categoryId?: number): void {
    if (categoryId) {
      // Use filter to get subcategories by categoryId
      const filter = { categoryId: Number(categoryId) }; // Ensure it's a number
      this.subCategoryService.getAllSubCategoriesWithFilter(filter, undefined, undefined, true).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const subCategories = Array.isArray(response.data) ? response.data : response.data.items || [];
            this.filteredSubCategories = subCategories;
            this.violationForm.patchValue({ subCategoryId: '' });
          }
        },
        error: (error) => {
          console.error('Error loading subcategories:', error);
          this.toasterService.showError('حدث خطأ أثناء تحميل الفئات الفرعية');
        }
      });
    } else {
      this.filteredSubCategories = [];
      this.violationForm.patchValue({ subCategoryId: '' });
    }
  }

  loadQuestions(categoryId?: number | string): void {
    // Convert to number if it's a string (from form)
    const categoryIdNum = typeof categoryId === 'string' ? Number(categoryId) : categoryId;
    
    if (!categoryIdNum) {
      // No category selected, clear questions
      this.filteredQuestions = [];
      this.sortedQuestions = [];
      // Remove all question controls
      Object.keys(this.questionsForm.controls).forEach(key => {
        if (key.startsWith('question_')) {
          this.questionsForm.removeControl(key);
        }
      });
      return;
    }

    // POST /api/Question/filter with body: { categoryId, isActive: true }
    const filter: QuestionFilter = { 
      categoryId: categoryIdNum,
      isActive: true // Only active questions for violation forms
    };
    // Pass isActive in body, not as query param (backend expects it in body)
    this.questionService.getAllQuestionsWithFilter(filter, undefined, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
          this.filteredQuestions = questions;
          // Sort by order
          this.sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
          
          // Rebuild form controls for filtered questions
          // Remove old controls
          Object.keys(this.questionsForm.controls).forEach(key => {
            if (key.startsWith('question_')) {
              this.questionsForm.removeControl(key);
            }
          });
          
          // Build form controls for questions
          this.sortedQuestions.forEach(question => {
            const validators = question.isRequired ? [Validators.required] : [];
            this.questionsForm.addControl(`question_${question.id}`, this.fb.control('', validators));
          });
        }
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل الأسئلة');
      }
    });
  }

  onCategoryChange(categoryId: number | string): void {
    // Convert to number if it's a string (from form)
    const categoryIdNum = typeof categoryId === 'string' ? Number(categoryId) : categoryId;
    if (categoryIdNum) {
      this.loadSubCategories(categoryIdNum);
    } else {
      this.filteredSubCategories = [];
      this.violationForm.patchValue({ subCategoryId: '' });
    }
  }

  updateContactFields(preference: string): void {
    const emailControl = this.violationForm.get('email');
    const phoneControl = this.violationForm.get('phone');
    
    if (preference === 'email' || preference === 'both') {
      emailControl?.setValidators([Validators.required, Validators.email]);
    } else {
      emailControl?.clearValidators();
    }
    
    if (preference === 'phone' || preference === 'both') {
      phoneControl?.setValidators([Validators.required]);
    } else {
      phoneControl?.clearValidators();
    }
    
    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
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
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.toasterService.showWarning('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
          return;
        }
        
        this.attachments.push(file);
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.attachmentPreviews.push({
              file: file,
              preview: e.target?.result as string
            });
          };
          reader.readAsDataURL(file);
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
        const basicFields = ['cityId', 'categoryId', 'subCategoryId', 'violationDate', 'location', 'description'];
        basicFields.forEach(field => {
          const control = this.violationForm.get(field);
          if (control && control.invalid) {
            control.markAsTouched();
            isValid = false;
          }
        });
        break;
        
      case 2: // Questions
        // Only validate if there are questions for the selected category
        if (this.sortedQuestions.length > 0) {
          this.sortedQuestions.forEach(question => {
            if (question.isRequired) {
              const control = this.questionsForm.get(`question_${question.id}`);
              if (control && control.invalid) {
                control.markAsTouched();
                isValid = false;
              }
            }
          });
        }
        // If no questions, step is valid (can proceed)
        break;
        
      case 3: // Contact Information
        const contactFields = ['contactPreference'];
        contactFields.forEach(field => {
          const control = this.violationForm.get(field);
          if (control && control.invalid) {
            control.markAsTouched();
            isValid = false;
          }
        });
        
        const preference = this.violationForm.get('contactPreference')?.value;
        if (preference === 'email' || preference === 'both') {
          const emailControl = this.violationForm.get('email');
          if (emailControl && emailControl.invalid) {
            emailControl.markAsTouched();
            isValid = false;
          }
        }
        if (preference === 'phone' || preference === 'both') {
          const phoneControl = this.violationForm.get('phone');
          if (phoneControl && phoneControl.invalid) {
            phoneControl.markAsTouched();
            isValid = false;
          }
        }
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

    if (this.violationForm.invalid || this.questionsForm.invalid) {
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.submitting = true;

    // Build question answers
    const questionAnswers: QuestionAnswerDto[] = [];
    this.sortedQuestions.forEach(question => {
      const answer = this.questionsForm.get(`question_${question.id}`)?.value;
      if (answer !== null && answer !== undefined && answer !== '') {
        questionAnswers.push({
          questionId: question.id,
          answerValue: String(answer)
        });
      }
    });

    // Upload files first, then submit violation
    this.uploadFiles().then(attachments => {
      // Build violation data with proper type conversions
      const violationData: AddPublicViolationDto = {
        cityId: Number(this.violationForm.value.cityId),
        categoryId: Number(this.violationForm.value.categoryId),
        subCategoryId: Number(this.violationForm.value.subCategoryId),
        violationDate: this.violationForm.value.violationDate,
        location: this.violationForm.value.location,
        description: this.violationForm.value.description,
        isWitness: Boolean(this.violationForm.value.isWitness),
        contactPreference: this.violationForm.value.contactPreference || undefined,
        email: this.violationForm.value.email || undefined,
        phone: this.violationForm.value.phone || undefined,
        personalInfoVisible: Boolean(this.violationForm.value.personalInfoVisible),
        personalInfo: this.violationForm.value.personalInfoVisible && this.violationForm.value.personalInfo 
          ? JSON.stringify(this.violationForm.value.personalInfo) 
          : undefined,
        questionAnswers: questionAnswers,
        attachments: attachments
      };

      this.violationService.createPublicViolation(violationData).subscribe({
        next: (violation) => {
          this.submitted = true;
          this.submittedViolationId = violation.id;
          this.submitting = false;
          this.toasterService.showSuccess('تم إرسال التقرير بنجاح', 'نجاح');
        },
        error: (error) => {
          console.error('Error submitting violation:', error);
          this.submitting = false;
          this.toasterService.showError(error.message || 'حدث خطأ أثناء إرسال التقرير');
        }
      });
    }).catch(error => {
      this.submitting = false;
      this.toasterService.showError(error.message || 'حدث خطأ أثناء رفع الملفات');
    });
  }

  /**
   * Upload files and return attachment DTOs
   */
  private uploadFiles(): Promise<AttachmentDto[]> {
    return new Promise((resolve, reject) => {
      if (this.attachments.length === 0) {
        resolve([]);
        return;
      }

      // Upload all files in parallel using forkJoin
      this.fileUploadService.uploadFiles(this.attachments).subscribe({
        next: (uploadResults) => {
          const results: AttachmentDto[] = uploadResults.map((uploadResult, index) => {
            const file = this.attachments[index];
            const fileType = file.type.startsWith('image/') ? 'image' : 'video';
            
            return {
              fileName: uploadResult.fileName,
              filePath: uploadResult.url,
              fileType: fileType,
              fileSize: file.size
            };
          });
          
          resolve(results);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.submittedViolationId = null;
    this.currentStep = 1;
    this.violationForm.reset();
    this.questionsForm.reset();
    this.attachments = [];
    this.attachmentPreviews = [];
  }

  getPrintUrl(): string {
    if (this.submittedViolationId) {
      // For public violations, print URL should work without authentication
      // The violation was created as public, so it should be accessible
      return this.violationService.getPrintViewUrl(this.submittedViolationId);
    }
    return '';
  }

  openPrintView(): void {
    if (!this.submittedViolationId) {
      return;
    }

    this.loadingPrintView = true;
    this.showPrintView = true;
    this.printViewHtml = '';

    this.violationService.getPrintViewHtml(this.submittedViolationId).subscribe({
      next: (html) => {
        this.printViewHtml = html;
        this.loadingPrintView = false;
      },
      error: (error) => {
        console.error('Error loading print view:', error);
        this.loadingPrintView = false;
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تحميل صفحة الطباعة');
        this.closePrintView();
      }
    });
  }

  closePrintView(): void {
    this.showPrintView = false;
    this.printViewHtml = '';
  }

  printCurrentView(): void {
    window.print();
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getQuestionControlName(questionId: number): string {
    return `question_${questionId}`;
  }
}

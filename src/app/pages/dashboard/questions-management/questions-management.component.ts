import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { QuestionService } from '../../../services/question.service';
import { CategoryService } from '../../../services/category.service';
import { Question, QuestionType, QuestionOption } from '../../../models/question.model';
import { Category } from '../../../models/category.model';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-questions-management',
  templateUrl: './questions-management.component.html',
  styleUrls: ['./questions-management.component.scss']
})
export class QuestionsManagementComponent implements OnInit {
  questions: Question[] = [];
  categories: Category[] = [];
  filteredQuestions: Question[] = [];
  loading = false;
  isModalOpen = false;
  questionForm!: FormGroup;
  editMode = false;
  currentQuestionId: string | null = null;
  selectedCategoryId: string = '';
  questionTypes: { value: QuestionType; labelAr: string; labelEn: string; icon: string }[] = [];
  availableQuestions: Question[] = [];

  constructor(
    private questionService: QuestionService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private toaster: ToasterService
  ) { }

  ngOnInit(): void {
    this.questionTypes = this.questionService.getQuestionTypes();
    this.loadCategories();
    this.loadQuestions();
    this.initForm();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }


  loadQuestions(): void {
    this.loading = true;
    this.questionService.getQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        this.availableQuestions = data;
        this.filterQuestions();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.toaster.showError('فشل تحميل الأسئلة.', 'خطأ');
        this.loading = false;
      }
    });
  }

  filterQuestions(): void {
    let filtered = [...this.questions];

    if (this.selectedCategoryId) {
      filtered = filtered.filter(q => q.categoryId === this.selectedCategoryId);
    }

    this.filteredQuestions = filtered.sort((a, b) => a.order - b.order);
  }

  onCategoryFilterChange(): void {
    this.filterQuestions();
  }

  initForm(): void {
    this.questionForm = this.fb.group({
      categoryId: ['', Validators.required],
      type: ['', Validators.required],
      labelAr: ['', Validators.required],
      labelEn: ['', Validators.required],
      description: [''],
      required: [false],
      section: [''],
      order: [1, [Validators.required, Validators.min(1)]],
      options: this.fb.array([]),
      validation: this.fb.group({
        min: [''],
        max: [''],
        pattern: ['']
      }),
      conditional: this.fb.group({
        dependsOn: [''],
        showIf: ['']
      })
    });

    // Watch for type changes to show/hide options
    this.questionForm.get('type')?.valueChanges.subscribe(type => {
      this.onQuestionTypeChange(type);
    });
  }

  onQuestionTypeChange(type: QuestionType): void {
    const optionsArray = this.questionForm.get('options') as FormArray;
    
    if (['radio', 'checkbox', 'dropdown'].includes(type)) {
      if (optionsArray.length === 0) {
        this.addOption();
      }
    } else {
      // Clear options for non-option types
      while (optionsArray.length > 0) {
        optionsArray.removeAt(0);
      }
    }
  }

  get optionsArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  addOption(): void {
    const optionGroup = this.fb.group({
      labelAr: ['', Validators.required],
      labelEn: ['', Validators.required],
      value: ['', Validators.required],
      order: [this.optionsArray.length + 1]
    });
    this.optionsArray.push(optionGroup);
  }

  removeOption(index: number): void {
    this.optionsArray.removeAt(index);
    // Update order
    this.optionsArray.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  openAddModal(): void {
    this.editMode = false;
    this.currentQuestionId = null;
    this.initForm();
    if (this.selectedCategoryId) {
      this.questionForm.patchValue({ categoryId: this.selectedCategoryId });
    }
    this.isModalOpen = true;
  }

  editQuestion(question: Question): void {
    this.editMode = true;
    this.currentQuestionId = question.id;
    
    // Clear options array first
    const optionsArray = this.questionForm.get('options') as FormArray;
    while (optionsArray.length > 0) {
      optionsArray.removeAt(0);
    }

    // Add options if they exist
    if (question.options && question.options.length > 0) {
      question.options.forEach(option => {
        const optionGroup = this.fb.group({
          labelAr: [option.labelAr, Validators.required],
          labelEn: [option.labelEn, Validators.required],
          value: [option.value, Validators.required],
          order: [option.order]
        });
        optionsArray.push(optionGroup);
      });
    }

    this.questionForm.patchValue({
      categoryId: question.categoryId,
      type: question.type,
      labelAr: question.labelAr,
      labelEn: question.labelEn,
      description: question.description || '',
      required: question.required,
      section: question.section || '',
      order: question.order,
      validation: question.validation || { min: '', max: '', pattern: '' },
      conditional: question.conditional || { dependsOn: '', showIf: '' }
    });

    this.onQuestionTypeChange(question.type);
    this.isModalOpen = true;
  }

  deleteQuestion(question: Question): void {
    if (confirm(`هل أنت متأكد أنك تريد حذف السؤال "${question.labelAr}"؟`)) {
      this.questionService.deleteQuestion(question.id).subscribe({
        next: () => {
          this.toaster.showSuccess('تم حذف السؤال بنجاح.', 'نجاح');
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          this.toaster.showError('فشل حذف السؤال.', 'خطأ');
        }
      });
    }
  }

  onModalSubmit(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      this.toaster.showError('يرجى ملء جميع الحقول المطلوبة.', 'خطأ في الإدخال');
      return;
    }

    const formValue = this.questionForm.value;
    
    // Prepare question data
    const questionData: any = {
      categoryId: formValue.categoryId,
      type: formValue.type,
      labelAr: formValue.labelAr,
      labelEn: formValue.labelEn,
      description: formValue.description || undefined,
      required: formValue.required,
      section: formValue.section || undefined,
      order: formValue.order
    };

    // Add options if needed
    if (['radio', 'checkbox', 'dropdown'].includes(formValue.type)) {
      const options: QuestionOption[] = formValue.options.map((opt: any, index: number) => ({
        id: `opt-${Date.now()}-${index}`,
        labelAr: opt.labelAr,
        labelEn: opt.labelEn,
        value: opt.value,
        order: opt.order || index + 1
      }));
      questionData.options = options;
    }

    // Add validation if provided
    if (formValue.validation && (formValue.validation.min || formValue.validation.max || formValue.validation.pattern)) {
      questionData.validation = {};
      if (formValue.validation.min) questionData.validation.min = Number(formValue.validation.min);
      if (formValue.validation.max) questionData.validation.max = Number(formValue.validation.max);
      if (formValue.validation.pattern) questionData.validation.pattern = formValue.validation.pattern;
    }

    // Add conditional if provided
    if (formValue.conditional && formValue.conditional.dependsOn && formValue.conditional.showIf) {
      questionData.conditional = {
        dependsOn: formValue.conditional.dependsOn,
        showIf: formValue.conditional.showIf
      };
    }

    // Validate question
    const validation = this.questionService.validateQuestion(questionData);
    if (!validation.valid) {
      this.toaster.showError(validation.errors.join(', '), 'خطأ في التحقق');
      return;
    }

    if (this.editMode && this.currentQuestionId) {
      this.questionService.updateQuestion(this.currentQuestionId, questionData).subscribe({
        next: () => {
          this.toaster.showSuccess('تم تحديث السؤال بنجاح.', 'نجاح');
          this.closeModal();
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error updating question:', error);
          this.toaster.showError('فشل تحديث السؤال.', 'خطأ');
        }
      });
    } else {
      this.questionService.createQuestion(questionData).subscribe({
        next: () => {
          this.toaster.showSuccess('تم إضافة سؤال جديد بنجاح.', 'نجاح');
          this.closeModal();
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error creating question:', error);
          this.toaster.showError('فشل إضافة سؤال جديد.', 'خطأ');
        }
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.questionForm.reset();
    this.editMode = false;
    this.currentQuestionId = null;
    const optionsArray = this.questionForm.get('options') as FormArray;
    while (optionsArray.length > 0) {
      optionsArray.removeAt(0);
    }
  }

  getCategoryName(categoryId: string): string {
    if (!categoryId) return '';
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.nameAr : categoryId;
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const questionType = this.questionTypes.find(t => t.value === type);
    return questionType ? questionType.labelAr : type;
  }

  needsOptions(type: QuestionType): boolean {
    return ['radio', 'checkbox', 'dropdown'].includes(type);
  }
}

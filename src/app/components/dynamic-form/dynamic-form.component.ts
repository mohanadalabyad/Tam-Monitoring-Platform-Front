import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { Question, QuestionAnswer } from '../../models/question.model';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() categoryId?: string;
  @Input() initialAnswers?: QuestionAnswer[];
  @Output() formSubmit = new EventEmitter<QuestionAnswer[]>();
  @Output() formChange = new EventEmitter<QuestionAnswer[]>();

  questions: Question[] = [];
  formGroup!: FormGroup;
  loading = false;
  sections: string[] = [];

  constructor(
    private questionService: QuestionService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId']) {
      this.loadQuestions();
    }
    if (changes['initialAnswers'] && this.initialAnswers) {
      this.populateForm();
    }
  }

  loadQuestions(): void {
    if (!this.categoryId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.questionService.getQuestionsByCategory(this.categoryId).subscribe({
      next: (data) => {
        this.questions = data.sort((a, b) => a.order - b.order);
        this.extractSections();
        this.buildForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.loading = false;
      }
    });
  }

  extractSections(): void {
    const sectionSet = new Set<string>();
    this.questions.forEach(q => {
      if (q.section) {
        sectionSet.add(q.section);
      }
    });
    this.sections = Array.from(sectionSet);
  }

  getQuestionsBySection(section?: string): Question[] {
    if (!section) {
      return this.questions.filter(q => !q.section);
    }
    return this.questions.filter(q => q.section === section);
  }

  buildForm(): void {
    const formControls: any = {};

    this.questions.forEach(question => {
      let validators = [];
      
      if (question.required) {
        validators.push(Validators.required);
      }

      if (question.validation) {
        if (question.validation.min !== undefined) {
          validators.push(Validators.min(question.validation.min));
        }
        if (question.validation.max !== undefined) {
          validators.push(Validators.max(question.validation.max));
        }
        if (question.validation.pattern) {
          validators.push(Validators.pattern(question.validation.pattern));
        }
      }

      let defaultValue: any = null;
      if (question.type === 'checkbox') {
        defaultValue = [];
      } else if (question.type === 'yesno') {
        defaultValue = false;
      } else if (question.type === 'scale') {
        defaultValue = 1;
      }

      formControls[question.id] = [defaultValue, validators];
    });

    this.formGroup = this.fb.group(formControls);
    this.populateForm();
    this.formGroup.valueChanges.subscribe(() => {
      this.emitFormChange();
    });
  }

  populateForm(): void {
    if (this.initialAnswers && this.formGroup) {
      this.initialAnswers.forEach(answer => {
        const control = this.formGroup.get(answer.questionId);
        if (control) {
          control.setValue(answer.value);
        }
      });
    }
  }

  shouldShowQuestion(question: Question): boolean {
    if (!question.conditional) {
      return true;
    }

    const dependsOnControl = this.formGroup.get(question.conditional.dependsOn);
    if (!dependsOnControl) {
      return true;
    }

    const dependsOnValue = dependsOnControl.value;
    return dependsOnValue === question.conditional.showIf || 
           (Array.isArray(dependsOnValue) && dependsOnValue.includes(question.conditional.showIf));
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      const answers: QuestionAnswer[] = this.questions
        .filter(q => this.shouldShowQuestion(q))
        .map(q => ({
          questionId: q.id,
          value: this.formGroup.get(q.id)?.value
        }))
        .filter(answer => answer.value !== null && answer.value !== undefined && answer.value !== '');
      
      this.formSubmit.emit(answers);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  emitFormChange(): void {
    const answers: QuestionAnswer[] = this.questions
      .filter(q => this.shouldShowQuestion(q))
      .map(q => ({
        questionId: q.id,
        value: this.formGroup.get(q.id)?.value
      }))
      .filter(answer => answer.value !== null && answer.value !== undefined && answer.value !== '');
    
    this.formChange.emit(answers);
  }

  getQuestionControl(questionId: string) {
    return this.formGroup.get(questionId);
  }
}

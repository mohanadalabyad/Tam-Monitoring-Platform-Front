import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { QuestionDto, QuestionAnswer } from '../../models/question.model';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() initialAnswers?: QuestionAnswer[];
  @Output() formSubmit = new EventEmitter<QuestionAnswer[]>();
  @Output() formChange = new EventEmitter<QuestionAnswer[]>();

  questions: QuestionDto[] = [];
  formGroup!: FormGroup;
  loading = false;

  constructor(
    private questionService: QuestionService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialAnswers'] && this.initialAnswers && this.formGroup) {
      this.populateForm();
    }
  }

  loadQuestions(): void {
    this.loading = true;
    this.questionService.getAllQuestions(undefined, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
          this.questions = questions.sort((a, b) => a.order - b.order);
          this.buildForm();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.loading = false;
      }
    });
  }

  buildForm(): void {
    const formControls: any = {};

    this.questions.forEach(question => {
      const validators = question.isRequired ? [Validators.required] : [];
      formControls[`question_${question.id}`] = ['', validators];
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
        const control = this.formGroup.get(`question_${answer.questionId}`);
        if (control) {
          control.setValue(answer.answerValue);
        }
      });
    }
  }

  shouldShowQuestion(question: QuestionDto): boolean {
    // No conditional logic in new model, show all
    return true;
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      const answers: QuestionAnswer[] = this.questions
        .map(q => {
          const value = this.formGroup.get(`question_${q.id}`)?.value;
          return value !== null && value !== undefined && value !== '' 
            ? { questionId: q.id, answerValue: String(value) }
            : null;
        })
        .filter((answer): answer is QuestionAnswer => answer !== null);
      
      this.formSubmit.emit(answers);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  emitFormChange(): void {
    const answers: QuestionAnswer[] = this.questions
      .map(q => {
        const value = this.formGroup.get(`question_${q.id}`)?.value;
        return value !== null && value !== undefined && value !== '' 
          ? { questionId: q.id, answerValue: String(value) }
          : null;
      })
      .filter((answer): answer is QuestionAnswer => answer !== null);
    
    this.formChange.emit(answers);
  }

  getQuestionControl(questionId: number) {
    return this.formGroup.get(`question_${questionId}`);
  }

  getQuestionsBySection(): QuestionDto[] {
    return this.questions;
  }
}

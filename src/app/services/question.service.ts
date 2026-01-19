import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Question, QuestionType } from '../models/question.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private questions: Question[] = [];

  constructor() { }

  getQuestions(): Observable<Question[]> {
    return of([...this.questions].sort((a, b) => a.order - b.order));
  }

  getQuestionsByCategory(categoryId: string): Observable<Question[]> {
    return of(
      [...this.questions]
        .filter(q => q.categoryId === categoryId)
        .sort((a, b) => a.order - b.order)
    );
  }

  getQuestionById(id: string): Observable<Question | undefined> {
    return of(this.questions.find(q => q.id === id));
  }

  createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Observable<Question> {
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.questions.push(newQuestion);
    return of(newQuestion);
  }

  updateQuestion(id: string, question: Partial<Question>): Observable<Question | undefined> {
    const index = this.questions.findIndex(q => q.id === id);
    if (index > -1) {
      this.questions[index] = {
        ...this.questions[index],
        ...question,
        updatedAt: new Date()
      };
      return of(this.questions[index]);
    }
    return of(undefined);
  }

  deleteQuestion(id: string): Observable<boolean> {
    const initialLength = this.questions.length;
    this.questions = this.questions.filter(q => q.id !== id);
    return of(this.questions.length < initialLength);
  }

  reorderQuestions(questionIds: string[]): Observable<boolean> {
    questionIds.forEach((id, index) => {
      const question = this.questions.find(q => q.id === id);
      if (question) {
        question.order = index + 1;
        question.updatedAt = new Date();
      }
    });
    return of(true);
  }

  validateQuestion(question: Partial<Question>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question.type) {
      errors.push('نوع السؤال مطلوب');
    }

    if (!question.labelAr || question.labelAr.trim() === '') {
      errors.push('نص السؤال بالعربية مطلوب');
    }

    if (!question.labelEn || question.labelEn.trim() === '') {
      errors.push('نص السؤال بالإنجليزية مطلوب');
    }

    if (question.type && ['radio', 'checkbox', 'dropdown'].includes(question.type)) {
      if (!question.options || question.options.length === 0) {
        errors.push('يجب إضافة خيارات على الأقل');
      }
    }

    if (question.conditional) {
      if (!question.conditional.dependsOn) {
        errors.push('يجب تحديد السؤال الذي يعتمد عليه');
      }
      if (!question.conditional.showIf) {
        errors.push('يجب تحديد القيمة المطلوبة للظهور');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getQuestionTypes(): { value: QuestionType; labelAr: string; labelEn: string; icon: string }[] {
    return [
      { value: 'radio', labelAr: 'اختيار واحد (Radio)', labelEn: 'Single Choice (Radio)', icon: 'radio' },
      { value: 'checkbox', labelAr: 'اختيار متعدد (Checkbox)', labelEn: 'Multiple Choice (Checkbox)', icon: 'check-square' },
      { value: 'text', labelAr: 'نص قصير', labelEn: 'Short Text', icon: 'type' },
      { value: 'textarea', labelAr: 'نص طويل', labelEn: 'Long Text', icon: 'file-text' },
      { value: 'date', labelAr: 'تاريخ', labelEn: 'Date', icon: 'calendar' },
      { value: 'time', labelAr: 'وقت', labelEn: 'Time', icon: 'clock' },
      { value: 'number', labelAr: 'رقم', labelEn: 'Number', icon: 'hash' },
      { value: 'scale', labelAr: 'مقياس (1-5)', labelEn: 'Scale (1-5)', icon: 'bar-chart' },
      { value: 'yesno', labelAr: 'نعم/لا', labelEn: 'Yes/No', icon: 'toggle-left' },
      { value: 'dropdown', labelAr: 'قائمة منسدلة', labelEn: 'Dropdown', icon: 'chevron-down' }
    ];
  }
}

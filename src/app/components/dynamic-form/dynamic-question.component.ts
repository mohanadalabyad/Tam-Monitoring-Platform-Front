import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { QuestionDto, QuestionType } from '../../models/question.model';

@Component({
  selector: 'app-dynamic-question',
  templateUrl: './dynamic-question.component.html',
  styleUrls: ['./dynamic-question.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamicQuestionComponent),
      multi: true
    }
  ]
})
export class DynamicQuestionComponent implements ControlValueAccessor {
  @Input() question!: QuestionDto;
  @Input() formControlName?: string;

  value: any = null;
  onChange = (value: any) => {};
  onTouched = () => {};

  // QuestionType enum reference
  QuestionType = QuestionType;

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(value: any): void {
    this.value = value;
    // Convert value to string for backend
    this.onChange(value !== null && value !== undefined ? String(value) : '');
    this.onTouched();
  }

  isInvalid(): boolean {
    // Validation will be handled by the parent form
    return false;
  }

  getErrorMessage(): string {
    // Error messages will be handled by the parent form
    return '';
  }

  parseNumber(value: string): number {
    return Number(value);
  }

  /**
   * Convert number to string (for template use)
   */
  toString(value: number): string {
    return String(value);
  }

  /**
   * Parse options JSON string for MultipleChoice type
   */
  getOptions(): string[] {
    if (this.question.questionType === QuestionType.MultipleChoice && this.question.options) {
      try {
        const parsed = JSON.parse(this.question.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing options JSON:', e);
        return [];
      }
    }
    return [];
  }
}

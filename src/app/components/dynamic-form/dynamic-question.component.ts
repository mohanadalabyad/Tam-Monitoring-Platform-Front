import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Question } from '../../models/question.model';

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
  @Input() question!: Question;
  @Input() formControlName?: string;

  value: any = null;
  onChange = (value: any) => {};
  onTouched = () => {};

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
    this.onChange(value);
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

  onCheckboxChange(optionValue: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    let currentValue = this.value || [];
    
    if (checked) {
      if (!currentValue.includes(optionValue)) {
        currentValue = [...currentValue, optionValue];
      }
    } else {
      currentValue = currentValue.filter((v: string) => v !== optionValue);
    }
    
    this.onValueChange(currentValue);
  }

  parseNumber(value: string): number {
    return Number(value);
  }
}

import { Component, Input, forwardRef, ChangeDetectorRef } from '@angular/core';
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
  selectedOptions: string[] = []; // For multiple selection
  otherOptionText: string = ''; // For "Other" option text
  otherOptionSelected: boolean = false; // For "Other" option checkbox
  onChange = (value: any) => {};
  onTouched = () => {};

  // QuestionType enum reference
  QuestionType = QuestionType;

  constructor(private cdr: ChangeDetectorRef) {}

  writeValue(value: any): void {
    if (this.question.questionType === QuestionType.MultipleChoice && this.question.hasMultiSelect) {
      // Handle multiple selection - value is JSON array string
      if (value !== null && value !== undefined && value !== '') {
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(parsed)) {
            this.selectedOptions = [...parsed];
            // Check if any option starts with "أخرى: " or the otherOptionText
            const otherPrefix = this.question.otherOptionText || 'أخرى';
            const otherIndex = this.selectedOptions.findIndex(opt => 
              typeof opt === 'string' && opt.startsWith(otherPrefix + ': ')
            );
            if (otherIndex !== -1) {
              this.otherOptionSelected = true;
              this.otherOptionText = this.selectedOptions[otherIndex].replace(otherPrefix + ': ', '');
              this.selectedOptions.splice(otherIndex, 1);
            } else {
              this.otherOptionSelected = false;
              this.otherOptionText = '';
            }
          } else {
            this.selectedOptions = [];
            this.otherOptionSelected = false;
            this.otherOptionText = '';
          }
        } catch (e) {
          // If not JSON, treat as single value
          this.selectedOptions = value ? [String(value)] : [];
          this.otherOptionSelected = false;
          this.otherOptionText = '';
        }
      } else {
        this.selectedOptions = [];
        this.otherOptionSelected = false;
        this.otherOptionText = '';
      }
      this.value = value;
    } else if (this.question.questionType === QuestionType.MultipleChoice && !this.question.hasMultiSelect) {
      // Single selection - handle regular option or "Other" option
      if (value !== null && value !== undefined && value !== '') {
        const valueStr = String(value);
        // Check if value is in "Other" format: "أخرى: customText" or "${otherOptionText}: customText"
        const otherPrefix = this.question.otherOptionText || 'أخرى';
        if (valueStr.startsWith(otherPrefix + ': ')) {
          // It's an "Other" option
          this.otherOptionSelected = true;
          this.otherOptionText = valueStr.replace(otherPrefix + ': ', '');
          this.value = valueStr;
        } else {
          // Regular option
          this.otherOptionSelected = false;
          this.otherOptionText = '';
          this.value = valueStr;
        }
      } else {
        this.value = null;
        this.otherOptionSelected = false;
        this.otherOptionText = '';
      }
    } else {
      // Other question types - normal behavior
      if (value !== null && value !== undefined && value !== '') {
        this.value = String(value);
      } else {
        this.value = null;
      }
    }
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(value: any): void {
    if (this.question.questionType === QuestionType.MultipleChoice && this.question.hasMultiSelect) {
      // Multiple selection is handled by toggleOption and onOtherOptionChange
      this.updateMultipleSelectionValue();
    } else if (this.question.questionType === QuestionType.MultipleChoice && !this.question.hasMultiSelect) {
      // Single selection MultipleChoice is now handled by onSingleChoiceChange and onSingleOtherOptionChange
      // This method is kept for backward compatibility but should not be called for single-choice MultipleChoice
      // Fallback behavior for edge cases
      if (value !== null && value !== undefined && value !== '') {
        this.value = String(value).trim();
        this.onChange(this.value);
      } else {
        this.value = null;
        this.onChange('');
      }
      this.onTouched();
      this.cdr.detectChanges();
    } else {
      // Other question types (Text, Date, Number, etc.) - normal behavior
      if (value !== null && value !== undefined && value !== '') {
        this.value = String(value).trim();
        this.onChange(this.value);
      } else {
        this.value = null;
        this.onChange('');
      }
      this.onTouched();
      this.cdr.detectChanges();
    }
  }

  updateMultipleSelectionValue(): void {
    const result: string[] = [...this.selectedOptions];
    
    // Add "Other" option if selected
    if (this.otherOptionSelected && this.otherOptionText.trim()) {
      const otherPrefix = this.question.otherOptionText || 'أخرى';
      result.push(`${otherPrefix}: ${this.otherOptionText.trim()}`);
    }
    
    // Convert to JSON string for backend
    if (result.length > 0) {
      this.value = JSON.stringify(result);
      this.onChange(this.value);
    } else {
      this.value = null;
      this.onChange('');
    }
    
    this.onTouched();
    this.cdr.detectChanges();
  }

  isOptionSelected(option: string): boolean {
    return this.selectedOptions.includes(option);
  }

  toggleOption(option: string): void {
    const index = this.selectedOptions.indexOf(option);
    if (index === -1) {
      this.selectedOptions.push(option);
    } else {
      this.selectedOptions.splice(index, 1);
    }
    this.updateMultipleSelectionValue();
  }

  onOtherOptionChange(checked: boolean): void {
    this.otherOptionSelected = checked;
    if (!checked) {
      this.otherOptionText = '';
    }
    this.updateMultipleSelectionValue();
  }

  onOtherTextChange(value: string): void {
    this.otherOptionText = value;
    // Only update if other option is selected
    if (this.otherOptionSelected) {
      this.updateMultipleSelectionValue();
    }
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
  
  /**
   * Track by function for options
   */
  trackByOption(index: number, option: string): string {
    return option;
  }

  /**
   * Check if a single option is selected (for radio button checked state)
   */
  isSingleOptionSelected(option: string): boolean {
    if (this.question.questionType === QuestionType.MultipleChoice && !this.question.hasMultiSelect) {
      // Check if value matches the option (not "Other")
      if (this.value && typeof this.value === 'string') {
        // Check if it's an "Other" option format
        const otherPrefix = this.question.otherOptionText || 'أخرى';
        if (this.value.startsWith(otherPrefix + ': ')) {
          return false; // It's "Other" option, not this regular option
        }
        return this.value === option;
      }
    }
    return false;
  }

  /**
   * Handle single choice radio button change
   */
  onSingleChoiceChange(option: string): void {
    if (this.question.questionType === QuestionType.MultipleChoice && !this.question.hasMultiSelect) {
      // Clear "Other" option state
      this.otherOptionSelected = false;
      this.otherOptionText = '';
      
      // Set the selected option
      this.value = option;
      this.onChange(this.value);
      this.onTouched();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle "Other" option radio button change for single selection
   */
  onSingleOtherOptionChange(checked: boolean): void {
    if (this.question.questionType === QuestionType.MultipleChoice && !this.question.hasMultiSelect) {
      this.otherOptionSelected = checked;
      if (checked) {
        // If "Other" is selected, format the value
        const otherPrefix = this.question.otherOptionText || 'أخرى';
        if (this.otherOptionText.trim()) {
          this.value = `${otherPrefix}: ${this.otherOptionText.trim()}`;
        } else {
          this.value = `${otherPrefix}: `;
        }
      } else {
        // Clear the value if "Other" is deselected
        this.otherOptionText = '';
        this.value = null;
      }
      this.onChange(this.value || '');
      this.onTouched();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle "Other" option text input change for single selection
   */
  onSingleOtherTextChange(value: string): void {
    if (this.question.questionType === QuestionType.MultipleChoice && !this.question.hasMultiSelect) {
      this.otherOptionText = value;
      // Only update if "Other" option is selected
      if (this.otherOptionSelected) {
        const otherPrefix = this.question.otherOptionText || 'أخرى';
        if (value.trim()) {
          this.value = `${otherPrefix}: ${value.trim()}`;
        } else {
          this.value = `${otherPrefix}: `;
        }
        this.onChange(this.value);
        this.onTouched();
        this.cdr.detectChanges();
      }
    }
  }
}

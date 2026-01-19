import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViolationService } from '../../../services/violation.service';
import { Violation } from '../../../models/violation.model';

@Component({
  selector: 'app-report-violation',
  templateUrl: './report-violation.component.html',
  styleUrls: ['./report-violation.component.scss']
})
export class ReportViolationComponent implements OnInit {
  violationForm!: FormGroup;
  categories: string[] = [];
  submitted = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private violationService: ViolationService
  ) {}

  ngOnInit(): void {
    this.categories = this.violationService.getCategories();
    this.initForm();
  }

  initForm(): void {
    this.violationForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      reporterName: ['', Validators.required],
      reporterEmail: ['', [Validators.required, Validators.email]],
      reporterPhone: ['']
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.violationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.violationForm.valid) {
      this.submitting = true;
      const violation: Violation = {
        ...this.violationForm.value,
        status: 'pending',
        reportedDate: new Date()
      };

      this.violationService.submitViolation(violation).subscribe({
        next: () => {
          this.submitted = true;
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error submitting violation:', error);
          this.submitting = false;
          alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
        }
      });
    } else {
      Object.keys(this.violationForm.controls).forEach(key => {
        this.violationForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm(): void {
    this.submitted = false;
    this.violationForm.reset();
  }
}

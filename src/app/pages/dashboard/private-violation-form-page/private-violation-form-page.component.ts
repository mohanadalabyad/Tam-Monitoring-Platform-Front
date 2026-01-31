import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-private-violation-form-page',
  templateUrl: './private-violation-form-page.component.html',
  styleUrls: ['./private-violation-form-page.component.scss']
})
export class PrivateViolationFormPageComponent implements OnInit {
  violationId: number | null = null;
  pageTitle = 'إضافة بلاغ خاص جديد';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(+id)) {
      this.violationId = +id;
      this.pageTitle = 'تعديل بلاغ خاص';
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/my-private-violations']);
  }

  onSaved(): void {
    this.router.navigate(['/dashboard/my-private-violations']);
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/my-private-violations']);
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrivateViolationService } from '../../../services/private-violation.service';
import { PrivateViolationDto } from '../../../models/violation.model';
import {
  getAcceptanceStatusLabel,
  getPublishStatusLabel,
  getPrivateViolationKindLabel
} from '../../../models/violation.model';
import {
  getPrivateViolationRoleLabel,
  getGenderLabel,
  getPreferredContactMethodLabel
} from '../../../models/published-violation.model';
import { getMaritalStatusLabel } from '../../../models/violation.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-private-violation-view-page',
  templateUrl: './private-violation-view-page.component.html',
  styleUrls: ['./private-violation-view-page.component.scss']
})
export class PrivateViolationViewPageComponent implements OnInit {
  violation: PrivateViolationDto | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private privateViolationService: PrivateViolationService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : NaN;
    if (!idParam || isNaN(id)) {
      this.error = 'معرف البلاغ غير صالح.';
      this.loading = false;
      return;
    }
    this.privateViolationService.getMyPrivateViolationById(id).subscribe({
      next: (data) => {
        this.violation = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = err?.message || 'حدث خطأ أثناء تحميل البلاغ.';
        this.loading = false;
        this.violation = null;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/my-private-violations']);
  }

  editViolation(): void {
    if (this.violation?.id) {
      this.router.navigate(['/dashboard/my-private-violations/edit', this.violation.id]);
    }
  }

  getAcceptanceStatusLabel(status: number): string {
    return getAcceptanceStatusLabel(status);
  }

  getPublishStatusLabel(status: number): string {
    return getPublishStatusLabel(status);
  }

  getPrivateViolationKindLabel(kind: number): string {
    return getPrivateViolationKindLabel(kind);
  }

  getPrivateViolationRoleLabel(role: number): string {
    return getPrivateViolationRoleLabel(role);
  }

  getGenderLabel(gender: number): string {
    return getGenderLabel(gender);
  }

  getPreferredContactMethodLabel(method: number): string {
    return getPreferredContactMethodLabel(method);
  }

  getMaritalStatusLabel(status: number): string {
    return getMaritalStatusLabel(status);
  }

  getAttachmentUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiUrl?.replace(/\/api\/?$/, '') || '';
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  }

  isImageFile(fileType: string): boolean {
    if (!fileType) return false;
    const t = fileType.toLowerCase();
    return t.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => t.includes(ext));
  }

  isVideoFile(fileType: string): boolean {
    if (!fileType) return false;
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', '.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
  }
}

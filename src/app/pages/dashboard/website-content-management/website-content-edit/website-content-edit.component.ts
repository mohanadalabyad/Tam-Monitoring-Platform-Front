import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WebsiteContentService } from '../../../../services/website-content.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-website-content-edit',
  templateUrl: './website-content-edit.component.html',
  styleUrls: ['./website-content-edit.component.scss']
})
export class WebsiteContentEditComponent implements OnInit, OnChanges {
  @Input() moduleKey: string | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup = this.fb.group({});
  loading = false;
  saving = false;
  loadError = false;

  constructor(
    private fb: FormBuilder,
    private websiteContentService: WebsiteContentService,
    private toasterService: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadContent();
  }

  ngOnChanges(): void {
    if (this.moduleKey) {
      this.loadContent();
    }
  }

  private buildForm(moduleKey: string): FormGroup {
    switch (moduleKey) {
      case 'Header':
        return this.fb.group({
          logoUrl: ['/logo.png'],
          navLinks: this.fb.array([])
        });
      case 'Footer':
        return this.fb.group({
          orgName: [''],
          tagline: [''],
          websiteUrl: [''],
          quickLinks: this.fb.array([]),
          email: [''],
          phone: [''],
          address: [''],
          copyrightText: ['']
        });
      case 'HomeHero':
        return this.fb.group({
          badge: [''],
          titleMain: [''],
          titleSub: [''],
          description: [''],
          primaryButtonText: [''],
          primaryButtonRoute: [''],
          secondaryButtonText: [''],
          secondaryButtonRoute: ['']
        });
      case 'HomeStats':
        return this.fb.group({
          sectionLabel: [''],
          sectionTitle: ['']
        });
      case 'HomeFeatures':
        return this.fb.group({
          sectionLabel: [''],
          sectionTitle: [''],
          features: this.fb.array([])
        });
      case 'HomeIncidents':
        return this.fb.group({
          sectionLabel: [''],
          sectionTitle: [''],
          viewAllButtonText: [''],
          viewAllRoute: ['']
        });
      case 'HomeHowItWorks':
        return this.fb.group({
          sectionLabel: [''],
          sectionTitle: [''],
          steps: this.fb.array([])
        });
      case 'HomeAbout':
        return this.fb.group({
          sectionLabel: [''],
          sectionTitle: [''],
          description: [''],
          logoUrl: [''],
          buttonText: [''],
          buttonRoute: [''],
          valueItems: this.fb.array([])
        });
      case 'HomeMap':
        return this.fb.group({
          sectionLabel: [''],
          sectionTitle: [''],
          description: ['']
        });
      case 'HomeCta':
        return this.fb.group({
          title: [''],
          description: [''],
          buttonText: [''],
          buttonRoute: ['']
        });
      case 'AboutMission':
        return this.fb.group({
          pageTitle: [''],
          pageSubtitle: [''],
          missionTitle: [''],
          missionText: ['']
        });
      case 'AboutWhatWeDo':
        return this.fb.group({
          title: [''],
          introText: [''],
          items: this.fb.array([])
        });
      case 'AboutHowItWorks':
        return this.fb.group({
          title: [''],
          steps: this.fb.array([])
        });
      case 'AboutContact':
        return this.fb.group({
          title: [''],
          introText: [''],
          websiteUrl: [''],
          email: [''],
          phone: [''],
          address: ['']
        });
      case 'AboutCta':
        return this.fb.group({
          title: [''],
          buttonText: [''],
          buttonRoute: ['']
        });
      default:
        return this.fb.group({});
    }
  }

  private patchFormFromData(moduleKey: string, data: any): void {
    if (!data) return;
    const d = data as Record<string, unknown>;
    switch (moduleKey) {
      case 'Header':
        this.form.patchValue({ logoUrl: d['logoUrl'] ?? '/logo.png' });
        const navLinks = (d['navLinks'] as any[]) ?? [];
        (this.form.get('navLinks') as FormArray).clear();
        navLinks.forEach((item: any) => this.addNavLink(item?.label, item?.route, !!item?.isReportButton));
        break;
      case 'Footer':
        this.form.patchValue({
          orgName: d['orgName'] ?? '',
          tagline: d['tagline'] ?? '',
          websiteUrl: d['websiteUrl'] ?? '',
          email: d['email'] ?? '',
          phone: d['phone'] ?? '',
          address: d['address'] ?? '',
          copyrightText: d['copyrightText'] ?? ''
        });
        const ql = (d['quickLinks'] as any[]) ?? [];
        (this.form.get('quickLinks') as FormArray).clear();
        ql.forEach((item: any) => this.addQuickLink(item?.label, item?.route));
        break;
      case 'HomeHero':
      case 'HomeStats':
      case 'HomeIncidents':
      case 'HomeMap':
      case 'HomeCta':
      case 'AboutMission':
      case 'AboutContact':
      case 'AboutCta':
        this.form.patchValue(d);
        break;
      case 'HomeFeatures':
        this.form.patchValue({
          sectionLabel: d['sectionLabel'] ?? '',
          sectionTitle: d['sectionTitle'] ?? ''
        });
        const feats = (d['features'] as any[]) ?? [];
        (this.form.get('features') as FormArray).clear();
        feats.forEach((item: any) => this.addFeature(item?.title, item?.description));
        break;
      case 'HomeHowItWorks':
      case 'AboutHowItWorks':
        if (moduleKey === 'HomeHowItWorks') {
          this.form.patchValue({
            sectionLabel: d['sectionLabel'] ?? '',
            sectionTitle: d['sectionTitle'] ?? ''
          });
        } else {
          this.form.patchValue({ title: d['title'] ?? '' });
        }
        const steps = (d['steps'] as any[]) ?? [];
        (this.form.get('steps') as FormArray).clear();
        steps.forEach((item: any) => this.addStep(item?.title, item?.description));
        break;
      case 'HomeAbout':
        this.form.patchValue({
          sectionLabel: d['sectionLabel'] ?? '',
          sectionTitle: d['sectionTitle'] ?? '',
          description: d['description'] ?? '',
          logoUrl: d['logoUrl'] ?? '',
          buttonText: d['buttonText'] ?? '',
          buttonRoute: d['buttonRoute'] ?? ''
        });
        const vals = (d['valueItems'] as string[]) ?? [];
        (this.form.get('valueItems') as FormArray).clear();
        vals.forEach((v: string) => this.addValueItem(v));
        break;
      case 'AboutWhatWeDo':
        this.form.patchValue({
          title: d['title'] ?? '',
          introText: d['introText'] ?? ''
        });
        const items = (d['items'] as string[]) ?? [];
        (this.form.get('items') as FormArray).clear();
        items.forEach((v: string) => this.addTextItem(v));
        break;
    }
  }

  loadContent(): void {
    if (!this.moduleKey) return;
    this.loading = true;
    this.loadError = false;
    this.form = this.buildForm(this.moduleKey);
    this.websiteContentService.getByModuleForDashboard(this.moduleKey).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && this.moduleKey && res.data !== undefined && res.data !== null) {
          this.patchFormFromData(this.moduleKey, res.data);
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  private getPayload(): unknown {
    const v = this.form.getRawValue();
    const moduleKey = this.moduleKey!;
    switch (moduleKey) {
      case 'Header':
        return {
          logoUrl: v.logoUrl,
          navLinks: (v.navLinks ?? []).map((x: any) => ({
            label: x.label,
            route: x.route,
            isReportButton: !!x.isReportButton
          }))
        };
      case 'Footer':
        return {
          orgName: v.orgName,
          tagline: v.tagline,
          websiteUrl: v.websiteUrl,
          quickLinks: (v.quickLinks ?? []).map((x: any) => ({ label: x.label, route: x.route })),
          email: v.email,
          phone: v.phone,
          address: v.address,
          copyrightText: v.copyrightText
        };
      case 'HomeFeatures':
        return {
          sectionLabel: v.sectionLabel,
          sectionTitle: v.sectionTitle,
          features: (v.features ?? []).map((x: any) => ({ title: x.title, description: x.description }))
        };
      case 'HomeHowItWorks':
        return {
          sectionLabel: v.sectionLabel,
          sectionTitle: v.sectionTitle,
          steps: (v.steps ?? []).map((x: any) => ({ title: x.title, description: x.description }))
        };
      case 'HomeAbout':
        return {
          sectionLabel: v.sectionLabel,
          sectionTitle: v.sectionTitle,
          description: v.description,
          logoUrl: v.logoUrl,
          buttonText: v.buttonText,
          buttonRoute: v.buttonRoute,
          valueItems: (v.valueItems ?? []).map((x: any) => (typeof x === 'string' ? x : String(x ?? '')))
        };
      case 'AboutHowItWorks':
        return {
          title: v.title,
          steps: (v.steps ?? []).map((x: any) => ({ title: x.title, description: x.description }))
        };
      case 'AboutWhatWeDo':
        return {
          title: v.title,
          introText: v.introText,
          items: (v.items ?? []).map((x: any) => (typeof x === 'string' ? x : String(x ?? '')))
        };
      default:
        return v;
    }
  }

  onSubmit(): void {
    if (!this.moduleKey || this.form.invalid) return;
    const payload = this.getPayload();
    this.saving = true;
    this.websiteContentService.updateModule(this.moduleKey, payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.toasterService.showSuccess(res.message ?? 'تم الحفظ بنجاح', 'تم');
          this.saved.emit();
        } else {
          this.toasterService.showError(res.message ?? 'فشل الحفظ', 'خطأ');
        }
      },
      error: () => {
        this.saving = false;
        this.toasterService.showError('حدث خطأ أثناء الحفظ', 'خطأ');
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  // --- FormArray helpers ---
  navLinksArray(): FormArray {
    return this.form.get('navLinks') as FormArray;
  }
  addNavLink(label = '', route = '', isReportButton = false): void {
    this.navLinksArray().push(
      this.fb.group({ label: [label], route: [route], isReportButton: [isReportButton] })
    );
  }
  removeNavLink(i: number): void {
    this.navLinksArray().removeAt(i);
  }

  quickLinksArray(): FormArray {
    return this.form.get('quickLinks') as FormArray;
  }
  addQuickLink(label = '', route = ''): void {
    this.quickLinksArray().push(this.fb.group({ label: [label], route: [route] }));
  }
  removeQuickLink(i: number): void {
    this.quickLinksArray().removeAt(i);
  }

  featuresArray(): FormArray {
    return this.form.get('features') as FormArray;
  }
  addFeature(title = '', description = ''): void {
    this.featuresArray().push(this.fb.group({ title: [title], description: [description] }));
  }
  removeFeature(i: number): void {
    this.featuresArray().removeAt(i);
  }

  stepsArray(): FormArray {
    return this.form.get('steps') as FormArray;
  }
  addStep(title = '', description = ''): void {
    this.stepsArray().push(this.fb.group({ title: [title], description: [description] }));
  }
  removeStep(i: number): void {
    this.stepsArray().removeAt(i);
  }

  valueItemsArray(): FormArray {
    return this.form.get('valueItems') as FormArray;
  }
  addValueItem(text = ''): void {
    this.valueItemsArray().push(this.fb.control(text));
  }
  removeValueItem(i: number): void {
    this.valueItemsArray().removeAt(i);
  }

  itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }
  addTextItem(text = ''): void {
    this.itemsArray().push(this.fb.control(text));
  }
  removeTextItem(i: number): void {
    this.itemsArray().removeAt(i);
  }
}

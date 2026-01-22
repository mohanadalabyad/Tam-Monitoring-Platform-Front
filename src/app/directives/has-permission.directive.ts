import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionCheckService } from '../services/permission-check.service';

@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissions: string[] = [];
  private requireAll = false;
  private subscription?: Subscription;

  @Input() set hasPermission(value: string | string[]) {
    if (Array.isArray(value)) {
      this.permissions = value;
    } else {
      this.permissions = [value];
    }
    this.updateView();
  }

  @Input() set hasPermissionRequireAll(value: boolean) {
    this.requireAll = value;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionCheckService
  ) {}

  ngOnInit(): void {
    // Subscribe to permission changes
    this.subscription = this.permissionService.permissions$.subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateView(): void {
    const hasPermission = this.requireAll
      ? this.permissionService.hasAllPermissions(this.permissions)
      : this.permissionService.hasAnyPermission(this.permissions);

    // Always clear first to prevent duplicate views
    this.viewContainer.clear();

    if (hasPermission || this.permissionService.isSuperAdmin()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

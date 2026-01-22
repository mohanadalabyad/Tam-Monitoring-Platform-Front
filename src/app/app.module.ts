import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './pages/publicwebsite/home/home.component';
import { ReportViolationComponent } from './pages/publicwebsite/report-violation/report-violation.component';
import { ViolationListComponent } from './pages/publicwebsite/violation-list/violation-list.component';
import { AboutComponent } from './pages/publicwebsite/about/about.component';

// Auth components
import { LoginComponent } from './auth/login/login.component';

// Dashboard components
import { DashboardLayoutComponent } from './pages/dashboard/dashboard-layout/dashboard-layout.component';
import { DashboardSidebarComponent } from './pages/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from './pages/dashboard/dashboard-header/dashboard-header.component';
import { StatisticsComponent } from './pages/dashboard/statistics/statistics.component';
import { ViolationsManagementComponent } from './pages/dashboard/violations-management/violations-management.component';
import { UsersManagementComponent } from './pages/dashboard/users-management/users-management.component';
import { CardsViewComponent } from './pages/dashboard/cards-view/cards-view.component';
import { CategoriesManagementComponent } from './pages/dashboard/categories-management/categories-management.component';
import { SubCategoriesManagementComponent } from './pages/dashboard/subcategories-management/subcategories-management.component';
import { QuestionsManagementComponent } from './pages/dashboard/questions-management/questions-management.component';
import { RolesManagementComponent } from './pages/dashboard/roles-management/roles-management.component';
import { PermissionsManagementComponent } from './pages/dashboard/permissions-management/permissions-management.component';

// Shared components
import { UnifiedTableComponent } from './components/unified-table/unified-table.component';
import { UnifiedCardComponent } from './components/unified-card/unified-card.component';
import { ModalComponent } from './components/modal/modal.component';
import { ToasterComponent } from './components/toaster/toaster.component';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';
import { DynamicQuestionComponent } from './components/dynamic-form/dynamic-question.component';
import { ViewToggleComponent } from './components/view-toggle/view-toggle.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { RoleAssignmentModalComponent } from './pages/dashboard/users-management/role-assignment-modal/role-assignment-modal.component';
import { LucideAngularModule } from 'lucide-angular';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Directives
import { HasPermissionDirective } from './directives/has-permission.directive';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    ReportViolationComponent,
    ViolationListComponent,
    AboutComponent,
    LoginComponent,
    DashboardLayoutComponent,
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    StatisticsComponent,
    ViolationsManagementComponent,
    UsersManagementComponent,
    CardsViewComponent,
    CategoriesManagementComponent,
    SubCategoriesManagementComponent,
    QuestionsManagementComponent,
    RolesManagementComponent,
    PermissionsManagementComponent,
    UnifiedCardComponent,
    ModalComponent,
    ToasterComponent,
    DynamicFormComponent,
    DynamicQuestionComponent,
    HasPermissionDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    // Standalone components
    UnifiedTableComponent,
    ViewToggleComponent,
    ConfirmationDialogComponent,
    RoleAssignmentModalComponent,
    // Lucide icons
    LucideAngularModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

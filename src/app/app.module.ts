import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
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

// Shared components
import { UnifiedTableComponent } from './components/unified-table/unified-table.component';
import { UnifiedCardComponent } from './components/unified-card/unified-card.component';
import { ModalComponent } from './components/modal/modal.component';
import { ToasterComponent } from './components/toaster/toaster.component';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';
import { DynamicQuestionComponent } from './components/dynamic-form/dynamic-question.component';

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
    UnifiedTableComponent,
    UnifiedCardComponent,
    ModalComponent,
    ToasterComponent,
    DynamicFormComponent,
    DynamicQuestionComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

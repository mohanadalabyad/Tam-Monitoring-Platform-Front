import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { HomeComponent } from './pages/publicwebsite/home/home.component';
import { ReportViolationComponent } from './pages/publicwebsite/report-violation/report-violation.component';
import { ViolationListComponent } from './pages/publicwebsite/violation-list/violation-list.component';
import { AboutComponent } from './pages/publicwebsite/about/about.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardLayoutComponent } from './pages/dashboard/dashboard-layout/dashboard-layout.component';
import { StatisticsComponent } from './pages/dashboard/statistics/statistics.component';
import { ViolationsManagementComponent } from './pages/dashboard/violations-management/violations-management.component';
import { UsersManagementComponent } from './pages/dashboard/users-management/users-management.component';
import { CardsViewComponent } from './pages/dashboard/cards-view/cards-view.component';
import { CategoriesManagementComponent } from './pages/dashboard/categories-management/categories-management.component';
import { SubCategoriesManagementComponent } from './pages/dashboard/subcategories-management/subcategories-management.component';
import { QuestionsManagementComponent } from './pages/dashboard/questions-management/questions-management.component';

const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'report', component: ReportViolationComponent },
  { path: 'violations', component: ViolationListComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  
  // Dashboard routes (protected)
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: StatisticsComponent },
      { path: 'violations', component: ViolationsManagementComponent },
      { path: 'categories', component: CategoriesManagementComponent },
      { path: 'subcategories', component: SubCategoriesManagementComponent },
      { path: 'questions', component: QuestionsManagementComponent },
      { path: 'users', component: UsersManagementComponent },
      { path: 'cards', component: CardsViewComponent }
    ]
  },
  
  // Wildcard route
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

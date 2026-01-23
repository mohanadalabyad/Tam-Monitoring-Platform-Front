import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { PermissionGuard } from './auth/permission.guard';
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
import { RolesManagementComponent } from './pages/dashboard/roles-management/roles-management.component';
import { PermissionsManagementComponent } from './pages/dashboard/permissions-management/permissions-management.component';
import { CitiesManagementComponent } from './pages/dashboard/cities-management/cities-management.component';

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
      {
        path: 'violations',
        component: ViolationsManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'Violation.Read' }
      },
      {
        path: 'categories',
        component: CategoriesManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'Category.Read' }
      },
      {
        path: 'subcategories',
        component: SubCategoriesManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'SubCategory.Read' }
      },
      {
        path: 'questions',
        component: QuestionsManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'Question.Read' }
      },
      {
        path: 'users',
        component: UsersManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'User.Read' }
      },
      {
        path: 'roles',
        component: RolesManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'Role.Read' }
      },
      {
        path: 'permissions',
        component: PermissionsManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'Permission.Read' }
      },
      {
        path: 'cities',
        component: CitiesManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'City.Read' }
      },
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

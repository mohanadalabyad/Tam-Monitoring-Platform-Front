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
import { UsersManagementComponent } from './pages/dashboard/users-management/users-management.component';
import { CategoriesManagementComponent } from './pages/dashboard/categories-management/categories-management.component';
import { SubCategoriesManagementComponent } from './pages/dashboard/subcategories-management/subcategories-management.component';
import { QuestionsManagementComponent } from './pages/dashboard/questions-management/questions-management.component';
import { RolesManagementComponent } from './pages/dashboard/roles-management/roles-management.component';
import { PermissionsManagementComponent } from './pages/dashboard/permissions-management/permissions-management.component';
import { CitiesManagementComponent } from './pages/dashboard/cities-management/cities-management.component';
import { FollowUpStatusesManagementComponent } from './pages/dashboard/follow-up-statuses-management/follow-up-statuses-management.component';
import { PublicViolationsManagementComponent } from './pages/dashboard/public-violations-management/public-violations-management.component';
import { MyPrivateViolationsComponent } from './pages/dashboard/my-private-violations/my-private-violations.component';
import { PrivateViolationsManagementComponent } from './pages/dashboard/private-violations-management/private-violations-management.component';
import { PrivateViolationFormPageComponent } from './pages/dashboard/private-violation-form-page/private-violation-form-page.component';
import { PrivateViolationViewPageComponent } from './pages/dashboard/private-violation-view-page/private-violation-view-page.component';
import { SettingsManagementComponent } from './pages/dashboard/settings-management/settings-management.component';
import { WebsiteContentManagementComponent } from './pages/dashboard/website-content-management/website-content-management.component';
import { EducationLevelsManagementComponent } from './pages/dashboard/education-levels-management/education-levels-management.component';
import { PerpetratorTypesManagementComponent } from './pages/dashboard/perpetrator-types-management/perpetrator-types-management.component';

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
        path: 'perpetrator-types',
        component: PerpetratorTypesManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PerpetratorType.Read' }
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
      {
        path: 'follow-up-statuses',
        component: FollowUpStatusesManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'FollowUpStatus.Read' }
      },
      {
        path: 'public-violations',
        component: PublicViolationsManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PublicViolation.Read' }
      },
      {
        path: 'my-private-violations',
        component: MyPrivateViolationsComponent,
        canActivate: [AuthGuard] // Authenticated users only
      },
      {
        path: 'my-private-violations/add',
        component: PrivateViolationFormPageComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'my-private-violations/edit/:id',
        component: PrivateViolationFormPageComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'my-private-violations/view/:id',
        component: PrivateViolationViewPageComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'private-violations',
        component: PrivateViolationsManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PrivateViolation.Read' }
      },
      {
        path: 'private-violations/view/:id',
        component: PrivateViolationViewPageComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PrivateViolation.Read' }
      },
      {
        path: 'settings',
        component: SettingsManagementComponent,
        canActivate: [AuthGuard] // Authenticated users only, permissions checked inside component
      },
      {
        path: 'website-content',
        component: WebsiteContentManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'WebsiteContent.Edit' }
      },
      {
        path: 'education-levels',
        component: EducationLevelsManagementComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'EducationLevel.Read' }
      }
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

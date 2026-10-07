import { Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: LayoutComponent,

    children: [
      // Home
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },

      // Departments
      {
        path: 'departments',
        data: { readOnly: true },
        loadComponent: () =>
          import('./features/departments/department-management/department-management.component').then(
            (m) => m.DepartmentManagementComponent,
          ),
      },

      {
        path: 'projects',
        pathMatch: 'full',
        data: { readOnly: true },
        loadComponent: () =>
          import('./features/projects/project-management/project-management.component').then(
            (m) => m.ProjectManagementComponent,
          ),
      },

      // Public project details
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent,
          ),
      },

      // Public task details
      {
        path: 'tasks',
        pathMatch: 'full',
        data: { readOnly: true },
        loadComponent: () =>
          import('./features/tasks/task-management/task-management.component').then(
            (m) => m.TaskManagementComponent,
          ),
      },

      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./features/tasks/task-detail/task-detail.component').then(
            (m) => m.TaskDetailComponent,
          ),
      },

      {
        path: 'tags',
        data: { readOnly: true },
        loadComponent: () =>
          import('./features/tags/tag-management/tag-management.component').then(
            (m) => m.TagManagementComponent,
          ),
      },

      // Search
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search.component').then((m) => m.SearchComponent),
      },

      {
        path: 'admin',
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '/',
          },
          {
            path: 'departments',
            loadComponent: () =>
              import('./features/departments/department-management/department-management.component').then(
                (m) => m.DepartmentManagementComponent,
              ),
          },
          {
            path: 'projects',
            loadComponent: () =>
              import('./features/projects/project-management/project-management.component').then(
                (m) => m.ProjectManagementComponent,
              ),
          },
          {
            path: 'tasks',
            loadComponent: () =>
              import('./features/tasks/task-management/task-management.component').then(
                (m) => m.TaskManagementComponent,
              ),
          },
          {
            path: 'tags',
            loadComponent: () =>
              import('./features/tags/tag-management/tag-management.component').then(
                (m) => m.TagManagementComponent,
              ),
          },
          {
            path: 'accounts',
            canActivate: [adminGuard],
            loadComponent: () =>
              import('./features/accounts/account-management.component').then(
                (m) => m.AccountManagementComponent,
              ),
          },
        ],
      },
      { path: 'accounts', pathMatch: 'full', redirectTo: '/admin/accounts' },
    ],
  },

  // Unknown route
  {
    path: '**',
    redirectTo: '',
  },
];

import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RouterLink } from '@angular/router';

import { DepartmentService } from '../../core/services/department.service';

import { ProjectService } from '../../core/services/project.service';

import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { AuthService } from '../../core/services/auth.service';

import { Project, ProjectStatus } from '../../core/models/project.model';

@Component({
  selector: 'app-home',
  standalone: true,

  imports: [
    DatePipe,
    RouterLink,
    NzAlertModule,
    NzCardModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
  ],

  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);

  private readonly projectService = inject(ProjectService);

  private readonly taskService = inject(TaskService);

  private readonly tagService = inject(TagService);

  readonly auth = inject(AuthService);

  private readonly platformId = inject(PLATFORM_ID);

  private readonly changeDetector = inject(ChangeDetectorRef);

  departmentsCount = 0;

  projectsCount = 0;

  tasksCount = 0;

  tagsCount = 0;

  projects: Project[] = [];

  loading = true;

  errorMessage = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDashboard();
    }
  }

  private loadDashboard(): void {
    this.loading = true;

    this.errorMessage = '';

    forkJoin({
      departments: this.departmentService.getAll(),

      projects: this.projectService.getAll(),

      tasks: this.taskService.getAll(),
      tags: this.tagService.getAll(),
    }).subscribe({
      next: ({ departments, projects, tasks, tags }) => {
        this.departmentsCount = departments.length;

        this.projectsCount = projects.length;

        this.tasksCount = tasks.length;

        this.tagsCount = tags.length;

        this.projects = projects;

        this.loading = false;
        this.changeDetector.markForCheck();
      },

      error: () => {
        this.loading = false;

        this.errorMessage = 'Unable to load dashboard data. Please try again later.';
        this.changeDetector.markForCheck();
      },
    });
  }

  getProjectStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.NotStarted:
        return 'Not Started';

      case ProjectStatus.InProgress:
        return 'In Progress';

      case ProjectStatus.Completed:
        return 'Completed';

      case ProjectStatus.OnHold:
        return 'On Hold';

      default:
        return 'Unknown';
    }
  }

  getProjectStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.NotStarted:
        return 'default';

      case ProjectStatus.InProgress:
        return 'processing';

      case ProjectStatus.Completed:
        return 'success';

      case ProjectStatus.OnHold:
        return 'warning';

      default:
        return 'default';
    }
  }
}

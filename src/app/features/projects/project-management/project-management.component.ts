import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';

import {
  Project,
  ProjectStatus,
  ProjectRequest,
  ProjectSearchParams,
} from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { Department } from '../../../core/models/department.model';
import { DepartmentService } from '../../../core/services/department.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzFormModule,
    NzModalModule,
    NzTagModule,
    NzIconModule,
    NzCardModule,
    NzSpaceModule,
    DatePipe,
  ],
  templateUrl: './project-management.component.html',
  styleUrl: './project-management.component.scss',
})
export class ProjectManagementComponent implements OnInit {
  private projectService = inject(ProjectService);
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private platformId = inject(PLATFORM_ID);
  private changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly readOnly = inject(ActivatedRoute).snapshot.data['readOnly'] === true;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDepartments();
      this.loadProjects();
    }
  }

  // Data
  projects: Project[] = [];
  departments: Department[] = [];
  isLoading = false;

  // Search
  searchParams: ProjectSearchParams = {
    name: '',
    status: undefined,
    departmentId: undefined,
  };

  ProjectStatus = ProjectStatus;
  statusOptions = [
    { value: ProjectStatus.NotStarted, label: 'Not Started' },
    { value: ProjectStatus.InProgress, label: 'In Progress' },
    { value: ProjectStatus.Completed, label: 'Completed' },
    { value: ProjectStatus.OnHold, label: 'On Hold' },
  ];

  // Modal
  isModalVisible = false;
  isSaving = false;
  editingId: number | null = null;
  modalTitle = 'Create Project';

  form = this.fb.nonNullable.group({
    projectName: ['', [Validators.required]],
    description: [''],
    startDate: [new Date(), [Validators.required]],
    endDate: [null as Date | null],
    status: [ProjectStatus.NotStarted, [Validators.required]],
    departmentID: [null as number | null, [Validators.required]],
    isActive: [true],
  });

  loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => {
        this.departments = data;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.notification.error('Error', 'Failed to load departments');
        this.changeDetector.markForCheck();
      },
    });
  }

  loadProjects(): void {
    this.isLoading = true;
    // Clean empty search params
    const params: ProjectSearchParams = {};
    if (this.searchParams.name) params.name = this.searchParams.name;
    if (this.searchParams.status !== undefined && this.searchParams.status !== null)
      params.status = this.searchParams.status;
    if (this.searchParams.departmentId) params.departmentId = this.searchParams.departmentId;

    this.projectService.search(params).subscribe({
      next: (data) => {
        this.projects = data;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.notification.error('Error', 'Failed to load projects');
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  resetSearch(): void {
    this.searchParams = { name: '', status: undefined, departmentId: undefined };
    this.loadProjects();
  }

  getStatusColor(status: ProjectStatus): string {
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

  getStatusLabel(status: ProjectStatus): string {
    const opt = this.statusOptions.find((o) => o.value === status);
    return opt ? opt.label : 'Unknown';
  }

  showCreateModal(): void {
    this.editingId = null;
    this.modalTitle = 'Create Project';
    this.form.reset({
      projectName: '',
      description: '',
      startDate: new Date(),
      endDate: null,
      status: ProjectStatus.NotStarted,
      departmentID: null,
      isActive: true,
    });
    this.isModalVisible = true;
  }

  showEditModal(project: Project): void {
    this.editingId = project.projectID;
    this.modalTitle = 'Edit Project';
    this.form.patchValue({
      projectName: project.projectName,
      description: project.description || '',
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : null,
      status: project.status,
      departmentID: project.departmentID,
      isActive: project.isActive,
    });
    this.isModalVisible = true;
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
  }

  handleModalOk(): void {
    if (this.form.valid) {
      this.isSaving = true;
      const formValue = this.form.getRawValue();

      const request: ProjectRequest = {
        projectName: formValue.projectName,
        description: formValue.description,
        startDate: formValue.startDate.toISOString(),
        endDate: formValue.endDate ? formValue.endDate.toISOString() : undefined,
        status: formValue.status,
        departmentID: formValue.departmentID!,
        isActive: formValue.isActive,
      };

      if (this.editingId) {
        this.projectService.update(this.editingId, request).subscribe({
          next: () => {
            this.notification.success('Success', 'Project updated successfully');
            this.isModalVisible = false;
            this.isSaving = false;
            this.loadProjects();
          },
          error: () => {
            this.notification.error('Error', 'Failed to update project');
            this.isSaving = false;
          },
        });
      } else {
        this.projectService.create(request).subscribe({
          next: () => {
            this.notification.success('Success', 'Project created successfully');
            this.isModalVisible = false;
            this.isSaving = false;
            this.loadProjects();
          },
          error: () => {
            this.notification.error('Error', 'Failed to create project');
            this.isSaving = false;
          },
        });
      }
    } else {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  deleteProject(id: number): void {
    this.modal.confirm({
      nzTitle: 'Are you sure delete this project?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectService.delete(id).subscribe({
          next: () => {
            this.notification.success('Success', 'Project deleted successfully');
            this.loadProjects();
          },
          error: () => {
            this.notification.error('Error', 'Failed to delete project');
          },
        });
      },
      nzCancelText: 'No',
    });
  }
}

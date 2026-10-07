import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

// ng-zorro-antd
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';

// Models
import { Task, TaskRequest, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { Tag } from '../../../core/models/tag.model';

// Services
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { TagService } from '../../../core/services/tag.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
    NzDatePickerModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzCardModule,
    NzDividerModule,
  ],
  templateUrl: './task-management.component.html',
  styleUrl: './task-management.component.scss',
  providers: [DatePipe],
})
export class TaskManagementComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private tagService = inject(TagService);
  private fb = inject(NonNullableFormBuilder);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private datePipe = inject(DatePipe);
  private changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly readOnly = inject(ActivatedRoute).snapshot.data['readOnly'] === true;

  tasks: Task[] = [];
  projects: Project[] = [];
  tags: Tag[] = [];
  isLoading = false;

  // Search parameters
  searchTitle = '';
  searchStatus: TaskStatus | null = null;
  searchPriority: TaskPriority | null = null;

  // Enums for template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  // Modal
  isModalVisible = false;
  isModalConfirmLoading = false;
  editingTaskId: number | null = null;

  // Form
  taskForm = this.fb.group({
    title: this.fb.control('', [Validators.required]),
    description: this.fb.control(''),
    status: this.fb.control<TaskStatus>(TaskStatus.ToDo, [Validators.required]),
    priority: this.fb.control<TaskPriority>(TaskPriority.Low, [Validators.required]),
    dueDate: this.fb.control<Date | null>(null),
    projectID: this.fb.control<number>(0, [Validators.required, Validators.min(1)]),
    tagIDs: this.fb.control<number[]>([]),
  });

  ngOnInit(): void {
    this.loadData();
    this.loadProjects();
    this.loadTags();
  }

  loadData(): void {
    this.isLoading = true;
    const params: any = {};
    if (this.searchTitle) params.title = this.searchTitle;
    if (this.searchStatus !== null) params.status = this.searchStatus;
    if (this.searchPriority !== null) params.priority = this.searchPriority;

    this.taskService.search(params).subscribe({
      next: (data) => {
        this.tasks = data;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.notification.error('Error', 'Failed to load tasks');
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  loadProjects(): void {
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.notification.error('Error', 'Failed to load projects');
        this.changeDetector.markForCheck();
      },
    });
  }

  loadTags(): void {
    this.tagService.getAll().subscribe({
      next: (data) => {
        this.tags = data;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.notification.error('Error', 'Failed to load tags');
        this.changeDetector.markForCheck();
      },
    });
  }

  onSearch(): void {
    this.loadData();
  }

  resetSearch(): void {
    this.searchTitle = '';
    this.searchStatus = null;
    this.searchPriority = null;
    this.loadData();
  }

  showCreateModal(): void {
    this.editingTaskId = null;
    this.taskForm.reset();
    this.taskForm.patchValue({
      status: TaskStatus.ToDo,
      priority: TaskPriority.Low,
      projectID: this.projects.length > 0 ? this.projects[0].projectID : 0,
      tagIDs: [],
    });
    this.isModalVisible = true;
  }

  showEditModal(task: Task): void {
    this.editingTaskId = task.taskID;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      projectID: task.projectID,
      tagIDs: task.tags ? task.tags.map((t) => t.tagID) : [],
    });
    this.isModalVisible = true;
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
  }

  handleModalOk(): void {
    if (this.taskForm.valid) {
      this.isModalConfirmLoading = true;
      const formValue = this.taskForm.getRawValue();
      const request: TaskRequest = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        dueDate: formValue.dueDate
          ? (this.datePipe.transform(formValue.dueDate, 'yyyy-MM-dd') as string)
          : undefined,
        projectID: formValue.projectID,
        tagIDs: formValue.tagIDs,
      };

      if (this.editingTaskId) {
        this.taskService.update(this.editingTaskId, request).subscribe({
          next: () => {
            this.notification.success('Success', 'Task updated successfully');
            this.isModalVisible = false;
            this.isModalConfirmLoading = false;
            this.loadData();
          },
          error: () => {
            this.notification.error('Error', 'Failed to update task');
            this.isModalConfirmLoading = false;
          },
        });
      } else {
        this.taskService.create(request).subscribe({
          next: () => {
            this.notification.success('Success', 'Task created successfully');
            this.isModalVisible = false;
            this.isModalConfirmLoading = false;
            this.loadData();
          },
          error: () => {
            this.notification.error('Error', 'Failed to create task');
            this.isModalConfirmLoading = false;
          },
        });
      }
    } else {
      Object.values(this.taskForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  showDeleteConfirm(id: number): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this task?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.taskService.delete(id).subscribe({
          next: () => {
            this.notification.success('Success', 'Task deleted successfully');
            this.loadData();
          },
          error: () => this.notification.error('Error', 'Failed to delete task'),
        });
      },
      nzCancelText: 'No',
    });
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo:
        return 'default';
      case TaskStatus.InProgress:
        return 'processing';
      case TaskStatus.Done:
        return 'success';
      case TaskStatus.Cancelled:
        return 'error';
      default:
        return 'default';
    }
  }

  getStatusText(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo:
        return 'To Do';
      case TaskStatus.InProgress:
        return 'In Progress';
      case TaskStatus.Done:
        return 'Done';
      case TaskStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.Low:
        return 'default';
      case TaskPriority.Medium:
        return 'blue';
      case TaskPriority.High:
        return 'orange';
      case TaskPriority.Critical:
        return 'red';
      default:
        return 'default';
    }
  }

  getPriorityText(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.Low:
        return 'Low';
      case TaskPriority.Medium:
        return 'Medium';
      case TaskPriority.High:
        return 'High';
      case TaskPriority.Critical:
        return 'Critical';
      default:
        return 'Unknown';
    }
  }
}

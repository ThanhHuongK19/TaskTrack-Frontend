import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { TagService } from '../../../core/services/tag.service';
import { Tag, TagRequest } from '../../../core/models/tag.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tag-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzTableModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
  ],
  templateUrl: './tag-management.component.html',
  styleUrl: './tag-management.component.scss',
})
export class TagManagementComponent implements OnInit {
  private readonly service = inject(TagService);
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalService);
  private readonly notification = inject(NzNotificationService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly readOnly = inject(ActivatedRoute).snapshot.data['readOnly'] === true;

  tags: Tag[] = [];
  loading = false;
  isSaving = false;
  modalVisible = false;
  editingId: number | null = null;

  form = this.fb.nonNullable.group({
    tagName: ['', [Validators.required, Validators.maxLength(50)]],
    color: ['', [Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.loading = true;

    this.service.getAll().subscribe({
      next: (data) => {
        this.tags = data;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
        this.notification.error('Error', 'Unable to load tags.');
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({
      tagName: '',
      color: '',
    });
    this.modalVisible = true;
  }

  openEdit(tag: Tag): void {
    this.editingId = tag.tagID;
    this.form.patchValue({
      tagName: tag.tagName,
      color: tag.color ?? '',
    });
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: TagRequest = {
      tagName: raw.tagName.trim(),
      color: raw.color.trim() ? raw.color.trim() : undefined,
    };

    this.isSaving = true;
    const operation =
      this.editingId === null
        ? this.service.create(request)
        : this.service.update(this.editingId, request);
    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Success', 'Tag saved successfully.');
        this.closeModal();
        this.loadTags();
      },
      error: (response: HttpErrorResponse) => {
        this.isSaving = false;
        this.notification.error('Error', response.error?.message ?? 'Unable to save tag.');
      },
    });
  }

  confirmDelete(tag: Tag): void {
    this.modal.confirm({
      nzTitle: 'Delete tag',
      nzContent: `Are you sure you want to delete "${tag.tagName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () =>
        new Promise<void>((resolve, reject) => {
          this.service.delete(tag.tagID).subscribe({
            next: () => {
              this.notification.success('Success', 'Tag deleted successfully.');
              this.loadTags();
              resolve();
            },
            error: () => {
              this.notification.error(
                'Cannot delete',
                'This tag may be assigned to existing tasks.',
              );
              reject();
            },
          });
        }),
    });
  }
}

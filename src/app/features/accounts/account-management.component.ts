import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { Account } from '../../core/models/account.model';
import { AccountService } from '../../core/services/account.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule,
  ],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss',
})
export class AccountManagementComponent implements OnInit {
  private readonly service = inject(AccountService);
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalService);
  private readonly notification = inject(NzNotificationService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  accounts: Account[] = [];
  loading = false;
  isSaving = false;
  modalVisible = false;
  editingAccount: Account | null = null;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    role: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.changeDetector.markForCheck();
    this.service.getAll().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
        this.notification.error('Error', 'Unable to load accounts.');
      },
    });
  }

  openEdit(account: Account): void {
    this.editingAccount = account;
    this.form.setValue({ fullName: account.fullName, role: account.role });
    this.modalVisible = true;
  }

  submit(): void {
    if (!this.editingAccount || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.service.update(this.editingAccount.accountId, this.form.getRawValue()).subscribe({
      next: () => {
        this.isSaving = false;
        this.modalVisible = false;
        this.changeDetector.markForCheck();
        this.notification.success('Saved', 'Account updated.');
        this.loadAccounts();
      },
      error: (response: HttpErrorResponse) => {
        this.isSaving = false;
        this.changeDetector.markForCheck();
        this.notification.error('Error', response.error?.message ?? 'Unable to update account.');
      },
    });
  }

  confirmDelete(account: Account): void {
    this.modal.confirm({
      nzTitle: `Delete ${account.fullName}?`,
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () =>
        this.service.delete(account.accountId).subscribe({
          next: () => {
            this.notification.success('Deleted', 'Account removed.');
            this.loadAccounts();
          },
          error: (response: HttpErrorResponse) =>
            this.notification.error(
              'Unable to delete',
              response.error?.message ?? 'The account could not be deleted.',
            ),
        }),
    });
  }

  roleLabel(role: number): string {
    return role === 1 ? 'Admin' : 'Staff';
  }
}

import { Component, ChangeDetectionStrategy, output, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { User, UserRole } from '../../models/user.model';
import { CloseIconComponent } from '../icons/close-icon.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  imports: [FormsModule, CloseIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit {
  close = output<void>();
  adminService = inject(AdminService);
  notificationService = inject(NotificationService);
  
  availableRoles: UserRole[] = ['EDD Planning', 'Consultation Team'];

  ngOnInit(): void {
    this.adminService.getUsers();
  }

  updateRole(user: User, newRoleValue: string) {
    const newRole = newRoleValue as UserRole | 'none';
    
    if (user.role?.toLowerCase() === 'admin') {
        this.notificationService.showToast('Cannot change the role of an Admin.', 'error');
        // The UI will snap back to the original value on the next change detection
        // because the underlying model (`user.role`) is not being changed.
        return;
    }

    this.adminService.updateUserRole(user.id, newRole === 'none' ? null : newRole);
  }
}

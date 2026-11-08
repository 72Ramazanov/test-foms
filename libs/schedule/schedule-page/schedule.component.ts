import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';

import { AuthService } from '../../data/auth-data/auth.service';
import { MockDatabaseService } from '../../data/storage/mocks/mock-database';

import {
  Appointment,
  AppointmentStatus,
} from '../../data/storage/appointment.model';

import { ModalService } from '../../data/modal-data/services/modal.service';
import { AppointmentModalComponent } from '../appointment-modal/appointment-modal.component';

interface ScheduleRow extends Appointment {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string;
  duration: number;
  price: number;
}

interface StatusOption {
  value: AppointmentStatus;
  label: string;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent {
  private readonly authService = inject(AuthService);
  private readonly database = inject(MockDatabaseService);
  private readonly modalService = inject(ModalService);

  readonly currentUser = this.authService.getCurrentUser();

  readonly isAdmin = this.currentUser?.role === 'ADMIN';

  private readonly currentDoctorId = this.currentUser?.doctorId ?? null;

  readonly selectedDate = signal(this.getToday());

  readonly selectedDoctor = signal('ALL');
  readonly selectedService = signal('ALL');
  readonly selectedStatus = signal<AppointmentStatus | 'ALL'>('ALL');

  readonly currentPage = signal(1);
  readonly pageSize = 8;

  readonly statuses = [
    { value: 'SCHEDULED', label: 'Запланирован' },
    { value: 'ACCEPTED', label: 'Принят' },
    { value: 'CANCELLED', label: 'Отменён' },
    { value: 'NO_SHOW', label: 'Не пришёл' },
  ] as const satisfies readonly StatusOption[];

  readonly doctors = this.database.doctors;
  readonly services = this.database.services;

  readonly rows = computed<ScheduleRow[]>(() => {
    const appointments = this.database.appointments();
    const patients = this.database.patients();
    const doctors = this.doctors();
    const services = this.services();

    const patientsMap = new Map(
      patients.map((patient) => [patient.id, patient]),
    );

    const doctorsMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));

    const servicesMap = new Map(
      services.map((service) => [service.id, service]),
    );

    return appointments
      .filter((appointment) => this.matchesFilters(appointment))
      .map((appointment) => {
        const patient = patientsMap.get(appointment.patientId);
        const doctor = doctorsMap.get(appointment.doctorId);
        const service = servicesMap.get(appointment.serviceId);

        return {
          ...appointment,
          patientName: patient?.fullName ?? 'Неизвестный пациент',
          patientPhone: patient?.phone ?? '',
          doctorName: doctor?.fullName ?? 'Неизвестный врач',
          serviceName: service?.name ?? 'Неизвестная услуга',
          duration: service?.duration ?? 0,
          price: service?.price ?? 0,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  });

  private matchesFilters(appointment: Appointment): boolean {
    if (!this.isAdmin && appointment.doctorId !== this.currentDoctorId) {
      return false;
    }

    if (appointment.date !== this.selectedDate()) {
      return false;
    }

    if (
      this.isAdmin &&
      this.selectedDoctor() !== 'ALL' &&
      appointment.doctorId !== this.selectedDoctor()
    ) {
      return false;
    }

    if (
      this.selectedService() !== 'ALL' &&
      appointment.serviceId !== this.selectedService()
    ) {
      return false;
    }

    if (
      this.selectedStatus() !== 'ALL' &&
      appointment.status !== this.selectedStatus()
    ) {
      return false;
    }

    return true;
  }

  readonly paginatedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;

    return this.rows().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / this.pageSize)),
  );

  readonly rangeStart = computed(() =>
    this.rows().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );

  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.rows().length),
  );

  readonly totalAppointments = computed(
    () =>
      this.database
        .appointments()
        .filter(
          (appointment) =>
            this.isAdmin || appointment.doctorId === this.currentDoctorId,
        ).length,
  );

  readonly appointmentWord = computed(() => {
    const count = this.rows().length;
    const lastTwo = count % 100;
    const last = count % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
      return 'записей';
    }

    if (last === 1) {
      return 'запись';
    }

    if (last >= 2 && last <= 4) {
      return 'записи';
    }

    return 'записей';
  });

  readonly dateLabel = computed(() =>
    new Date(`${this.selectedDate()}T12:00:00`).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly isToday = computed(() => this.selectedDate() === this.getToday());

  private getToday(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  changeDate(days: number): void {
    const date = new Date(`${this.selectedDate()}T12:00:00`);

    date.setDate(date.getDate() + days);

    this.selectedDate.set(this.formatDate(date));
    this.resetPagination();
  }

  goToday(): void {
    this.selectedDate.set(this.getToday());
    this.resetPagination();
  }

  onFilterChange(): void {
    this.resetPagination();
  }

  private resetPagination(): void {
    this.currentPage.set(1);
  }

  previousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }

  changeAppointmentStatus(id: string, status: AppointmentStatus): void {
    if (!this.isAdmin) {
      return;
    }

    try {
      this.database.updateAppointmentStatus(id, status);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Не удалось изменить статус записи',
      );
    }
  }

  openCreateModal(): void {
    if (!this.isAdmin) {
      return;
    }

    const modal = this.modalService.show(AppointmentModalComponent, {
      initialDate: this.selectedDate(),
      isAdmin: this.isAdmin,
      currentDoctorId: this.currentDoctorId,
    });

    modal?.pipe(take(1)).subscribe(() => {
      this.modalService.remove();
    });
  }

  openEditModal(appointment: Appointment): void {
    if (!this.isAdmin) {
      return;
    }

    const modal = this.modalService.show(AppointmentModalComponent, {
      appointment,
      isAdmin: this.isAdmin,
      currentDoctorId: this.currentDoctorId,
    });

    modal?.pipe(take(1)).subscribe(() => {
      this.modalService.remove();
    });
  }

  getStatusLabel(status: AppointmentStatus): string {
    return this.statuses.find((item) => item.value === status)?.label ?? status;
  }

  getStatusClass(status: AppointmentStatus): string {
    return status.toLowerCase().replace('_', '-');
  }

  getDoctorInitials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
  }
}

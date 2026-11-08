import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MockDatabaseService } from '../../data/storage/mocks/mock-database';
import { Appointment } from '../../data/storage/appointment.model';

import { phoneValidator } from '../../data/shared-data/validators/phone.validator';

import { workingHoursValidator } from '../../data/modal-data/validators/working-hours.validator';
import { appointmentConflictValidator } from '../../data/modal-data/validators/appointment-conflict.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-appointment-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './appointment-modal.component.html',
  styleUrl: './appointment-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentModalComponent {
  private readonly database = inject(MockDatabaseService);
  private readonly fb = inject(FormBuilder);

  readonly initialDate = input('');
  readonly isAdmin = input(false);
  readonly currentDoctorId = input<string | null>(null);
  readonly appointment = input<Appointment | null>(null);

  readonly onclose = output<boolean>();

  readonly doctors = this.database.doctors;
  readonly services = this.database.services;

  readonly errorMessage = signal('');

  readonly isEditMode = computed(() => !!this.appointment());

  readonly form = this.fb.nonNullable.group(
    {
      patientName: ['', [Validators.required, Validators.minLength(2)]],
      patientPhone: ['', [Validators.required, phoneValidator()]],
      doctorId: ['', Validators.required],
      serviceId: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
    },
    {
      validators: [
        workingHoursValidator(() => this.services()),

        appointmentConflictValidator(
          () => this.database.appointments(),
          () => this.services(),
          () => this.appointment()?.id ?? null,
        ),
      ],
    },
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.errorMessage.set('');
    });

    effect(() => {
      const appointment = this.appointment();
      const initialDate = this.initialDate();
      const isAdmin = this.isAdmin();
      const currentDoctorId = this.currentDoctorId();

      untracked(() => {
        this.errorMessage.set('');

        if (appointment) {
          const patient = this.database
            .patients()
            .find((item) => item.id === appointment.patientId);

          this.form.reset({
            patientName: patient?.fullName ?? '',
            patientPhone: patient?.phone ?? '',
            doctorId: appointment.doctorId,
            serviceId: appointment.serviceId,
            date: appointment.date,
            time: appointment.time,
          });

          return;
        }

        this.form.reset({
          patientName: '',
          patientPhone: '',
          doctorId: isAdmin ? '' : (currentDoctorId ?? ''),
          serviceId: '',
          date: initialDate,
          time: '',
        });
      });
    });
  }

  save(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.setValidationMessage();
      return;
    }

    const { patientName, patientPhone, doctorId, serviceId, date, time } =
      this.form.getRawValue();

    const name = patientName.trim();
    const phone = patientPhone.trim();

    if (!name || !phone) {
      this.errorMessage.set('Заполните все поля.');
      return;
    }

    const doctor = this.doctors().find((item) => item.id === doctorId);

    if (!doctor) {
      this.errorMessage.set('Выбранный врач не найден.');
      return;
    }

    const service = this.services().find((item) => item.id === serviceId);

    if (!service) {
      this.errorMessage.set('Выбранная услуга не найдена.');
      return;
    }

    try {
      const patient = this.database.createPatient({
        fullName: name,
        phone,
      });

      const appointmentData: Omit<Appointment, 'id'> = {
        patientId: patient.id,
        doctorId,
        serviceId,
        date,
        time,
        status: this.appointment()?.status ?? 'SCHEDULED',
      };

      const existingAppointment = this.appointment();

      if (existingAppointment) {
        this.database.updateAppointment(
          existingAppointment.id,
          appointmentData,
        );
      } else {
        this.database.createAppointment(appointmentData);
      }

      this.close(true);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Не удалось сохранить запись.',
      );
    }
  }

  close(created = false): void {
    this.onclose.emit(created);
  }

  private setValidationMessage(): void {
    if (this.form.hasError('outsideWorkingHours')) {
      this.errorMessage.set(
        'Время приёма должно быть в пределах рабочего дня с 08:00 до 17:00 с учётом длительности услуги.',
      );
      return;
    }

    if (this.form.hasError('appointmentConflict')) {
      this.errorMessage.set(
        'У этого врача уже есть запись на выбранное время. Выберите другое время.',
      );
      return;
    }

    if (this.form.hasError('invalidTime')) {
      this.errorMessage.set('Укажите корректное время.');
      return;
    }

    if (this.form.controls.patientPhone.hasError('invalidPhone')) {
      this.errorMessage.set('Введите корректный номер телефона.');
      return;
    }

    this.errorMessage.set('Заполните все обязательные поля.');
  }
}

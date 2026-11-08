import { Injectable, signal } from '@angular/core';

import { StorageService } from '../storage.service';
import { STORAGE_KEYS } from '../storage-keys';
import { SEED_DATA } from './seed-data';

import {
  Appointment,
  AppointmentStatus,
  Doctor,
  Patient,
  ClinicService,
} from '../appointment.model';

@Injectable({
  providedIn: 'root',
})
export class MockDatabaseService {
  private readonly INITIALIZED_KEY = 'clinic_initialized';

  // Reactive state

  private readonly appointmentsState = signal<Appointment[]>([]);
  private readonly doctorsState = signal<Doctor[]>([]);
  private readonly patientsState = signal<Patient[]>([]);
  private readonly servicesState = signal<ClinicService[]>([]);

  readonly appointments = this.appointmentsState.asReadonly();
  readonly doctors = this.doctorsState.asReadonly();
  readonly patients = this.patientsState.asReadonly();
  readonly services = this.servicesState.asReadonly();

  constructor(private readonly storage: StorageService) {
    this.syncFromStorage();
  }

  // Initialization

  initialize(): void {
    const initialized = localStorage.getItem(this.INITIALIZED_KEY);

    if (!initialized) {
      this.storage.set(STORAGE_KEYS.USERS, SEED_DATA.users);
      this.storage.set(STORAGE_KEYS.DOCTORS, SEED_DATA.doctors);
      this.storage.set(STORAGE_KEYS.PATIENTS, SEED_DATA.patients);
      this.storage.set(STORAGE_KEYS.SERVICES, SEED_DATA.services);
      this.storage.set(STORAGE_KEYS.APPOINTMENTS, SEED_DATA.appointments);

      localStorage.setItem(this.INITIALIZED_KEY, 'true');
    }

    this.syncFromStorage();
  }

  private syncFromStorage(): void {
    this.appointmentsState.set(
      this.storage.get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS) ?? [],
    );

    this.doctorsState.set(
      this.storage.get<Doctor[]>(STORAGE_KEYS.DOCTORS) ?? [],
    );

    this.patientsState.set(
      this.storage.get<Patient[]>(STORAGE_KEYS.PATIENTS) ?? [],
    );

    this.servicesState.set(
      this.storage.get<ClinicService[]>(STORAGE_KEYS.SERVICES) ?? [],
    );
  }

  // Getters

  getAppointments(): Appointment[] {
    return this.appointments();
  }

  getDoctors(): Doctor[] {
    return this.doctors();
  }

  getPatients(): Patient[] {
    return this.patients();
  }

  getServices(): ClinicService[] {
    return this.services();
  }

  // Appointments

  createAppointment(data: Omit<Appointment, 'id'>): Appointment {
    this.assertNoTimeConflict(data);

    const appointment: Appointment = {
      ...data,
      id: this.generateId(),
    };

    const appointments = [...this.appointments(), appointment];

    this.storage.set(STORAGE_KEYS.APPOINTMENTS, appointments);
    this.appointmentsState.set(appointments);

    return appointment;
  }

  updateAppointment(
    id: string,
    changes: Partial<Omit<Appointment, 'id'>>,
  ): Appointment | null {
    const appointments = this.appointments();
    const index = appointments.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updatedAppointment: Appointment = {
      ...appointments[index],
      ...changes,
      id,
    };

    this.assertNoTimeConflict(updatedAppointment, id);

    const updatedAppointments = [...appointments];
    updatedAppointments[index] = updatedAppointment;

    this.storage.set(STORAGE_KEYS.APPOINTMENTS, updatedAppointments);
    this.appointmentsState.set(updatedAppointments);

    return updatedAppointment;
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
  ): Appointment | null {
    return this.updateAppointment(id, { status });
  }

  cancelAppointment(id: string): Appointment | null {
    return this.updateAppointment(id, {
      status: 'CANCELLED',
    });
  }

  // Patients

  createPatient(data: Omit<Patient, 'id'>): Patient {
    const patients = this.patients();

    const existingPatient = patients.find(
      (patient) => patient.phone === data.phone,
    );

    if (existingPatient) {
      const updatedPatient: Patient = {
        ...existingPatient,
        fullName: data.fullName,
      };

      const updatedPatients = patients.map((patient) =>
        patient.id === existingPatient.id ? updatedPatient : patient,
      );

      this.storage.set(STORAGE_KEYS.PATIENTS, updatedPatients);
      this.patientsState.set(updatedPatients);

      return updatedPatient;
    }

    const patient: Patient = {
      ...data,
      id: `patient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };

    const updatedPatients = [...patients, patient];

    this.storage.set(STORAGE_KEYS.PATIENTS, updatedPatients);
    this.patientsState.set(updatedPatients);

    return patient;
  }

  // Validation

  private assertNoTimeConflict(
    appointment: Omit<Appointment, 'id'> | Appointment,
    excludeId?: string,
  ): void {
    const services = this.services();

    const service = services.find(
      (item) => item.id === appointment.serviceId,
    );

    if (!service) {
      throw new Error('Выбранная услуга не найдена.');
    }

    const [hours, minutes] = appointment.time.split(':').map(Number);

    const start = hours * 60 + minutes;
    const end = start + service.duration;

    const WORK_START = 8 * 60;
    const WORK_END = 17 * 60;

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(minutes) ||
      start < WORK_START ||
      end > WORK_END
    ) {
      throw new Error(
        'Время приёма должно быть в пределах 08:00–17:00.',
      );
    }

    // Отменённая запись не занимает время врача
    if (appointment.status === 'CANCELLED') {
      return;
    }

    const hasConflict = this.appointments().some((item) => {
      if (
        item.id === excludeId ||
        item.doctorId !== appointment.doctorId ||
        item.date !== appointment.date ||
        item.status === 'CANCELLED'
      ) {
        return false;
      }

      const existingService = services.find(
        (serviceItem) => serviceItem.id === item.serviceId,
      );

      const existingDuration = existingService?.duration ?? 30;

      const [existingHours, existingMinutes] = item.time
        .split(':')
        .map(Number);

      const existingStart = existingHours * 60 + existingMinutes;
      const existingEnd = existingStart + existingDuration;

      return start < existingEnd && existingStart < end;
    });

    if (hasConflict) {
      throw new Error(
        'У этого врача уже есть запись на выбранное время.',
      );
    }
  }

  // Utilities

  private generateId(): string {
    return `appointment-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  reset(): void {
    this.storage.clear();
    this.initialize();
  }
}

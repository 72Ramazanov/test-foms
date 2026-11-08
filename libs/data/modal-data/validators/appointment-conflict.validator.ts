import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { ClinicService, Appointment } from '../../storage/appointment.model';

export function appointmentConflictValidator(
  getAppointments: () => Appointment[],
  getServices: () => ClinicService[],
  getCurrentAppointmentId: () => string | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const doctorId = control.get('doctorId')?.value;
    const serviceId = control.get('serviceId')?.value;
    const date = control.get('date')?.value;
    const time = control.get('time')?.value;

    if (!doctorId || !serviceId || !date || !time) {
      return null;
    }

    const services = getServices();

    const newService = services.find(
      (item) => item.id === serviceId,
    );

    if (!newService) {
      return null;
    }

    const [hours, minutes] = String(time).split(':').map(Number);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const newStart = hours * 60 + minutes;
    const newEnd = newStart + newService.duration;

    const currentAppointmentId = getCurrentAppointmentId();

    const conflict = getAppointments().find((appointment) => {
      if (
        appointment.id === currentAppointmentId ||
        appointment.doctorId !== doctorId ||
        appointment.date !== date ||
        appointment.status === 'CANCELLED'
      ) {
        return false;
      }

      const existingService = services.find(
        (item) => item.id === appointment.serviceId,
      );

      const existingDuration = existingService?.duration ?? 30;

      const existingStart = thisToMinutes(appointment.time);

      if (!Number.isFinite(existingStart)) {
        return false;
      }

      const existingEnd = existingStart + existingDuration;

      return newStart < existingEnd && existingStart < newEnd;
    });

    return conflict
      ? { appointmentConflict: true }
      : null;
  };
}

function thisToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }

  return hours * 60 + minutes;
}

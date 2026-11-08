import { ClinicService } from './../../storage/appointment.model';

import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';


export function workingHoursValidator(
  getServices: () => ClinicService[],
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const time = control.get('time')?.value;
    const serviceId = control.get('serviceId')?.value;

    if (!time || !serviceId) {
      return null;
    }

    const service = getServices().find(
      (item) => item.id === serviceId,
    );

    if (!service) {
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
      return { invalidTime: true };
    }

    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration;

    const WORK_START = 8 * 60;
    const WORK_END = 17 * 60;

    if (
      startMinutes < WORK_START ||
      endMinutes > WORK_END
    ) {
      return {
        outsideWorkingHours: {
          start: '08:00',
          end: '17:00',
        },
      };
    }

    return null;
  };
}

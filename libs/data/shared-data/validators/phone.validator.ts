
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const phone = String(control.value ?? '');

    if (!phone) {
      return null;
    }

    const digits = phone.replace(/\D/g, '');

    return digits.length >= 10
      ? null
      : { invalidPhone: true };
  };
}

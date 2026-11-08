export type AppointmentStatus =
  | 'SCHEDULED'
  | 'ACCEPTED'
  | 'CANCELLED'
  | 'NO_SHOW';

  
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  phone: string;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
}

export interface ClinicService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

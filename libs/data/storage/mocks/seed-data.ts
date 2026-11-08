
export const SEED_DATA = {
  users: [
    {
      id: 'user-1',
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      doctorId: null,
      fullName: 'Кристиано Роналдо',
    },
    {
      id: 'user-2',
      username: 'doctor',
      password: 'doctor123',
      role: 'DOCTOR',
      doctorId: 'doctor-1',
      fullName: 'Иванов Иван Иванович',
    },
    {
      id: 'user-3',
      username: 'doctor2',
      password: 'doctor123',
      role: 'DOCTOR',
      doctorId: 'doctor-2',
      fullName: 'Петров Петр Петрович',
    },
    {
      id: 'user-4',
      username: 'doctor3',
      password: 'doctor123',
      role: 'DOCTOR',
      doctorId: 'doctor-3',
      fullName: 'Сидорова Анна Сергеевна',
    },
    {
      id: 'user-5',
      username: 'doctor4',
      password: 'doctor123',
      role: 'DOCTOR',
      doctorId: 'doctor-4',
      fullName: 'Соколов Алексей Викторович',
    },
    {
      id: 'user-6',
      username: 'doctor5',
      password: 'doctor123',
      role: 'DOCTOR',
      doctorId: 'doctor-5',
      fullName: 'Морозова Елена Андреевна',
    },
  ],

  doctors: [
    {
      id: 'doctor-1',
      fullName: 'Иванов Иван Иванович',
      specialization: 'Терапевт',
      phone: '+79990000001',
    },
    {
      id: 'doctor-2',
      fullName: 'Петров Петр Петрович',
      specialization: 'Кардиолог',
      phone: '+79990000002',
    },
    {
      id: 'doctor-3',
      fullName: 'Сидорова Анна Сергеевна',
      specialization: 'Невролог',
      phone: '+79990000003',
    },
    {
      id: 'doctor-4',
      fullName: 'Соколов Алексей Викторович',
      specialization: 'Хирург',
      phone: '+79990000004',
    },
    {
      id: 'doctor-5',
      fullName: 'Морозова Елена Андреевна',
      specialization: 'Педиатр',
      phone: '+79990000005',
    },
  ],

  patients: [
    {
      id: 'patient-1',
      fullName: 'Александр Смирнов',
      phone: '+79991111111',
    },
    {
      id: 'patient-2',
      fullName: 'Мария Кузнецова',
      phone: '+79992222222',
    },
    {
      id: 'patient-3',
      fullName: 'Дмитрий Попов',
      phone: '+79993333333',
    },
  ],

  services: [
    {
      id: 'service-1',
      name: 'Первичный приём',
      duration: 30,
      price: 2000,
    },
    {
      id: 'service-2',
      name: 'Повторный приём',
      duration: 20,
      price: 1500,
    },
    {
      id: 'service-3',
      name: 'Консультация',
      duration: 45,
      price: 3000,
    },
    {
      id: 'service-4',
      name: 'ЭКГ',
      duration: 20,
      price: 1200,
    },
    {
      id: 'service-5',
      name: 'УЗИ',
      duration: 40,
      price: 2500,
    },
  ],

  appointments: [
    {
      id: 'appointment-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      serviceId: 'service-1',
      date: '2026-11-07',
      time: '09:00',
      status: 'SCHEDULED',
    },
    {
      id: 'appointment-2',
      patientId: 'patient-2',
      doctorId: 'doctor-1',
      serviceId: 'service-2',
      date: '2026-11-07',
      time: '10:00',
      status: 'ACCEPTED',
    },
    {
      id: 'appointment-3',
      patientId: 'patient-3',
      doctorId: 'doctor-2',
      serviceId: 'service-3',
      date: '2026-11-07',
      time: '11:00',
      status: 'CANCELLED',
    },
  ],
};

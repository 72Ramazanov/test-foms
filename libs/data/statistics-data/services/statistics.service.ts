import { Injectable, inject } from '@angular/core';
import { MockDatabaseService } from '../../storage/mocks/mock-database';
import { AuthService } from '../../auth-data/auth.service';
import {
  AppointmentStatus,
  Appointment,
} from '../../storage/appointment.model';
import {
  StatisticsPeriod,
  StatisticsSummary,
  DoctorStatistics,
  ServiceStatistics,
  DailyChartItem,
  DoctorChartItem,
  ServiceChartItem,
} from '../interfaces/statistics.model';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private readonly database = inject(MockDatabaseService);
  private readonly authService = inject(AuthService);

  getPeriodDates(period: StatisticsPeriod): {
    start: string;
    end: string;
  } {
    const today = new Date();

    const start = new Date(today);
    const end = new Date(today);

    if (period === 'WEEK') {
      const day = today.getDay();
      const daysFromMonday = day === 0 ? 6 : day - 1;

      start.setDate(today.getDate() - daysFromMonday);
      end.setDate(start.getDate() + 6);
    } else {
      start.setDate(1);
      end.setMonth(today.getMonth() + 1, 0);
    }

    return {
      start: this.formatDate(start),
      end: this.formatDate(end),
    };
  }

  getAppointments(period: StatisticsPeriod): Appointment[] {
    const dates = this.getPeriodDates(period);
    const user = this.authService.getCurrentUser();

    return this.database.appointments().filter((appointment) => {
      const isInPeriod =
        appointment.date >= dates.start && appointment.date <= dates.end;

      const isAllowedDoctor =
        user?.role !== 'DOCTOR' || appointment.doctorId === user.doctorId;

      return isInPeriod && isAllowedDoctor;
    });
  }

  getSummary(period: StatisticsPeriod): StatisticsSummary {
    const appointments = this.getAppointments(period);

    const accepted = this.countStatus(appointments, 'ACCEPTED');
    const cancelled = this.countStatus(appointments, 'CANCELLED');
    const noShow = this.countStatus(appointments, 'NO_SHOW');
    const scheduled = this.countStatus(appointments, 'SCHEDULED');

    return {
      total: appointments.length,
      accepted,
      cancelled,
      noShow,
      scheduled,
      averageLoad: this.getAverageLoad(appointments, period),
    };
  }

  getDoctorsStatistics(period: StatisticsPeriod): DoctorStatistics[] {
    const appointments = this.getAppointments(period);
    const doctors = this.database.doctors();
    const user = this.authService.getCurrentUser();

    const visibleDoctors =
      user?.role === 'DOCTOR'
        ? doctors.filter((doctor) => doctor.id === user.doctorId)
        : doctors;

    return visibleDoctors.map((doctor) => {
      const doctorAppointments = appointments.filter(
        (item) => item.doctorId === doctor.id,
      );

      return {
        id: doctor.id,
        name: doctor.fullName,
        total: doctorAppointments.length,
        accepted: this.countStatus(doctorAppointments, 'ACCEPTED'),
        cancelled: this.countStatus(doctorAppointments, 'CANCELLED'),
        noShow: this.countStatus(doctorAppointments, 'NO_SHOW'),
      };
    });
  }

  getServicesStatistics(period: StatisticsPeriod): ServiceStatistics[] {
    const appointments = this.getAppointments(period);
    const services = this.database.services();

    return services.map((service) => {
      const serviceAppointments = appointments.filter(
        (item) => item.serviceId === service.id,
      );

      return {
        id: service.id,
        name: service.name,
        total: serviceAppointments.length,
        accepted: this.countStatus(serviceAppointments, 'ACCEPTED'),
        cancelled: this.countStatus(serviceAppointments, 'CANCELLED'),
      };
    });
  }

  private countStatus(
    appointments: Appointment[],
    status: AppointmentStatus,
  ): number {
    return appointments.filter((appointment) => appointment.status === status)
      .length;
  }

  private getAverageLoad(
    appointments: Appointment[],
    period: StatisticsPeriod,
  ): number {
    const dates = this.getPeriodDates(period);

    const start = new Date(`${dates.start}T00:00:00`);
    const end = new Date(`${dates.end}T00:00:00`);

    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    const user = this.authService.getCurrentUser();

    const doctorsCount =
      user?.role === 'DOCTOR' ? 1 : this.database.doctors().length;

    if (!doctorsCount || !days) return 0;

    const workingMinutes = days * doctorsCount * 9 * 60;
    const services = this.database.services();

    const occupiedMinutes = appointments.reduce((total, appointment) => {
      if (appointment.status === 'CANCELLED') {
        return total;
      }

      const service = services.find(
        (item) => item.id === appointment.serviceId,
      );

      return total + (service?.duration ?? 0);
    }, 0);

    return Math.round((occupiedMinutes / workingMinutes) * 100);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getDailyChart(period: StatisticsPeriod): DailyChartItem[] {
    const dates = this.getPeriodDates(period);
    const appointments = this.getAppointments(period);

    const start = new Date(`${dates.start}T12:00:00`);
    const end = new Date(`${dates.end}T12:00:00`);

    const result: DailyChartItem[] = [];

    const formatter = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
    });

    for (
      const date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateString = this.formatDate(date);

      result.push({
        label: formatter.format(date),
        total: appointments.filter((item) => item.date === dateString).length,
      });
    }

    return result;
  }

  getDoctorChart(period: StatisticsPeriod): DoctorChartItem[] {
    const appointments = this.getAppointments(period);
    const doctors = this.database.doctors();
    const user = this.authService.getCurrentUser();

    const visibleDoctors =
      user?.role === 'DOCTOR'
        ? doctors.filter((doctor) => doctor.id === user.doctorId)
        : doctors;

    return visibleDoctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.fullName,
      total: appointments.filter((item) => item.doctorId === doctor.id).length,
    }));
  }

  getServiceChart(period: StatisticsPeriod): ServiceChartItem[] {
    const appointments = this.getAppointments(period);
    const services = this.database.services();

    const colors = [
      '#3478ed',
      '#25965a',
      '#8754bb',
      '#e6a23c',
      '#e05b5b',
      '#18a5a5',
      '#647084',
    ];

    const result = services
      .map((service, index) => {
        const total = appointments.filter(
          (item) => item.serviceId === service.id,
        ).length;

        return {
          id: service.id,
          name: service.name,
          total,
          percentage: 0,
          color: colors[index % colors.length],
        };
      })
      .filter((item) => item.total > 0);

    const totalAppointments = result.reduce((sum, item) => sum + item.total, 0);

    return result.map((item) => ({
      ...item,
      percentage: totalAppointments
        ? Math.round((item.total / totalAppointments) * 100)
        : 0,
    }));
  }
}

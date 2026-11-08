
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../data/auth-data/auth.service';
import { StatisticsService } from '../../data/statistics-data/services/statistics.service';
import {
  StatisticsGrouping,
  StatisticsPeriod,
} from '../../data/statistics-data/interfaces/statistics.model';

import { BarChartComponent } from '../../common-ui/components/bar-chart/bar-chart.component';
import { DoughnutChartComponent } from '../../common-ui/components/doughnut-chart/doughnut-chart.component';
import { SvgIconComponent } from '../../common-ui/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    FormsModule,
    BarChartComponent,
    DoughnutChartComponent,
    SvgIconComponent
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent {
  private readonly statisticsService = inject(StatisticsService);
  private readonly authService = inject(AuthService);

  readonly user = this.authService.getCurrentUser();
  readonly isDoctor = this.user?.role === 'DOCTOR';

  readonly period = signal<StatisticsPeriod>('WEEK');
  readonly grouping = signal<StatisticsGrouping>('DOCTORS');


  readonly summary = computed(() =>
    this.statisticsService.getSummary(this.period()),
  );

  readonly doctorsStatistics = computed(() =>
    this.statisticsService.getDoctorsStatistics(this.period()),
  );

  readonly servicesStatistics = computed(() =>
    this.statisticsService.getServicesStatistics(this.period()),
  );


  readonly dailyChart = computed(() =>
    this.statisticsService.getDailyChart(this.period()),
  );

  readonly doctorChart = computed(() =>
    this.statisticsService.getDoctorChart(this.period()),
  );

  readonly serviceChart = computed(() =>
    this.statisticsService.getServiceChart(this.period()),
  );

  readonly dailyChartLabels = computed(() =>
    this.dailyChart().map((item) => item.label),
  );

  readonly dailyChartData = computed(() =>
    this.dailyChart().map((item) => item.total),
  );

  readonly doctorChartLabels = computed(() =>
    this.doctorChart().map((item) => item.name),
  );

  readonly doctorChartData = computed(() =>
    this.doctorChart().map((item) => item.total),
  );


  readonly serviceChartLabels = computed(() =>
    this.serviceChart().map((item) => item.name),
  );

  readonly serviceChartData = computed(() =>
    this.serviceChart().map((item) => item.total),
  );

  readonly serviceChartColors = computed(() =>
    this.serviceChart().map((item) => item.color),
  );


  readonly periodLabel = computed(() => {
    const { start, end } = this.statisticsService.getPeriodDates(
      this.period(),
    );

    const format = (date: string): string => {
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}`;
    };

    return `${format(start)} — ${format(end)}`;
  });

  getDoctorInitials(fullName: string): string {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  changePeriod(period: StatisticsPeriod): void {
    this.period.set(period);
  }

  changeGrouping(grouping: StatisticsGrouping): void {
    this.grouping.set(grouping);
  }
}


import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './doughnut-chart.component.html',
  styleUrl: './doughnut-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoughnutChartComponent {
  readonly labels = input<string[]>([]);
  readonly data = input<number[]>([]);
  readonly colors = input<string[]>([]);

  readonly chartData = computed<
    ChartConfiguration<'doughnut'>['data']
  >(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.data(),
        backgroundColor: this.data().map(
          (_, index) => this.colors()[index] ?? '#3478ed',
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  }));

  readonly chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  readonly hasData = computed(
    () => this.data().length > 0 && this.data().some((value) => value > 0),
  );
}

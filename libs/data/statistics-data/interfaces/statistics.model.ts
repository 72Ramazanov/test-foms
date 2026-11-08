export type StatisticsPeriod = 'WEEK' | 'MONTH';
export type StatisticsGrouping = 'DOCTORS' | 'SERVICES';

export interface StatisticsSummary {
  total: number;
  accepted: number;
  cancelled: number;
  noShow: number;
  scheduled: number;
  averageLoad: number;
}

export interface DoctorStatistics {
  id: string;
  name: string;
  total: number;
  accepted: number;
  cancelled: number;
  noShow: number;
}

export interface ServiceStatistics {
  id: string;
  name: string;
  total: number;
  accepted: number;
  cancelled: number;
}

export interface DailyChartItem {
  label: string;
  total: number;
}

export interface DoctorChartItem {
  id: string;
  name: string;
  total: number;
}

export interface ServiceChartItem {
  id: string;
  name: string;
  total: number;
  percentage: number;
  color: string;
}

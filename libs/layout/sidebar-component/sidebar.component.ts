import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../data/auth-data/auth.service';
import { SvgIconComponent } from '../../common-ui/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SvgIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  readonly user = signal(this.authService.getCurrentUser());

  readonly roleName = computed(() => {
    switch (this.user()?.role) {
      case 'ADMIN':
        return 'Администратор';

      case 'DOCTOR':
        return 'Врач';

      default:
        return 'Пользователь';
    }
  });

  readonly initials = computed(() => {
    return (
      this.user()
        ?.fullName?.split(' ')
        .map((part) => part[0])
        .join(' ')
        .slice(0, 3)
        .toUpperCase() ?? ''
    );
  });

  readonly menuItems = [
    {
      title: 'Расписание',
      route: '/schedule',
      icon: 'schedule',
      enabled: true,
    },
    {
      title: 'Статистика',
      route: '/statistics',
      icon: 'statistics',
      enabled: true,
    },
    {
      title: 'Врачи',
      route: '/doctors',
      icon: 'doctors',
      enabled: false,
    },
    {
      title: 'Услуги',
      route: '/procedures',
      icon: 'procedures',
      enabled: false,
    },
    {
      title: 'Настройки',
      route: '/settings',
      icon: 'settings',
      enabled: false,
    },
  ];
}

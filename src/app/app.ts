import { Component } from '@angular/core';
import { NotificationFormComponent } from './components/notification-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NotificationFormComponent],
  template: '<app-notification-form></app-notification-form>',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'snas-frontend';
}

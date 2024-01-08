import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  styleUrl: './app.component.css',
  template: `
  <h1>Hello, {{ title }}</h1>
  <p>Congratulations! Your app is running. 🎉</p>
  <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'angular-signals';
}

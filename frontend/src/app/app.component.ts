import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule]
})
export class AppComponent implements OnInit {
  title = 'Verdalia';
  currentYear: number = new Date().getFullYear();

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    // No se necesitan suscripciones aquí, ya que las maneja el componente de la barra de navegación
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent {
  constructor(private router: Router) {}
  
  navigateWithFilter(tipoPlanta: string): void {
    // Navegar a la página de productos y pasar el filtro como parámetro de consulta
    this.router.navigate(['/products'], { 
      queryParams: { tipoPlanta: tipoPlanta } 
    });
  }
}

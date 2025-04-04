import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [NgFor, NgIf],
  standalone: true
})
export class ProductsComponent implements OnInit {
  productos: any[] = []; // Array para almacenar los productos

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getProducts().subscribe({
      next: (data) => {
        console.log("Productos obtenidos:", data); // 🔹 Verifica que los datos lleguen
        this.productos = data;
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
      }
    });
  }
}

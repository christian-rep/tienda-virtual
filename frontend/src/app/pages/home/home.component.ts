import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  
  categories: Category[] = [
    {
      id: 'interior',
      name: 'Plantas de Interior',
      description: 'Perfectas para decorar y purificar el aire de tu hogar.',
      image: 'assets/images/optimized-categories/categories/interior.jpg'
    },
    {
      id: 'exterior',
      name: 'Plantas de Exterior',
      description: 'Ideales para jardines, terrazas y balcones.',
      image: 'assets/images/optimized-categories/categories/exterior.jpg'
    },
    {
      id: 'suculenta',
      name: 'Suculentas',
      description: 'Plantas de bajo mantenimiento y gran belleza.',
      image: 'assets/images/optimized-categories/categories/suculenta.jpg'
    },
    {
      id: 'cactus',
      name: 'Cactus',
      description: 'Ideales para espacios con poca agua y mucho sol.',
      image: 'assets/images/optimized-categories/categories/interior.jpg'
    },
    {
      id: 'orquidea',
      name: 'Orquídeas',
      description: 'Elegancia y belleza exótica para tu hogar.',
      image: 'assets/images/optimized-categories/categories/exterior.jpg'
    },
    {
      id: 'bonsai',
      name: 'Bonsáis',
      description: 'El arte milenario de miniaturizar árboles.',
      image: 'assets/images/optimized-categories/categories/suculenta.jpg'
    }
  ];

  imagePath = {
    interior: 'assets/images/optimized-categories/categories/interior.jpg',
    exterior: 'assets/images/optimized-categories/categories/exterior.jpg',
    suculenta: 'assets/images/optimized-categories/categories/suculenta.jpg',
    cactus: 'assets/images/optimized-categories/categories/interior.jpg',
    orquidea: 'assets/images/optimized-categories/categories/exterior.jpg',
    bonsai: 'assets/images/optimized-categories/categories/suculenta.jpg'
  };
  
  ngOnInit(): void {
    // Verificar la existencia de las imágenes
    this.categories.forEach(category => {
      this.checkImageExists(category.image);
    });
  }
  
  checkImageExists(imageSrc: string): void {
    const img = new Image();
    img.onload = () => {
      console.log(`La imagen ${imageSrc} existe y cargó correctamente`);
    };
    img.onerror = () => {
      console.error(`Error al cargar la imagen ${imageSrc}`);
      // Aquí podrías establecer una imagen por defecto
      this.setDefaultImage(imageSrc);
    };
    img.src = imageSrc;
  }

  setDefaultImage(failedImageSrc: string): void {
    // Establecer una imagen por defecto para la categoría que falló
    const defaultImage = 'assets/images/optimized-categories/categories/interior.jpg';
    (Object.keys(this.imagePath) as Array<keyof typeof this.imagePath>).forEach(key => {
      if (this.imagePath[key] === failedImageSrc) {
        this.imagePath[key] = defaultImage;
      }
    });
  }
  
  navigateWithFilter(filter: string): void {
    this.router.navigate(['/products'], { 
      queryParams: { tipoPlanta: filter } 
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../interfaces/product.interface';
import { Router } from '@angular/router';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendations?: Product[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  chatForm: FormGroup;
  loading = false;
  plantas: Product[] = [];

  constructor(
    private http: HttpClient,
    private productsService: ProductsService,
    private router: Router
  ) {
    this.chatForm = new FormGroup({
      message: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    // Mensaje de bienvenida
    this.messages.push({
      text: '¡Hola! Soy el asistente virtual de Planta-TA. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre plantas que se adapten a tus necesidades, como "Necesito una planta que requiera poca luz" o "¿Qué plantas son buenas para principiantes?"',
      isUser: false,
      timestamp: new Date()
    });

    // Cargar todas las plantas
    this.productsService.getProducts().subscribe({
      next: (data) => {
        this.plantas = data;
      },
      error: (error) => {
        console.error('Error al cargar plantas:', error);
      }
    });
  }

  sendMessage(): void {
    if (this.chatForm.invalid || this.loading) {
      return;
    }

    const userMessage = this.chatForm.value.message;
    
    // Añadir mensaje del usuario
    this.messages.push({
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    });

    this.loading = true;
    
    // Limpiar el formulario
    this.chatForm.reset();

    // Procesamiento local para búsqueda de plantas
    setTimeout(() => {
      this.processLocalQuery(userMessage);
    }, 800);
  }

  processLocalQuery(query: string): void {
    query = query.toLowerCase();
    
    // Si hay pocas plantas, podemos permitirnos hacer una búsqueda completa en el cliente
    let plantasRecomendadas: Product[] = [];

    // Buscar por dificultad
    if (query.includes('principiante') || query.includes('fácil') || query.includes('facil') || query.includes('nueva') || query.includes('empezar')) {
      const filtradas = this.plantas.filter(planta => planta.nivel_dificultad === 'facil');
      if (plantasRecomendadas.length > 0) {
        plantasRecomendadas = plantasRecomendadas.filter(planta => filtradas.some(p => p.id === planta.id));
      } else {
        plantasRecomendadas = filtradas;
      }
    } else if (query.includes('intermedio') || query.includes('experiencia')) {
      const filtradas = this.plantas.filter(planta => planta.nivel_dificultad === 'medio');
      if (plantasRecomendadas.length > 0) {
        plantasRecomendadas = plantasRecomendadas.filter(planta => filtradas.some(p => p.id === planta.id));
      } else {
        plantasRecomendadas = filtradas;
      }
    } else if (query.includes('avanzado') || query.includes('experto') || query.includes('difícil') || query.includes('dificil')) {
      const filtradas = this.plantas.filter(planta => planta.nivel_dificultad === 'dificil');
      if (plantasRecomendadas.length > 0) {
        plantasRecomendadas = plantasRecomendadas.filter(planta => filtradas.some(p => p.id === planta.id));
      } else {
        plantasRecomendadas = filtradas;
      }
    }

    // Si no se encontraron plantas con los filtros, intentamos buscar en los nombres y descripciones
    if (plantasRecomendadas.length === 0) {
      const palabrasClave = query.split(' ').filter(palabra => palabra.length > 3);
      
      if (palabrasClave.length > 0) {
        plantasRecomendadas = this.plantas.filter(planta => {
          const nombreMatches = planta.nombre.toLowerCase().split(' ').some(palabra => palabrasClave.includes(palabra));
          const descripcionMatches = palabrasClave.some(palabra => planta.descripcion.toLowerCase().includes(palabra));
          const nombreCientificoMatches = planta.nombre_cientifico ? planta.nombre_cientifico.toLowerCase().split(' ').some(palabra => palabrasClave.includes(palabra)) : false;
          
          return nombreMatches || descripcionMatches || nombreCientificoMatches;
        });
      }
    }

    // Limitar a 5 recomendaciones
    plantasRecomendadas = plantasRecomendadas.slice(0, 5);

    // Crear respuesta del bot
    let botResponse = '';
    
    if (plantasRecomendadas.length > 0) {
      botResponse = `He encontrado ${plantasRecomendadas.length} plantas que podrían interesarte según tu consulta. Te las muestro a continuación:`;
    } else {
      botResponse = 'No he encontrado plantas que coincidan exactamente con tu consulta. Te sugiero revisar nuestro catálogo completo o intentar con diferentes criterios de búsqueda. También puedes preguntar por ejemplo: "plantas para principiantes" o "plantas de nivel fácil".';
      
      // Recomendar algunas plantas al azar como alternativa
      plantasRecomendadas = this.getRandomPlantas(3);
      
      if (plantasRecomendadas.length > 0) {
        botResponse += ' Sin embargo, aquí tienes algunas plantas populares:';
      }
    }

    this.messages.push({
      text: botResponse,
      isUser: false,
      timestamp: new Date(),
      recommendations: plantasRecomendadas
    });

    this.loading = false;
  }

  getRandomPlantas(count: number): Product[] {
    if (this.plantas.length <= count) {
      return [...this.plantas];
    }
    
    const shuffled = [...this.plantas].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  verDetallePlanta(planta: Product): void {
    this.router.navigate(['/planta', planta.id]);
  }
}

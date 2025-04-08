import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Componentes
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CartComponent } from './pages/cart/cart.component';
import { ChatComponent } from './pages/chat/chat.component';
import { PlantDetailsComponent } from './pages/plant-details/plant-details.component';

// Lazy loading para Products
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'carrito', component: CartComponent },
  { path: 'chat', component: ChatComponent },
  { 
    path: 'productos', 
    loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
  },
  { path: 'planta/:id', component: PlantDetailsComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
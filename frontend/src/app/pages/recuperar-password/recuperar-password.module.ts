import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecuperarPasswordComponent } from './recuperar-password.component';

@NgModule({
  declarations: [
    RecuperarPasswordComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    RecuperarPasswordComponent
  ]
})
export class RecuperarPasswordModule { } 
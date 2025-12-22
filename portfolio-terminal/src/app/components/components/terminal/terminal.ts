import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-terminal',
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.css',
})
export class Terminal{

  commandHistory: string[] = [];
  output: string[] = ['Bienvenido al portfolio de ceni. Escriba "help" para iniciar.'];
  currentCommand: string = '';

 
  private readonly commands: { [key: string]: string } = {
    help: 'Comandos disponibles: [about, projects, exit, clear]',
    about: 'Hola, soy Ceni, desarrollador apasionado por soluciones software en Angular y Linux.',
    projects: 'Proyectos destacados: [1. portfolio-terminal, 2. dev-environment]',
    clear: 'clear-screen',
    exit: 'Hasta luego. ¡Gracias por visitar mi portafolio!',
  };

  
  handleCommand() {
    const trimmedCommand = this.currentCommand.trim();

    if (trimmedCommand === 'clear') {
      this.commandHistory = [];
      this.output = [];
    } else {
      const response =
        this.commands[trimmedCommand] ||
        `Comando "${trimmedCommand}" no reconocido. Escriba "help" para obtener ayuda.`;

      this.commandHistory.push(`[ceni@nb-archceni ~]$ ${trimmedCommand}`); 
    }

    this.currentCommand = ''; 
  }


  handleKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.currentCommand.trim() !== '') {
      this.handleCommand();
    }
  }
}


import {Component, EventEmitter} from '@angular/core';
import { Rubrica } from './rubrica';
import {RubricasService} from './rubricas.service';
import {MaterializeAction} from 'angular2-materialize';
import {Router} from '@angular/router';

@Component({
  selector: 'app-rubricas',
  templateUrl: 'rubricas.component.html',
  styleUrls: ['rubricas.component.scss']
})
export class RubricasComponent {
  id: number;
  rubricas: Rubrica[];
  render = false;
  rubricaService: RubricasService;
  modalActions = new EventEmitter<string|MaterializeAction>();
  modalActions2 = new EventEmitter<string|MaterializeAction>();
  router: Router;
  constructor(rubricaService: RubricasService, router: Router) {
      this.router = router;
    this.rubricaService = rubricaService;
    rubricaService.getAllrubricas().subscribe(res => {
        this.rubricas = res;
      });
  }
  openModal() {
      this.render = true;
      this.modalActions.emit({action: 'modal', params: ['open']});
  }
  closeModal() {
      this.render = false;
      this.rubricaService.setValdity(true);
      this.modalActions.emit({action: 'modal', params: ['close']});
  }
  openModal2(id: number) {
    this.id = id;
    this.modalActions2.emit({action: 'modal', params: ['open']});
  }
  closeModal2() {
    this.rubricaService.setValdity(true);
    this.modalActions2.emit({action: 'modal', params: ['close']});
  }
  cadastraRubrica() {
      this.rubricaService.cadastrarRubrica().subscribe(res => {
          if (res === 'Rubrica Cadastrada Com sucesso !') {
              this.rubricaService.getAllrubricas().subscribe(res2 => {
                  this.rubricas.slice();
                  this.rubricas = res2;
                  this.closeModal();
              });
          }
      });
  }
  deletarRubrica() {
    this.rubricaService.apagarRubrica(this.id).subscribe(res => {
      if (res === 'Rubrica Apagada Com sucesso !') {
        this.rubricaService.getAllrubricas().subscribe(res2 => {
          this.rubricas.slice();
          this.rubricas = res2;
          this.closeModal2();
        });
      }
    });
  }
  editarRubrica(id: number): void {
      this.router.navigate(['/rubricas', id]);
  }
}

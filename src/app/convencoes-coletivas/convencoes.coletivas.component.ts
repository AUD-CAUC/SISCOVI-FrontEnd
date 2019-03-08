import {Component, EventEmitter} from '@angular/core';
import {Contrato} from '../contratos/contrato';
import {ConvencaoService} from './convencao.service';
import {Convencao} from './convencao';
import {MaterializeAction} from 'angular2-materialize';

@Component({
  selector: 'app-convencao-coletiva',
  templateUrl: 'convencoes-coletivas.component.html',
  styleUrls: ['convencoes.coletivas.component.scss']
})
export class ConvencoesColetivasComponent {
  contratos: Contrato[] = [];
  render = false;
  convencaoService: ConvencaoService;
  convencoes: Convencao[] = [];
  valid = false;
  index: number;
  modalActions = new EventEmitter<string | MaterializeAction>();

  constructor(convencaoService: ConvencaoService) {
    this.convencaoService = convencaoService;
    convencaoService.getAll().subscribe(res => {
      this.convencoes = res;
    });
  }

  /*onChange(value: number): void {
    this.convServ.getConvencoes(value).subscribe(res => {
      this.convencoes = res;
      this.valid = true;
      this.index = value - 1;
    });
  }*/
  openModal() {
    this.render = true;
    this.modalActions.emit({action: 'modal', params: ['open']});
  }

  closeModal() {
    this.render = false;
    this.convencaoService.setValdity(true);
    this.modalActions.emit({action: 'modal', params: ['close']});
  }

  cadastraConvencao() {
    this.convencaoService.cadastrarConvencao().subscribe(res => {
      if (res === 'Rubrica Cadastrada Com sucesso !') {
        this.convencaoService.getAll().subscribe(res2 => {
          this.convencoes.slice();
          this.convencoes = res2;
          this.closeModal();
        });
      }
    });
  }
}

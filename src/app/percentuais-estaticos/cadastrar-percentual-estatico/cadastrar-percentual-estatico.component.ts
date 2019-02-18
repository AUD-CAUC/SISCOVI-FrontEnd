import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {PercentualEstaticoService} from '../percentual-estatico.service';
import {ActivatedRoute, Router} from '@angular/router';
import {PercentualEstatico} from '../percentual-estatico';
import {MaterializeAction} from 'angular2-materialize';

@Component({
  selector: 'app-cadastrar-percentual-estatico',
  templateUrl: './cadastrar-percentual-estatico.component.html',
  styleUrls: ['./cadastrar-percentual-estatico.component.scss']
})
export class CadastrarPercentualEstaticoComponent implements OnInit {
  percentualEstaticoForm: FormGroup;
  router: Router;
  route: ActivatedRoute;
  percentualEstatico: PercentualEstatico;
  percentualEstaticoService: PercentualEstaticoService;
  ultimaData: String[] = [];
  id: number;
  notValidEdit = true;
  percentList: PercentualEstatico[] = [];
  @Input() percent: PercentualEstatico[];
  private codigoRubrica: any;
  constructor(private fb: FormBuilder, percentualEstaticoService: PercentualEstaticoService, route: ActivatedRoute, router: Router) {
    this.router = router;
    this.route = route;
    this.percentualEstaticoService = percentualEstaticoService;




    // this.percent.forEach( (percentual) => {
    //   if (percentual.dataFim === null) {
    //     this.ultimaData[percentual.nome] = percentual.dataInicio;
    //   }
    // });
  }
  ngOnInit(): void {
    let i = 0;
    this.percent.forEach( (percentual) => {
      if (percentual.dataFim === '-') {
        this.ultimaData[percentual.codigo] = percentual.dataInicio;
        this.percentList[i++] = percentual;
      }
    });
    this.percentualEstaticoForm = this.fb.group({
      codigo: new FormControl('', [Validators.required]),
      percentual: new FormControl('', [Validators.required]),
      dataInicio: new FormControl('', [Validators.required, this.dataInicioValidator.bind(this)]),
      dataAditamento: new FormControl('', Validators.required),
    });

  }

  dataInicioValidator(control: AbstractControl): { [key: string]: any } | null {
    const mensagem = [];

    if (control.parent) {
      if (this.ultimaData) {
        console.log(this.ultimaData[control.parent.get('codigo').value]);
      }

      // if (control.value <= this.ultimaData[control.parent.get('codigo').value]) {
      //   mensagem.push('A data de início do novo percentual deve ser maior do que a do último');
      // }
    }

    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  validateForm() {
    if (this.percentualEstaticoForm.status === 'VALID') {
      this.percentualEstaticoService.codigo = this.percentualEstaticoForm.controls.codigo.value;
      this.percentualEstaticoService.percentual = this.percentualEstaticoForm.controls.percentual.value;
      this.percentualEstaticoService.dataInicio = this.percentualEstaticoForm.controls.dataInicio.value;
      this.percentualEstaticoService.dataAditamento = this.percentualEstaticoForm.controls.dataAditamento.value;
      this.percentualEstaticoService.setValdity(false);
    }else {
      this.percentualEstaticoService.setValdity(true);
    }
  }
  activateButton(): void {
    if (this.id) {
      if ((this.percentualEstaticoService.codigo !== this.percentualEstatico.codigo) ||
        (this.percentualEstaticoService.percentual !== this.percentualEstatico.percentual) ||
        (this.percentualEstaticoService.dataInicio !== this.percentualEstatico.dataInicio) ||
        (this.percentualEstaticoService.dataAditamento !== this.percentualEstatico.dataAditamento)
      ) {
        this.notValidEdit = false;
      }else if ((this.percentualEstaticoService.codigo === this.percentualEstatico.codigo) ||
        (this.percentualEstaticoService.percentual === this.percentualEstatico.percentual) ||
        (this.percentualEstaticoService.dataInicio === this.percentualEstatico.dataInicio) ||
        (this.percentualEstaticoService.dataAditamento === this.percentualEstatico.dataAditamento)) {
        this.notValidEdit = true;
      }
    }
  }
  disableButton() {
    this.notValidEdit = true;
  }
}

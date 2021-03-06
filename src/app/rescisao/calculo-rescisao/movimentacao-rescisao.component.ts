import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MaterializeAction} from 'angular2-materialize';
import {TerceirizadoRescisao} from '../terceirizado-rescisao';
import {RescisaoService} from '../rescisao.service';
import {CalculoRescisao} from '../calculo-rescisao';
import {RescisaoCalcular} from '../rescisao-calcular';
import {Contrato} from '../../contratos/contrato';
import {Funcionario} from '../../funcionarios/funcionario';
import {Error} from '../../_shared/error';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-movimentacao-rescisao-component',
  templateUrl: './movimentacao-rescisao.component.html',
  styleUrls: ['./calculo-rescisao.component.scss']
})
export class MovimentacaoRescisaoComponent implements OnInit {
  protected contratos: Contrato[];
  @Input() protected terceirizados: TerceirizadoRescisao[];
  @Input() codigoContrato: number;
  @Input() tipoRestituicao: string;
  rescisaoForm: FormGroup;
  isSelected = false;
  selected = false;
  calculosRescisao: RescisaoCalcular[] = [];
  modalActions = new EventEmitter<string | MaterializeAction>();
  modalActions2 = new EventEmitter<string | MaterializeAction>();
  modalActions3 = new EventEmitter<string | MaterializeAction>();
  modalActions4 = new EventEmitter<string | MaterializeAction>();
  isLoading = false;
  @Output() navegaParaViewDeCalculos = new EventEmitter();

  constructor(private fb: FormBuilder, private rescisaoService: RescisaoService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.formInit();
  }

  formInit(): void {
    this.rescisaoForm = this.fb.group({
      calcularTerceirizados: this.fb.array([])
    });
    const control = <FormArray>this.rescisaoForm.controls.calcularTerceirizados;
    this.terceirizados.forEach(item => {
      const addCtrl = this.fb.group({
        codTerceirizadoContrato: new FormControl(item.codTerceirizadoContrato),
        nomeTerceirizado: new FormControl(item.nomeTerceirizado),
        tipoRescisao: new FormControl('SEM JUSTA CAUSA'),
        selected: new FormControl(this.isSelected),
        tipoRestituicao: new FormControl(this.tipoRestituicao),
        dataDesligamento: new FormControl(''),
        dataInicioFeriasIntegrais: new FormControl(''),
        dataFimFeriasIntegrais: new FormControl(''),
        dataInicioFeriasProporcionais: new FormControl(''),
        resgateFeriasVencidas: new FormControl('T', [Validators.required, this.resgateValidatore]),
        valorFeriasVencidasMovimentado: new FormControl(0),
        valorFeriasProporcionaisMovimentado: new FormControl(0),
        valorDecimoTerceiroMovimentado: new FormControl(0),
        emAnalise: new FormControl(item.emAnalise),
      });
      control.push(addCtrl);
    });
    for (let i = 0; i < this.terceirizados.length; i++) {
      this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('codTerceirizadoContrato');
      this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('tipoRescisao');
      this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('tipoRestituicao');
      this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataDesligamento');
      if (this.dateToString(this.terceirizados[i].pDataInicioFeriasProporcionais)) {
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasProporcionais').setValue(this.dateToString(this.terceirizados[i].pDataInicioFeriasProporcionais));
      } else {
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasProporcionais').disable();
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('valorFeriasProporcionaisMovimentado').disable();
      }
      this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').setValidators([Validators.required, this.resgateValidatore]);
      if (!this.terceirizados[i].pDataInicioFeriasIntegrais || !this.terceirizados[i].pDataFimFeriasIntegrais) {
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').setValue('N');
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').disable();
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasIntegrais').setValue('');
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasIntegrais').disable();
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataFimFeriasIntegrais').setValue('');
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataFimFeriasIntegrais').disable();
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('valorFeriasVencidasMovimentado').disable();
      } else {
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasIntegrais').setValue(this.dateToString(this.terceirizados[i].pDataInicioFeriasIntegrais));
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataFimFeriasIntegrais').setValue(this.dateToString(this.terceirizados[i].pDataFimFeriasIntegrais));
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').setValidators([Validators.required, this.resgateValidatore]);
      }
      const emAnalise = this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('emAnalise').value;
      if (emAnalise) {
        this.rescisaoForm.get('calcularTerceirizados').get('' + i).disable();
      }
    }
  }

  private dateToString(value: any): string {
    if (value) {
      const date: string[] = value.split('-');
      return date[2] + '/' + date[1] + '/' + date['0'];
    } else {
      return '';
    }
  }

  private stringToDate(value: string): Date {
    const date: string[] = value.split('/');
    return new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0]));
  }

  public resgateValidatore(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];
    if (control.value === 'T') {
      mensagem.push('Selecione uma opção.');
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  closeModal1() {
    this.modalActions.emit({action: 'modal', params: ['close']});
  }

  openModal1() {
    this.modalActions.emit({action: 'modal', params: ['open']});
  }

  openModal2() {
    this.modalActions2.emit({action: 'modal', params: ['open']});
  }

  closeModal2() {
    this.modalActions2.emit({action: 'modal', params: ['close']});
  }

  openModal3() {
    this.modalActions3.emit({action: 'modal', params: ['open']});
  }

  closeModal3() {
    this.modalActions3.emit({action: 'modal', params: ['close']});
  }

  openModal4() {
    this.modalActions4.emit({action: 'modal', params: ['open']});
  }

  closeModal4() {
    this.modalActions4.emit({action: 'modal', params: ['close']});
    this.navegaParaViewDeCalculos.emit(this.codigoContrato);
  }

  efetuarCalculo(): void {
    this.isLoading = true;
    this.rescisaoService.registrarCalculoRescisao(this.calculosRescisao).subscribe(res => {
      if (res.success) {
        this.isLoading = false;
        this.closeModal3();
        this.openModal4();
      }
    });
  }

  verificaDadosFormulario() {
    this.isLoading = true;
    this.calculosRescisao = [];
    let aux = 0;
    for (let i = 0; i < this.terceirizados.length; i++) {
      if (this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('selected').value) {
        aux++;
        if (this.rescisaoForm.get('calcularTerceirizados').get('' + i).status === 'VALID') {
          const objeto = new RescisaoCalcular(this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('codTerceirizadoContrato').value,
            this.tipoRestituicao,
            this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('tipoRescisao').value,
            this.terceirizados[i].dataDesligamento,
            null,
            null,
            this.stringToDate(this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasProporcionais').value),
            this.terceirizados[i].pDataFimFeriasProporcionais,
            this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('valorFeriasVencidasMovimentado').value,
            this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('valorFeriasProporcionaisMovimentado').value,
            this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('valorDecimoTerceiroMovimentado').value,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0);
          let index = -1;
          for (let j = 0; j < this.calculosRescisao.length; j++) {
            if (this.calculosRescisao[j].codTerceirizadoContrato === this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('codTerceirizadoContrato').value) {
              index = j;
            }
          }
          objeto.setNomeTerceirizado(this.terceirizados[i].nomeTerceirizado);
          if (this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').value === 'S') {
            objeto.setInicioFeriasIntegrais(this.stringToDate(this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataInicioFeriasIntegrais').value));
            objeto.setFimFeriasIntegrais(this.stringToDate(this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('dataFimFeriasIntegrais').value));
          }
          if (index === -1) {
            this.calculosRescisao.push(objeto);
          } else {
            this.calculosRescisao.splice(index, 1);
            this.calculosRescisao.push(objeto);
          }
        } else {
          this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').markAsDirty();
          this.rescisaoForm.get('calcularTerceirizados').get('' + i).get('resgateFeriasVencidas').markAsTouched();
          aux = null;
          this.isLoading = false;
          this.openModal2();
        }
      }
    }
    if (aux === 0) {
      this.isLoading = false;
      this.openModal1();
    }
    if ((this.calculosRescisao.length > 0) && aux) {
      for (let i = 0; i < this.calculosRescisao.length; i++) {
        this.rescisaoService.calculaRescisaoTerceirizados(this.calculosRescisao[i]).subscribe(res => {
          if (!res.error) {
            this.terceirizados.forEach(terceirizado => {
              if (terceirizado.codTerceirizadoContrato === this.calculosRescisao[i].codTerceirizadoContrato) {
                terceirizado.valorRestituicaoRescisao = res;
                this.calculosRescisao[i].inicioContagemDecimoTerceiro = terceirizado.valorRestituicaoRescisao.inicioContagemDecimoTerceiro;
                this.calculosRescisao[i].totalDecimoTerceiro = terceirizado.valorRestituicaoRescisao.valorDecimoTerceiro;
                this.calculosRescisao[i].totalIncidenciaDecimoTerceiro = terceirizado.valorRestituicaoRescisao.valorIncidenciaDecimoTerceiro;
                this.calculosRescisao[i].totalMultaFgtsDecimoTerceiro = terceirizado.valorRestituicaoRescisao.valorFGTSDecimoTerceiro;
                this.calculosRescisao[i].totalFeriasVencidas = terceirizado.valorRestituicaoRescisao.valorFeriasIntegral;
                this.calculosRescisao[i].totalTercoConstitucionalvencido = terceirizado.valorRestituicaoRescisao.valorTercoIntegral;
                this.calculosRescisao[i].totalIncidenciaFeriasVencidas = terceirizado.valorRestituicaoRescisao.valorIncidenciaFeriasIntegral;
                this.calculosRescisao[i].totalIncidenciaTercoVencido = terceirizado.valorRestituicaoRescisao.valorIncidenciaTercoIntegral;
                this.calculosRescisao[i].totalMultaFgtsFeriasVencidas = terceirizado.valorRestituicaoRescisao.valorFGTSFeriasIntegral;
                this.calculosRescisao[i].totalMultaFgtsTercoVencido = terceirizado.valorRestituicaoRescisao.valorFGTSTercoIntegral;
                this.calculosRescisao[i].totalFeriasProporcionais = terceirizado.valorRestituicaoRescisao.valorFeriasProporcional;
                this.calculosRescisao[i].totalTercoProporcional = terceirizado.valorRestituicaoRescisao.valorTercoProporcional;
                this.calculosRescisao[i].totalIncidenciaFeriasProporcionais = terceirizado.valorRestituicaoRescisao.valorIncidenciaFeriasProporcional;
                this.calculosRescisao[i].totalIncidenciaTercoProporcional = terceirizado.valorRestituicaoRescisao.valorIncidenciaTercoProporcional;
                this.calculosRescisao[i].totalMultaFgtsFeriasProporcionais = terceirizado.valorRestituicaoRescisao.valorFGTSFeriasProporcional;
                this.calculosRescisao[i].totalIncidenciaTercoProporcional = terceirizado.valorRestituicaoRescisao.valorFGTSTercoProporcional;
                this.calculosRescisao[i].totalMultaFgtsSalario = terceirizado.valorRestituicaoRescisao.valorFGTSSalario;
                this.calculosRescisao[i].totalMultaFgtsRestante = terceirizado.valorRestituicaoRescisao.valorFGTSRestante;
                if (i === (this.calculosRescisao.length - 1)) {
                  this.isLoading = false;
                  this.openModal3();
                }
              }
            });
          }
        });
      }
    }
  }
    acessoTerceirizados(codigoContrato) {
        this.router.navigate(['./funcoes-dos-terceirizados', codigoContrato], {relativeTo: this.route});
    }
}

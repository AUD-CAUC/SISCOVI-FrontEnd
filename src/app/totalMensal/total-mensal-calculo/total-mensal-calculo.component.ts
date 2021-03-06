import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ContratosService} from '../../contratos/contratos.service';
import {Contrato} from '../../contratos/contrato';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MaterializeAction} from 'angular2-materialize';
import {TotalMensalService} from '../total-mensal.service';
import {TotalMensal} from '../totalMensal';
import {Mes} from './mes';
import {ActivatedRoute, Router} from '@angular/router';
import {$} from 'protractor';

@Component({
    templateUrl: './total-mensal-calculo.component.html',
    selector: 'app-total-mensal-calculo',
    styleUrls: ['./total-mensal-calculo.component.scss']
})

export class TotalMensalCalculoComponent implements OnInit {
    contratos: Contrato[] = [];
    meses: Mes[];
    years: number[] = [];
    anoAtual: number;
    currentYear: number;
    anoDoContratoMaisAntigo: number;
    anoDoContratoMaisRecente: number;
    myForm: FormGroup;
    codigoContrato: number;
    validate = true;
    currentMonth: Mes;
    fb: FormBuilder;
    modalActions = new EventEmitter<string | MaterializeAction>();
    modalActions2 = new EventEmitter<string | MaterializeAction>();
    tmService: TotalMensalService;
    resultado: TotalMensal[];
    somaFerias = 0;
    somaTerco = 0;
    somaDecimo = 0;
    somaIncidencia = 0;
    somaMultaFGTS = 0;
    somaSaldo = 0;
    @Output() close = new EventEmitter();
    @Output() navegaParaViewDeCalculos = new EventEmitter();
    private anoSelecionado: number;
    private mesSelecionado: number;
    private numFuncAtivos: number;
    loading = false;

    constructor(contServ: ContratosService, fb: FormBuilder, tmService: TotalMensalService, private router: Router, private route: ActivatedRoute) {
        this.tmService = tmService;
        this.fb = fb;
        if (contServ.contratos.length === 0) {
            contServ.getContratosDoUsuario().subscribe((res) => {
                contServ.contratos = res;
                this.contratos = res;
                // this.anoDoContratoMaisAntigo = this.getAnoDoContratoMaisAntigo(this.contratos);
                // this.anoDoContratoMaisRecente = this.getAnoDoContratoMaisRecente(this.contratos);
                // this.years = this.preencheListaDeAnos(this.anoDoContratoMaisAntigo, this.anoDoContratoMaisRecente);
            });
        } else {
            this.contratos = contServ.contratos;
            // this.currentYear = (new Date().getFullYear());
            // this.anoDoContratoMaisAntigo = this.getAnoDoContratoMaisAntigo(this.contratos);
            // this.anoDoContratoMaisRecente = this.getAnoDoContratoMaisRecente(this.contratos);
            // this.years = this.preencheListaDeAnos(this.anoDoContratoMaisAntigo, this.anoDoContratoMaisRecente);
        }
        // this.normalizaDataFim();
    }


    ngOnInit() {
        this.myForm = this.fb.group({
            contrato: new FormControl(this.codigoContrato, [Validators.required]),
        });
    }

    // getAnoDoContratoMaisAntigo(contratos: Contrato[]): number {
    //     let anoDoCMA: number = contratos[0].anoDoContrato;
    //     if (contratos.length > 1) {
    //         for (let i = 1; i < contratos.length; i++) {
    //             if (contratos[i].anoDoContrato < contratos[i - 1].anoDoContrato) {
    //                 if (contratos[i].anoDoContrato < anoDoCMA) {
    //                     anoDoCMA = contratos[i].anoDoContrato;
    //                 }
    //             } else {
    //                 if (contratos[i - 1].anoDoContrato < anoDoCMA) {
    //                     anoDoCMA = contratos[i - 1].anoDoContrato;
    //                 }
    //             }
    //         }
    //     } else {
    //         anoDoCMA = contratos[0].anoDoContrato;
    //     }
    //     return anoDoCMA;
    // }

    // getAnoDoContratoMaisRecente(contratos: Contrato[]): number {
    //     let anoDOCMR: number;
    //     if (contratos.length > 1) {
    //         for (let i = 1; i < contratos.length; i++) {
    //             if (contratos[i].anoDoContrato > contratos[i - 1].anoDoContrato) {
    //                 anoDOCMR = contratos[i].anoDoContrato;
    //             } else {
    //                 anoDOCMR = contratos[i - 1].anoDoContrato;
    //             }
    //         }
    //     } else {
    //         anoDOCMR = contratos[0].anoDoContrato;
    //     }
    //     return anoDOCMR;
    // }

    // preencheListaDeAnos(anoDoContratoMaisAntigo: number, anoDoContratoMaisRecente: number): number[] {
    //     let currentYear: number = (new Date().getFullYear());
    //     const years: number[] = [];
    //     if (anoDoContratoMaisRecente === anoDoContratoMaisAntigo) {
    //         for (let i = 0; i < 10; i++) {
    //             years[i] = anoDoContratoMaisAntigo;
    //             anoDoContratoMaisAntigo = anoDoContratoMaisAntigo + 1;
    //         }
    //         return years;
    //     }
    //     for (let i = 0; currentYear > anoDoContratoMaisAntigo; i++) {
    //         currentYear = currentYear - 1;
    //         years[i] = currentYear;
    //     }
    //     currentYear = (new Date().getFullYear());
    //     for (let i = years.length; currentYear < (anoDoContratoMaisRecente + 6); i++) {
    //         years[i] = currentYear;
    //         currentYear = currentYear + 1;
    //     }
    //     years.sort((a, b) => (a - b));
    //     return years;
    // }

    async defineMesAtual() {
        for (let i = 0; i < this.years.length; i++) {
            this.meses = await this.tmService.getMesesCalculoValidos(this.years[i], this.codigoContrato).toPromise();
            if (this.meses.length > 0) {
                this.currentYear = this.years[i];
                this.currentMonth = this.meses[0];
                this.getNumFuncionariosAtivos();
                break;
            }
        }
    }

    defineAnoAtual() {
        this.tmService.getAnosValidos(this.codigoContrato).subscribe(res => {
            this.years = res;
            this.defineMesAtual();
        });
    }

    onChange(value: number): void {
        this.validate = false;
        if (this.codigoContrato !== value) {
            this.numFuncAtivos = null;
            this.currentMonth = null;
            this.currentYear = null;
            this.codigoContrato = value;
            this.defineAnoAtual();
        }
    }

    otherChange(value: number): void {
        this.anoSelecionado = value;
        if (value && this.codigoContrato) {
            this.tmService.getMesesCalculoValidos(value, this.codigoContrato).subscribe(res => {
                this.meses = res;
            });
        }
        if (this.mesSelecionado && this.anoSelecionado && this.codigoContrato) {
            this.getNumFuncionariosAtivos();
        }
    }

    mesChange(value: number): void {
        this.mesSelecionado = value;
        if (this.mesSelecionado && this.anoSelecionado && this.codigoContrato) {
            this.getNumFuncionariosAtivos();
        }
    }

    getNumFuncionariosAtivos(): void {
        this.tmService.getNumFuncionariosAtivos(this.currentMonth.valor, this.currentYear, this.codigoContrato).subscribe(res => {
            this.numFuncAtivos = res;
        });
    }

    calculoTotalMensal() {
        this.loading = true;
        this.tmService.calcularTotalMensal(this.codigoContrato, this.currentMonth.valor, this.currentYear).subscribe(res => {
            if (!res.error) {
                this.resultado = res;
                this.somaFerias = 0;
                this.somaTerco = 0;
                this.somaDecimo = 0;
                this.somaIncidencia = 0;
                this.somaMultaFGTS = 0;
                this.somaSaldo = 0;
                for (let i = 0; i < this.resultado.length; i++) {
                    this.somaFerias = this.somaFerias + this.resultado[i].ferias;
                    this.somaTerco = this.somaTerco + this.resultado[i].tercoConstitucional;
                    this.somaDecimo = this.somaDecimo + this.resultado[i].decimoTerceiro;
                    this.somaIncidencia = this.somaIncidencia + this.resultado[i].incidencia;
                    this.somaMultaFGTS = this.somaMultaFGTS + this.resultado[i].multaFGTS;
                    this.somaSaldo = this.somaSaldo + this.resultado[i].total;
                }
                this.openModal();
            } else {
                this.myForm.setErrors({'mensagem': res.error});
            }
            this.loading = false;
        });
    }

    openModal() {
        this.modalActions.emit({action: 'modal', params: ['open']});
    }

    closeModal() {
        this.modalActions.emit({action: 'modal', params: ['close']});
        if (this.resultado) {
            this.close.emit(this.myForm.get('contrato').value);
            this.openModal2();
        }
    }

    openModal2() {
        this.modalActions2.emit({action: 'modal', params: ['open']});
    }

    closeModal2() {
        this.modalActions2.emit({action: 'modal', params: ['close']});
    }

    apagarCalculo() {
        this.modalActions.emit({action: 'modal', params: ['close']});
    }

    navegaViewAprov() {
        this.closeModal2();
        this.navegaParaViewDeCalculos.emit(this.codigoContrato);
    }

    confirmaCalculo() {
      this.loading = true;
        this.tmService.confirmarTotalMensalReter(this.currentMonth.valor, this.currentYear, this.codigoContrato).subscribe(res => {
            this.closeModal();
            if (!res.error) {
                this.openModal2();
            }
            this.loading = false;
        });
    }

    acessoTerceirizados(codigoContrato) {
        this.router.navigate(['./funcoes-dos-terceirizados', codigoContrato], {relativeTo: this.route});
    }
}

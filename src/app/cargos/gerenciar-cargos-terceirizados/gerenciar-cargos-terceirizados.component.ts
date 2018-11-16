import {ChangeDetectorRef, Component, EventEmitter, OnInit} from '@angular/core';
import {Contrato} from '../../contratos/contrato';
import {ContratosService} from '../../contratos/contratos.service';
import {FuncionariosService} from '../../funcionarios/funcionarios.service';
import {CargoService} from '../cargo.service';
import {Funcionario} from '../../funcionarios/funcionario';
import {Cargo} from '../cargo';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {CargosFuncionarios} from '../cargos-dos-funcionarios/cargos.funcionarios';
import {MaterializeAction} from 'angular2-materialize';

@Component({
    selector: 'app-gerenciar-cargos-terceirizados-component',
    templateUrl: './gerenciar-cargos-terceirizados.component.html',
    styleUrls: ['./gerenciar-cargos-terceirizados.component.scss']
})
export class GerenciarCargosTerceirizadosComponent implements OnInit {
    modoOperacao: string;
    contratos: Contrato[];
    codigo: number;
    terceirizados: Funcionario[];
    funcoes: Cargo[];
    gerenciaForm: FormGroup;
    alteracaoForm: FormGroup;
    listaCargosFuncionarios: CargosFuncionarios[];
    isSelected = false;
    confirmarAlteracao: CargosFuncionarios[];
    modalActions = new EventEmitter<string | MaterializeAction>();
    modalActions2 = new EventEmitter<string | MaterializeAction>();
    constructor(private contServ: ContratosService, private funcServ: FuncionariosService, private cargosService: CargoService, private ref: ChangeDetectorRef, private fb: FormBuilder) {
        this.contServ.getContratosDoUsuario().subscribe(res => {
            this.contratos = res;
        });
    }

    ngOnInit() {
        this.gerenciaForm = this.fb.group({
            gerenciarTerceirizados: this.fb.array([this.createGerencia()])
        });
        this.alteracaoForm = this.fb.group({
            alterarFuncoesTerceirizados: this.fb.array([])
        });
        if (this.listaCargosFuncionarios) {
            for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                const formGroup = this.fb.group({
                    selected: new FormControl(this.isSelected),
                    terceirizado: new FormControl(this.listaCargosFuncionarios[i].funcionario),
                    funcao: new FormControl(this.listaCargosFuncionarios[i].funcao.codigo, [Validators.required, this.alterarFuncaoTerceirizadoValidator]),
                    dataInicio: new FormControl('', [Validators.required, this.myDateValidator])
                });
                this.alteracao.push(formGroup);
            }
        }
    }

    createGerencia(): FormGroup {
        return this.fb.group({
            terceirizado: new FormControl('', [Validators.required]),
            funcao: new FormControl('', [Validators.required]),
            dataInicio: new FormControl('', [Validators.required, this.myDateValidator])
        });
    }

    get gerenciar(): FormArray {
        return this.gerenciaForm.get('gerenciarTerceirizados') as FormArray;
    }

    get alteracao(): FormArray {
        return this.alteracaoForm.get('alterarFuncoesTerceirizados') as FormArray;
    }

    removerGerenciar() {
        if (this.gerenciar.length > 1) {
            const control = <FormArray>this.gerenciaForm.get('gerenciarTerceirizados');
            control.removeAt(control.length - 1);
        }
    }

    adicionaGerenciar() {
        this.gerenciar.push(this.fb.group({
            terceirizado: new FormControl(),
            funcao: new FormControl(),
            dataInicio: new FormControl()
        }));
    }

    defineCodigoContrato(codigoContrato: number): void {
        this.codigo = codigoContrato;
        if (this.modoOperacao) {
            if (this.modoOperacao === 'ALOCAÇÃO') {
                this.funcServ.getTerceirizadosNaoAlocados().subscribe(res => {
                    this.terceirizados = res;
                    this.ref.markForCheck();
                });
            }
            if (this.modoOperacao === 'ALTERAÇÃO') {
                this.cargosService.getTerceirizadosFuncao(this.codigo).subscribe(res => {
                    this.listaCargosFuncionarios = res;
                    if (this.listaCargosFuncionarios) {
                        for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                            const formGroup = this.fb.group({
                                selected: new FormControl(this.isSelected),
                                terceirizado: new FormControl(this.listaCargosFuncionarios[i].funcionario),
                                funcao: new FormControl(this.listaCargosFuncionarios[i].funcao.codigo, [Validators.required, this.alterarFuncaoTerceirizadoValidator]),
                                dataInicio: new FormControl('', [Validators.required, this.myDateValidator])
                            });
                            this.alteracao.push(formGroup);
                        }
                    }
                });
            }
            this.cargosService.getFuncoesContrato(this.codigo).subscribe(res => {
                this.funcoes = res;
                this.ref.markForCheck();
            });
        }
    }

    selecionaModo(modoOperacao: string) {
        this.modoOperacao = modoOperacao;
        if (this.codigo) {
            if (this.modoOperacao) {
                if (this.modoOperacao === 'ALOCAÇÃO') {
                    this.funcServ.getTerceirizadosNaoAlocados().subscribe(res => {
                        this.terceirizados = res;
                        this.ref.markForCheck();
                    });
                }
                if (this.modoOperacao === 'ALTERAÇÃO') {
                    this.cargosService.getTerceirizadosFuncao(this.codigo).subscribe(res => {
                        this.listaCargosFuncionarios = res;
                        if (this.listaCargosFuncionarios) {
                            for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                                const formGroup = this.fb.group({
                                    selected: new FormControl(this.isSelected),
                                    terceirizado: new FormControl(this.listaCargosFuncionarios[i].funcionario),
                                    funcao: new FormControl(this.listaCargosFuncionarios[i].funcao.codigo, [Validators.required, this.alterarFuncaoTerceirizadoValidator]),
                                    dataInicio: new FormControl('', [Validators.required, this.myDateValidator])
                                });
                                this.alteracao.push(formGroup);
                            }
                        }
                    });
                }
                this.cargosService.getFuncoesContrato(this.codigo).subscribe(res => {
                    this.funcoes = res;
                    this.ref.markForCheck();
                });
            }
        }
    }

    verificarFormularioGerencia(): void {
        if (this.gerenciaForm.valid) {
            const data: CargosFuncionarios[] = [];
            for (let i = 0; i < this.gerenciar.length; i++) {
                const form: FormGroup = this.gerenciaForm.get('gerenciarTerceirizados').get('' + i) as FormGroup;
                let funcionario = new Funcionario();
                let funcao = new Cargo();
               this.terceirizados.forEach(item => {
                   if (Number(form.get('terceirizado').value) === item.codigo) {
                       funcionario = item;
                   }
               });
               this.funcoes.forEach(item => {
                   if (Number(form.get('funcao').value) === item.codigo) {
                        funcao = item;
                   }
               });
                const dataInicio = this.convertDate(form.get('dataInicio').value);
                const ft = new CargosFuncionarios();
                ft.funcionario = funcionario;
                ft.funcao = funcao;
                ft.dataDisponibilizacao = dataInicio;
                data.push(ft);
            }
            this.cargosService.alocarFuncao(data, this.codigo).subscribe(res => {

            });
        }
    }

    private convertDate(date: string): Date {
        const value: any[] =  date.split('/');
        return new Date(value[2],  value[1] - 1, value[0]);
    }

    openModal() {
        this.modalActions.emit({action: 'modal', params: ['open']});
    }

    closeModal() {
        this.modalActions.emit({action: 'modal', params: ['close']});
    }

    openModal2() {
        this.modalActions2.emit({action: 'modal', params: ['open']});
    }

    closeModal2() {
        this.modalActions2.emit({action: 'modal', params: ['close']});
    }

    public myDateValidator(control: AbstractControl): {[key: string]: any} {
        const val = control.value;
        const mensagem = [];
        const otherRegex = new RegExp(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
        if (val.length > 0 ) {
            const dia = Number(val.split('/')[0]);
            const mes = Number(val.split('/')[1]);
            const ano = Number(val.split('/')[2]);
            if (dia <= 0 || dia > 31 ) {
                mensagem.push('O dia da data é inválido.');
            }
            if (mes <= 0 || mes > 12) {
                mensagem.push('O Mês digitado é inválido');
            }
            if (ano < 2000 || ano > (new Date().getFullYear() + 5)) {
                mensagem.push('O Ano digitado é inválido');
            }
            if (val.length === 10 ) {
                if (!otherRegex.test(val)) {
                    mensagem.push('A data digitada é inválida');
                }
            }
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }

    verificaFormularioAlteracao() {
        this.confirmarAlteracao = null;
        let aux = 0;
        const lista: CargosFuncionarios[] = [];
        for (let i = 0; i < this.alteracao.length; i++) {
            if (this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('selected').value) {
                if (this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).valid) {
                    aux++;
                    const funcionario: Funcionario = this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('terceirizado').value as Funcionario;
                    let funcao = new Cargo();
                    this.funcoes.forEach(item => {
                        if (Number(this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('funcao').value) === item.codigo) {
                            funcao = item;
                        }
                    });
                    const dataInicio = this.convertDate(this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('dataInicio').value);
                    const ft = new CargosFuncionarios();
                    ft.funcionario = funcionario;
                    ft.funcao = funcao;
                    ft.dataDisponibilizacao = dataInicio;
                    lista.push(ft);
                } else {
                    // não adicione terceirizados inválidos à lista
                }
            }
        }
        if (aux === 0) {
            this.openModal();
        }
        if ((aux !== 0) && lista.length > 0 ) {
           this.openModal2();
            this.confirmarAlteracao = lista;
        }
    }

    public alterarFuncaoTerceirizadoValidator(control: AbstractControl): {[key: string]: any} {
        const val = Number(control.value);
        const mensagem = [];
        console.log(control.parent);
        if (control.parent) {
            /*const terceirirzado: Funcionario = control.parent.get('terceirizado').value as Funcionario;
            console.log(this.listaCargosFuncionarios.findIndex(item => {
                return item.funcionario.codigo === terceirirzado.codigo;
            }));*/
            // const funcaoTerceirizado =
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }
}
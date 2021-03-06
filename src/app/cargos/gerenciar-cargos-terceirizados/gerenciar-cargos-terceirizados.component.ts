import {ChangeDetectorRef, Component, EventEmitter, OnInit} from '@angular/core';
import {ContratosService} from '../../contratos/contratos.service';
import {FuncionariosService} from '../../funcionarios/funcionarios.service';
import {CargoService} from '../cargo.service';
import {Funcionario} from '../../funcionarios/funcionario';
import {Cargo} from '../cargo';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {CargosFuncionarios} from '../cargos-dos-funcionarios/cargos.funcionarios';
import {MaterializeAction} from 'angular2-materialize';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {Error} from '../../_shared/error';
import {ActivatedRoute, Router} from '@angular/router';
import {ListaCargosFuncionarios} from '../cargos-dos-funcionarios/lista.cargos.funcionarios';
import * as XLSX from 'xlsx';
import {Workbook} from 'exceljs';
import {saveAs} from 'file-saver';
import {Contrato} from '../../contratos/contrato';

@Component({
    selector: 'app-gerenciar-cargos-terceirizados-component',
    templateUrl: './gerenciar-cargos-terceirizados.component.html',
    styleUrls: ['./gerenciar-cargos-terceirizados.component.scss']
})
export class GerenciarCargosTerceirizadosComponent implements OnInit {
    modoOperacao: string;
    contrato: Contrato;
    codigo: number;
    codContrato: number;
    terceirizadosNaoAlocados: Funcionario[];
    terceirizados: CargosFuncionarios[];
    funcoes: Cargo[];
    gerenciaForm: FormGroup;
    alteracaoForm: FormGroup;
    desativacaoForm: FormGroup;
    listaCargosFuncionarios: CargosFuncionarios[];
    cargosFuncionarios: ListaCargosFuncionarios[];
    isSelected = false;
    confirmarAlteracao: CargosFuncionarios[];
    confirmarDesligamento: CargosFuncionarios[];
    buttonDisabled = true;
    file: File;
    modalActions = new EventEmitter<string | MaterializeAction>();
    modalActions2 = new EventEmitter<string | MaterializeAction>();
    modalActions3 = new EventEmitter<string | MaterializeAction>();
    modalActions4 = new EventEmitter<string | MaterializeAction>();
    modalActions5 = new EventEmitter<string | MaterializeAction>();
    modalActions6 = new EventEmitter<string | MaterializeAction>();

    constructor(private contServ: ContratosService, private funcServ: FuncionariosService,
                private cargosService: CargoService, private ref: ChangeDetectorRef, private fb: FormBuilder,
                private router: Router, private route: ActivatedRoute) {
        route.params.subscribe(params => {
            this.codContrato = params['codContrato'];
        });
        this.defineValor(this.codContrato);
        this.contServ.getContratoCompletoUsuario(this.codContrato).subscribe(res => {
            this.contrato = res;
        });
    }

    ngOnInit() {
        this.gerenciaForm = this.fb.group({
            gerenciarTerceirizados: this.fb.array([this.createGerencia()])
        });
        this.gerenciaForm.get('gerenciarTerceirizados').get('0').get('nomeTerceirizado').disable();
        this.gerenciaForm.get('gerenciarTerceirizados').get('0').get('ativo').disable();
        this.alteracaoForm = this.fb.group({
            alterarFuncoesTerceirizados: this.fb.array([])
        });
        this.desativacaoForm = this.fb.group({
            desativaTerceirizado: this.fb.array([])
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
            for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                this.alteracao.get('' + i).get('funcao').setValidators([this.alterarFuncaoTerceirizadoValidator.bind(this)]);
                this.alteracao.get('' + i).get('dataInicio').setValidators([this.validateDataInicioFuncao.bind(this), this.myDateValidator]);
            }
        }
    }

    createGerencia(): FormGroup {
        return this.fb.group({
            cpfTerceirizado: new FormControl('', [Validators.required, Validators.maxLength(11), Validators.minLength(11), this.TestaCPF],
                this.cpfAsyncValidator.bind(this)),
            nomeTerceirizado: new FormControl('', [Validators.required]).disable(),
            ativo: new FormControl('', [Validators.required]).disable(),
            funcao: new FormControl('', [Validators.required]),
            dataInicio: new FormControl('', [Validators.required, this.myDateValidator, this.ValidaDataDeInicio.bind(this)]),
            codigo: new FormControl(0)
        });
    }

    ValidaDataDeInicio(control: AbstractControl): { [key: string]: any } {
      const mensagem = [];
      if (control.parent) {
        control.parent.get('dataInicio').markAsTouched();
        control.parent.get('dataInicio').markAsDirty();
        if ((control.value.length === 10)) {
          const dia = Number(control.value.split('/')[0]);
          const mes = Number(control.value.split('/')[1]) - 1;
          const ano = Number(control.value.split('/')[2]);
          const inicioFuncao: Date = new Date(ano, mes, dia); /*início do ajuste*/
          const inicioContrato: Date = new Date(this.contrato.dataInicio);
          const fimContrato: Date = new Date(this.contrato.dataFim);
          if (inicioFuncao < inicioContrato) {
            mensagem.push('A data de início do terceirizado deve ser maior que a data de início do contrato! Data de início: ' + inicioContrato.toLocaleDateString());
          } else if (inicioFuncao >= fimContrato) {
            mensagem.push('A data de início do terceirizado deve ser menor que a data fim do contrato! Data fim: ' + fimContrato.toLocaleDateString());
          }
        }
      }
      return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }

    TestaCPF(control: AbstractControl): { [key: string]: any } {
        let Soma;
        let Resto;
        const mensagem = [];
        let error = false;
        Soma = 0;
        if (control.parent) {
          control.parent.get('cpfTerceirizado').markAsTouched();
          control.parent.get('cpfTerceirizado').markAsDirty();

          if (control.value === '00000000000') {
                error = true;

            }

            for (let i = 1; i <= 9; i++) {
                Soma = Soma + Number(control.value.substring(i - 1, i)) * (11 - i);
            }

            Resto = (Soma * 10) % 11;

            if ((Resto === 10) || (Resto === 11)) {
                Resto = 0;
            }

            if (Resto !== Number(control.value.substring(9, 10))) {
                error = true;
            }

            Soma = 0;
            for (let i = 1; i <= 10; i++) {
                Soma = Soma + Number(control.value.substring(i - 1, i)) * (12 - i);
            }
            Resto = (Soma * 10) % 11;

            if ((Resto === 10) || (Resto === 11)) {
                Resto = 0;
            }
            if (Resto !== Number(control.value.substring(10, 11))) {
                error = true;
            }

            if (error === true && control.value.length === 11) {
              control.parent.get('nomeTerceirizado').setValue('');
              control.parent.get('nomeTerceirizado').disable();
                mensagem.push('CPF inválido!');
                control.setErrors(mensagem);
            }
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }

    get gerenciar(): FormArray {
        return this.gerenciaForm.get('gerenciarTerceirizados') as FormArray;
    }

    get alteracao(): FormArray {
        return this.alteracaoForm.get('alterarFuncoesTerceirizados') as FormArray;
    }

    get desativacao(): FormArray {
        return this.desativacaoForm.get('desativaTerceirizado') as FormArray;
    }

    removerGerenciar() {
        if (this.gerenciar.length > 1) {
            const control = <FormArray>this.gerenciaForm.get('gerenciarTerceirizados');
            control.removeAt(control.length - 1);
        }
    }

    adicionaGerenciar() {
        this.gerenciar.push(this.fb.group({
            cpfTerceirizado: new FormControl('', [Validators.required, Validators.maxLength(11), Validators.minLength(11), this.TestaCPF]
                , this.cpfAsyncValidator.bind(this)),
            nomeTerceirizado: new FormControl('', [Validators.required]).disable(),
            ativo: new FormControl('', [Validators.required]).disable(),
            funcao: new FormControl(),
            dataInicio: new FormControl(),
            codigo: new FormControl(0)
        }));
    }

    defineValor(value: any): void {
        if (value === 'LISTAR' || value === 'ALOCAÇÃO' || value === 'ALTERAÇÃO' || value === 'DESATIVAÇÃO') {
            this.modoOperacao = value;
        } else {
            this.codigo = value;
        }

        if (this.modoOperacao && this.codigo) {
            if (this.modoOperacao === 'LISTAR') {
                this.cargosService.getCargosFuncionarios(this.codigo).subscribe(res => {
                    this.cargosFuncionarios = res;
                }, error => {
                    this.cargosFuncionarios = [];
                });
            }
            if (this.modoOperacao === 'ALOCAÇÃO') {
                this.funcServ.getTerceirizadosNaoAlocados().subscribe(res => {
                    this.terceirizadosNaoAlocados = res;
                    this.ref.markForCheck();
                });
            }
            if (this.modoOperacao === 'ALTERAÇÃO') {
                this.cargosService.getTerceirizadosFuncao(this.codigo).subscribe(res => {
                    this.listaCargosFuncionarios = res;
                    this.ref.markForCheck();
                    if (this.listaCargosFuncionarios) {
                        this.alteracaoForm = this.fb.group({
                            alterarFuncoesTerceirizados: this.fb.array([])
                        });
                        for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                            const formGroup = this.fb.group({
                                selected: new FormControl(this.isSelected),
                                terceirizado: new FormControl(this.listaCargosFuncionarios[i].funcionario),
                                funcao: new FormControl(this.listaCargosFuncionarios[i].funcao.codigo, [Validators.required, this.alterarFuncaoTerceirizadoValidator]),
                                dataInicio: new FormControl('', [Validators.required, this.myDateValidator])
                            });
                            this.alteracao.push(formGroup);
                            this.ref.markForCheck();
                        }
                        this.ref.markForCheck();
                        for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                            this.alteracao.get('' + i).get('funcao').setValidators([this.alterarFuncaoTerceirizadoValidator.bind(this)]);
                            this.alteracao.get('' + i).get('dataInicio').setValidators([this.validateDataInicioFuncao.bind(this), this.myDateValidator]);
                        }
                    }
                });
            }
            if (this.modoOperacao === 'DESATIVAÇÃO') {
                this.cargosService.getTerceirizadosFuncao(this.codigo).subscribe(res => {
                    this.listaCargosFuncionarios = res;
                    this.ref.markForCheck();
                    if (this.listaCargosFuncionarios) {
                        this.desativacaoForm = this.fb.group({
                            desativaTerceirizado: this.fb.array([])
                        });
                        for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                            const formGroup = this.fb.group({
                                selected: new FormControl(this.isSelected),
                                terceirizado: new FormControl(this.listaCargosFuncionarios[i].funcionario),
                                funcao: new FormControl(this.listaCargosFuncionarios[i].funcao.codigo),
                                dataDesligamento: new FormControl('', [Validators.required, this.myDateValidator])
                            });
                            this.desativacao.push(formGroup);
                            this.ref.markForCheck();
                        }
                        this.ref.markForCheck();
                        for (let i = 0; i < this.listaCargosFuncionarios.length; i++) {
                            this.desativacao.get('' + i).get('dataDesligamento').setValidators([this.validateDataInicioFuncao.bind(this), this.myDateValidator]);
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

    verificarFormularioGerencia(): void {
        if (this.gerenciaForm.valid) {
            const data: CargosFuncionarios[] = [];
            for (let i = 0; i < this.gerenciar.length; i++) {
                const form: FormGroup = this.gerenciaForm.get('gerenciarTerceirizados').get('' + i) as FormGroup;
                const funcionario = new Funcionario();
                let funcao = new Cargo();
                funcionario.cpf = form.get('cpfTerceirizado').value;
                funcionario.nome = form.get('nomeTerceirizado').value;
                funcionario.codigo = Number(form.get('codigo').value);
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
                this.openModal4();
            }, error2 => {
                this.openModal5();
            });
        }
    }

    private convertDate(date: string): Date {
        const value: any[] = date.split('/');
        return new Date(value[2], value[1] - 1, value[0]);
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
        this.router.navigate(['contratos/', this.codContrato]);
    }

    openModal5() {
        this.modalActions5.emit({action: 'modal', params: ['open']});
        this.router.navigate(['funcoes-dos-terceirizados']);
    }

    closeModal5() {
        this.modalActions5.emit({action: 'modal', params: ['close']});
    }

    openModal6() {
        this.modalActions6.emit({action: 'modal', params: ['open']});
    }

    closeModal6() {
        this.modalActions6.emit({action: 'modal', params: ['close']});
    }

    public myDateValidator(control: AbstractControl): { [key: string]: any } {
        const val = control.value;
        const mensagem = [];
        const otherRegex = new RegExp(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
        if (val.length > 0) {
            const dia = Number(val.split('/')[0]);
            const mes = Number(val.split('/')[1]);
            const ano = Number(val.split('/')[2]);
            if (dia <= 0 || dia > 31) {
                mensagem.push('O dia da data é inválido.');
            }
            if (mes <= 0 || mes > 12) {
                mensagem.push('O Mês digitado é inválido');
            }
            if (ano < 2000 || ano > (new Date().getFullYear() + 5)) {
                mensagem.push('O Ano digitado é inválido');
            }
            if (val.length === 10) {
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
                    aux = undefined;
                    this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('funcao').markAsDirty();
                    this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('funcao').markAsTouched();
                    this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('dataInicio').markAsTouched();
                    this.alteracaoForm.get('alterarFuncoesTerceirizados').get('' + i).get('dataInicio').markAsDirty();
                    this.ref.markForCheck();
                    this.openModal3();
                }
            }
        }
        if (aux === 0) {
            this.openModal();
        }
        if ((aux > 0) && lista.length > 0) {
            this.openModal2();
            this.confirmarAlteracao = lista;
        }
    }

    public alterarFuncaoTerceirizadoValidator(control: AbstractControl): { [key: string]: any } {
        const val = Number(control.value);
        const formGroup = control.parent as FormGroup;
        const mensagem = [];
        if (control.parent) {
            if (formGroup.controls.terceirizado) {
                const indice = this.listaCargosFuncionarios.findIndex(a => {
                    const funcionario = formGroup.get('terceirizado').value as Funcionario;
                    return a.funcionario.codigo === Number(funcionario.codigo);
                });
                if (this.listaCargosFuncionarios[indice].funcao.codigo === val) {
                    mensagem.push('A função escolhida deve ser diferente da anterior');
                }
            }
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }

    public validateDataInicioFuncao(control: AbstractControl): { [key: string]: any } {
        let valor: Date;
        if (control.value.length === 10) {
            const val: number[] = control.value.split('/');
            valor = new Date(val[2], val[1] - 1, val[0]);
        }
        const formGroup = control.parent as FormGroup;
        const mensagem = [];
        if (control.parent) {
            if (formGroup.controls.terceirizado) {
                if (control.value.length === 10) {
                    const indice = this.listaCargosFuncionarios.findIndex(a => {
                        const funcionario = formGroup.get('terceirizado').value as Funcionario;
                        return a.funcionario.codigo === Number(funcionario.codigo);
                    });
                    const val2: any[] = this.listaCargosFuncionarios[indice].dataDisponibilizacao.toString().split('-');
                    const date: Date = new Date(Number(val2[0]), Number(val2[1]) - 1, Number(val2[2]));
                    if (date >= valor) {
                        mensagem.push('A data de início na nova função deve ser posterior  à data de início na função anterior');
                    }
                }
            }
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }

    salvarAlteracoesFuncaoTerceirizado() {
        this.cargosService.alterarFuncaoTerceirizado(this.confirmarAlteracao, this.codigo).subscribe(res => {
            this.closeModal2();
            this.openModal4();
        }, error2 => {
            this.closeModal2();
            this.openModal5();
        });
    }

    cpfAsyncValidator(control: AbstractControl) {
        const cpf: string = control.value;
        const mensagem = [];

        if (cpf.length === 11) {
            this.funcServ.verificaTerceirizadoContrato(cpf, this.codigo).subscribe(res => {
                    const terceirizado: Funcionario = res;
                    if (terceirizado) {
                        control.parent.get('nomeTerceirizado').disable();
                        control.parent.get('nomeTerceirizado').setValue(terceirizado.nome);
                        control.parent.get('ativo').setValue(terceirizado.ativo);
                        control.parent.get('codigo').setValue(terceirizado.codigo);

                    } else {
                        control.parent.get('nomeTerceirizado').enable();
                    }
                },
                error => {
                    const serverError: Error = error.json();
                    mensagem.push(serverError.error);
                    control.setErrors(mensagem);
                    control.parent.get('ativo').setValue('');
                    control.parent.get('nomeTerceirizado').setValue('');
                });
        }
        return Observable.of((mensagem.length > 0) ? mensagem : null).pipe(
            map(result => (mensagem.length > 0) ? {'mensagem': mensagem} : null)
        );
    }

    verificaFormularioDesativacao() {
        this.confirmarDesligamento = null;
        let aux = 0;
        const lista: CargosFuncionarios[] = [];
        for (let i = 0; i < this.desativacao.length; i++) {
            if (this.desativacaoForm.get('desativaTerceirizado').get('' + i).get('selected').value) {
                if (this.desativacaoForm.get('desativaTerceirizado').get('' + i).valid) {
                    aux++;
                    const funcionario: Funcionario = this.desativacaoForm.get('desativaTerceirizado').get('' + i).get('terceirizado').value as Funcionario;
                    let funcao = new Cargo();
                    this.funcoes.forEach(item => {
                        if (Number(this.desativacaoForm.get('desativaTerceirizado').get('' + i).get('funcao').value) === item.codigo) {
                            funcao = item;
                        }
                    });
                    const dataDesligamento = this.convertDate(this.desativacaoForm.get('desativaTerceirizado').get('' + i).get('dataDesligamento').value);
                    const ft = new CargosFuncionarios();
                    ft.funcionario = funcionario;
                    ft.funcao = funcao;
                    ft.dataDesligamento = dataDesligamento;
                    lista.push(ft);
                } else {
                    aux = undefined;
                    this.desativacaoForm.get('desativaTerceirizado').get('' + i).get('dataDesligamento').markAsTouched();
                    this.desativacaoForm.get('desativaTerceirizado').get('' + i).get('dataDesligamento').markAsDirty();
                    this.ref.markForCheck();
                    this.openModal3();
                }
            }
        }
        if (aux === 0) {
            this.openModal();
        }
        if ((aux > 0) && lista.length > 0) {
            this.openModal6();
            this.confirmarDesligamento = lista;
        }
    }

    salvarDesligamentoTerceirizado() {
        this.cargosService.desligarTerceirizado(this.confirmarDesligamento, this.codigo).subscribe(res => {
            this.closeModal6();
            this.openModal4();
        }, error2 => {
            this.closeModal2();
            this.openModal5();
        });
    }

    voltaContratos() {
        this.router.navigate(['/contratos']);
    }

    criarPlanilhaCadastroTerceirizado() {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Terceirizados');

        worksheet.views = [
            {state: 'frozen', ySplit: 1, activeCell: 'A1'}
        ];
        worksheet.columns = [
            {header: 'CPF', key: 'cpf', width: 57},
            {header: 'Nome', key: 'nome', width: 57},
            {header: 'Função', key: 'funcao', width: 57},
            {header: 'Data de início', key: 'dataInicio', width: 57}
        ];
        worksheet.getRow(1).font = {name: 'Arial', size: 18};
        worksheet.getRow(1).alignment = {vertical: 'middle', horizontal: 'center'};

        const temp = [];
        let temp2;
        this.funcoes.forEach(funcao => {
            temp.push(funcao.nome);
        });
        temp2 = temp.toString();
        temp2 = '"'.concat(temp2, '"');

        for (let x = 2; x <= 200; x++) {
            let row;
            row = worksheet.getRow(x);
            row.getCell(1).numFmt = '@';
            row.getCell(1).dataValidation = {
              type: 'textLength',
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Valor inválido!',
              error: 'O valor neste campo neste campo deve ter o tamanho 11.',
              allowBlank: true,
              operator: 'equal',
              formulae: [11],
            };
            row.getCell(3).dataValidation = {
                type: 'list',
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Valor inválido!',
                error: 'O valor neste campo deve ser um dos da lista.',
                allowBlank: true,
                operator: 'equal',
                formulae: [temp2],
            };
            row.getCell(4).dataValidation = {
                type: 'date',
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Valor inválido!',
                error: 'O valor neste campo deve ser uma data',
                allowBlank: false,
            };
            row.getCell(4).numFmt = 'dd/mm/yyyy';
            row.font = {name: 'Arial', size: 16};
        }

        worksheet.eachRow({includeEmpty: true}, function (row) {
            row.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
        });

        let i = 5;
        while (i <= 16384) {
            const dobCol = worksheet.getColumn(i);
            dobCol.hidden = true;
            i++;
        }

        workbook.xlsx.writeBuffer()
            .then(buffer => saveAs(new Blob([buffer]), 'modelo-alocar-terceirizados-' + this.contrato.nomeDaEmpresa + '.xlsx'))
            .catch(err => console.log('Error writing excel export', err));
    }

    sobeArquivo(event: any) {
        if (event.srcElement.files[0]) {
            if (event.srcElement.files[0].name === 'modelo-alocar-terceirizados-' + this.contrato.nomeDaEmpresa + '.xlsx') {
                this.file = event.srcElement.files[0];
                this.buttonDisabled = false;
            } else {
                this.file = null;
                this.buttonDisabled = true;
            }
        }
    }

    uploadData() {
        this.buttonDisabled = true;
        this.terceirizados = [];
        if (this.file) {
            const fileReader = new FileReader();
            fileReader.onload = (e: any) => {
                const bstr: string = e.target.result;
                const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

                /* grab first sheet */
                const wsname: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[wsname];

                /* save data */
                const data = (XLSX.utils.sheet_to_json(ws, {header: 1}));
                data.forEach((result: any) => {
                    if (result[0]) {
                        const funcionario = new CargosFuncionarios();
                        funcionario.funcionario = new Funcionario();
                        funcionario.funcao = new Cargo();

                        funcionario.funcionario.cpf = result[0];
                        funcionario.funcionario.nome = result[1];
                        funcionario.funcao.nome = result[2];
                        funcionario.dataDisponibilizacao = result[3];
                        this.terceirizados.push(funcionario);
                    }
                });
                this.terceirizados.splice(0, 1);

                if (this.terceirizados.length > 0) {
                    this.gerenciaForm = this.fb.group({
                        gerenciarTerceirizados: this.fb.array([])
                    });
                    const formArray = this.gerenciaForm.get('gerenciarTerceirizados') as FormArray;
                    this.terceirizados.forEach(terceirizado => {
                        // Procura no array de funções a que foi selecionada na planilha e retorna seu código
                        const codFuncao = this.funcoes.find(function (funcao) {
                            return funcao.nome === terceirizado.funcao.nome;
                        }).codigo;
                        const disp = new Date(terceirizado.dataDisponibilizacao);


                        formArray.push(this.fb.group({
                            cpfTerceirizado: new FormControl(terceirizado.funcionario.cpf.replace(/[.\-]/gi, ''), [Validators.required, Validators.maxLength(11), Validators.minLength(11), this.TestaCPF], this.cpfAsyncValidator.bind(this)
                            ),
                            nomeTerceirizado: new FormControl(terceirizado.funcionario.nome, [Validators.required]),
                            ativo: new FormControl(''),
                            funcao: new FormControl(codFuncao.toString(), [Validators.required]),
                            dataInicio: new FormControl(disp.toLocaleDateString(), [Validators.required, this.myDateValidator, this.ValidaDataDeInicio.bind(this)]),
                            codigo: new FormControl(0),
                        }));
                    });
                    this.gerenciaForm.updateValueAndValidity();
                    this.ref.markForCheck();
                }
            };
            fileReader.readAsBinaryString(this.file);
        }
    }
}

import {ChangeDetectorRef, Component, EventEmitter} from '@angular/core';
import {Contrato} from '../../contrato';
import {ContratosService} from '../../contratos.service';
import {UserService} from '../../../users/user.service';
import {ConfigService} from '../../../_shared/config.service';
import {Usuario} from '../../../usuarios/usuario';
import {Cargo} from '../../../cargos/cargo';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {PercentualService} from '../../../percentuais/percentual.service';
import {Percentual} from '../../../percentuais/percentual';
import {Convencao} from '../../../convencoes-coletivas/convencao';
import {ConvencaoService} from '../../../convencoes-coletivas/convencao.service';
import {CargoService} from '../../../cargos/cargo.service';
import {EventoContratual} from '../evento-contratual';
import {TipoEventoContratual} from '../tipo-evento-contratual';
import {HistoricoGestor} from '../../../historico/historico-gestor';
import {MaterializeAction} from 'angular2-materialize';
import {ActivatedRoute, Router} from '@angular/router';
import {Rubrica} from '../../../rubricas/rubrica';
import {init} from "protractor/built/launcher";

@Component({
  selector: 'app-cadastrar-ajustes',
  templateUrl: './cadastrar-ajustes.component.html',
  styleUrls: ['./cadastrar-ajustes.component.scss']
})
export class CadastrarAjustesComponent {
  codContrato: number;
  contratos: Contrato[];
  field = false;
  usuarios: Usuario[];
  cargosCadastrados: Cargo[];
  myForm: FormGroup;
  nomeGestorContrato: string;
  percentualDecimoTerceiro: number;
  percentualFerias: number;
  percentualIncidencia: number;
  percentuaisFerias: Percentual[] = [];
  percentuaisDecimoTerceiro: Percentual[] = [];
  convencoesColetivas: Convencao[] = [];
  contrato: Contrato;
  primeiroSubstituto: string;
  segundoSubstituto: string;
  terceiroSubstituto: string;
  quartoSubstituto: string;
  cadastroAjuste = new EventEmitter();
  tiposEventosContratuais: TipoEventoContratual[] = [];
  modalActions = new EventEmitter<string | MaterializeAction>();
  modalActions2 = new EventEmitter<string | MaterializeAction>();
  modalActions3 = new EventEmitter<string | MaterializeAction>();
  tempCon: Contrato;
  incidenciaMinima = 9.0;
  incidenciaMaxima = 39.80;
  // dataInicioVig = this.tempCon.dataFim;
  // dataFimVig: Date;

  constructor(private contratoService: ContratosService, private userService: UserService, private config: ConfigService,
              private  fb: FormBuilder, private percentService: PercentualService, private convService: ConvencaoService,
              private ref: ChangeDetectorRef, private cargoService: CargoService, private router: Router, private route: ActivatedRoute) {
    route.params.subscribe(params => {
      this.codContrato = params['codContrato'];
      // if (this.id) {
      //   rubricaService.buscarRubrica(this.id).subscribe(res => {
      //     this.rubrica = res;
      //     this.rubricaForm.controls.nome.setValue(this.rubrica.nome);
      //     this.rubricaForm.controls.sigla.setValue(this.rubrica.sigla);
      //     this.rubricaForm.controls.descricao.setValue(this.rubrica.descricao);
      //   });
      // }
    });
    this.contratoService.getContratosDoUsuario().subscribe(res => {
      this.contratos = res;
    });
    this.percentService.getPercentuaisFerias().subscribe(res => {
      if (!res.error) {
        this.percentuaisFerias = res;
      }
    });
    this.percentService.getPercentuaisDecimoTerceiro().subscribe(res => {
      if (!res.error) {
        this.percentuaisDecimoTerceiro = res;
      }
    });
    this.convService.getAll().subscribe(res => {
      if (!res.error) {
        this.convencoesColetivas = res;
      }
    });
    if (userService.user.perfil.sigla === 'ADMINISTRADOR') {
      userService.getUsuarios().subscribe(res2 => {
        this.usuarios = res2;
      });
    } else {
      userService.getGestores().subscribe(res3 => {
        this.usuarios = res3;
      });
    }

    this.cargoService.getAllCargos().subscribe(res => {
      this.cargosCadastrados = res;
    }, error2 => {
        // faz nada
    });
    this.contratoService.getTiposEventosContratuais().subscribe(res => {
      this.tiposEventosContratuais = res;
    });
    this.enableField(this.codContrato);
  }

  enableField(codigo: number) {
    this.field = false;
    this.contratoService.getNomeDoGestor(codigo).subscribe(res => {
      if (res === 'Este contrato não existe !') {
      } else {
        this.nomeGestorContrato = res;
        this.field = true;
      }
    });
    this.contratoService.getContratoCompletoUsuario(codigo).subscribe(res => {
        this.contrato = res;
      },
      error => {
      },
      () => {
        this.startView();
      }
    );
    this.initForm();
  }

  getFormArrayItems() {
    const control = <FormArray>this.myForm.controls.cargos;
    return control.controls;
  }

  formArrayLength() {
    const control = <FormArray>this.myForm.controls.cargos;
    return control.length;
  }

  initForm() {
    this.myForm = this.fb.group({
      cargos: this.fb.array([]),
      tipoAjuste: new FormControl('', [Validators.required]),
      prorrogacao: new FormControl('', [Validators.required]),
      gestor: new FormControl('', [Validators.required, this.repeticaoGestorValidator]),
      primeiroSubstituto: new FormControl('', this.repeticao1Validator),
      segundoSubstituto: new FormControl('', this.repeticao2Validator),
      terceiroSubstituto: new FormControl('', this.repeticao3Validator),
      quartoSubstituto: new FormControl('', this.repeticao4Validator),
      assinatura: new FormControl('', [Validators.required, this.myDateValidator, this.assinaturaValidator]),
      inicioVigencia: new FormControl('', [ Validators.required, this.myDateValidator, this.inicioVigenciaValidator]),
      fimVigencia: new FormControl('', [Validators.required, this.myDateValidator, this.fimVigenciaValidator]),
      dataInicioContrato: new FormControl('', [Validators.required]),
      dataFimContrato: new FormControl('', [Validators.required]),
      assunto: new FormControl(''),
      percentualFerias: new FormControl('', [Validators.required]),
      percentualDecimoTerceiro: new FormControl('', [Validators.required]),
      percentualIncidencia: new FormControl('', [Validators.required, this.percentualValidator.bind(this)]),
      numeroContrato: new FormControl('', [Validators.required]),
      nomeEmpresa: new FormControl('', [Validators.required]),
      cnpj: new FormControl('', [Validators.required]),
      ativo: new FormControl('', [Validators.required]),
      objeto: new FormControl('')
    });
    this.initCargos();
  }
  adicionaCargo(): void {
    const control = <FormArray>this.myForm.controls.cargos;
    const addCtrl = this.initCargos();
    control.push(addCtrl);
  }

  /*removeCargo(i: number) {
    const control = <FormArray>this.myForm.controls.cargos;
    control.removeAt(i);
  }*/
  initCargos() {
    return this.fb.group({
      nome: new FormControl('', [Validators.required]),
      remuneracao: new FormControl('', [Validators.required]),
      descricao: new FormControl(''),
      trienios: new FormControl('0'),
      adicionais: new FormControl('', [Validators.required]),
      convencao: new FormControl(''),
      dataBase: new FormControl('')
    });
  }

  startView() {
    if (this.contrato) {
      this.myForm.controls.numeroContrato.setValue(this.contrato.numeroDoContrato);
      this.myForm.controls.nomeEmpresa.setValue(this.contrato.nomeDaEmpresa);
      this.myForm.controls.dataInicioContrato.setValue(this.contrato.dataInicio);
      this.myForm.controls.dataFimContrato.setValue(this.contrato.dataFim);
      this.myForm.controls.cnpj.setValue(this.formaCNPJ(this.contrato.cnpj));
      this.myForm.controls.objeto.setValue(this.contrato.objeto);
      if (this.contrato.seAtivo === 'S' || this.contrato.seAtivo === 'SIM') {
        this.myForm.controls.ativo.setValue('Sim');
      } else {
        this.myForm.controls.ativo.setValue('Não');
      }
      this.myForm.controls.objeto.setValue(this.contrato.objeto);
      this.myForm.controls.gestor.setValue(this.nomeGestorContrato);
      if (this.contrato.percentuais) {
        for (let i = 0; i < this.contrato.percentuais.length; i++) {
          const percentual: Percentual = this.contrato.percentuais[i];
          if (percentual.nome.includes('Férias')) {
            this.percentualFerias = percentual.percentual;
            this.myForm.controls.percentualFerias.setValue(percentual.percentual);
          }
          if (percentual.nome.includes('Décimo terceiro')) {
            this.percentualDecimoTerceiro = percentual.percentual;
            this.myForm.controls.percentualDecimoTerceiro.setValue(percentual.percentual);
          }
          if (percentual.nome.includes('Incidência')) {
            this.percentualIncidencia = percentual.percentual;
            this.myForm.controls.percentualIncidencia.setValue(percentual.percentual);
          }
        }
      }
      if (this.contrato.historicoGestao.length > 1) {
        if (this.contrato.historicoGestao[1]) {
          this.primeiroSubstituto = this.contrato.historicoGestao[1].gestor;
          this.myForm.controls.primeiroSubstituto.setValue(this.primeiroSubstituto);
        }
        if (this.contrato.historicoGestao[2]) {
          this.segundoSubstituto = this.contrato.historicoGestao[2].gestor;
          this.myForm.controls.segundoSubstituto.setValue(this.segundoSubstituto);
        }
        if (this.contrato.historicoGestao[3]) {
          this.terceiroSubstituto = this.contrato.historicoGestao[3].gestor;
          this.myForm.controls.terceiroSubstituto.setValue(this.terceiroSubstituto);
        }
        if (this.contrato.historicoGestao[4]) {
          this.quartoSubstituto = this.contrato.historicoGestao[4].gestor;
          this.myForm.controls.quartoSubstituto.setValue(this.quartoSubstituto);
        }
      }
      this.contrato.funcoes.forEach(funcao => {
        const control = <FormArray>this.myForm.controls.cargos;
        const addCtrl = this.initCargos();
        addCtrl.controls.nome.setValue(funcao.nome);
        addCtrl.controls.nome.disable();
        addCtrl.controls.remuneracao.setValue(funcao.remuneracao);
        addCtrl.controls.descricao.setValue(funcao.descricao);
        addCtrl.controls.trienios.setValue(funcao.trienios);
        addCtrl.controls.adicionais.setValue(funcao.adicionais);
        if (funcao.convencao) {
          addCtrl.controls.convencao.setValue(funcao.convencao.codigo);
          addCtrl.controls.dataBase.setValue(this.dateToString(funcao.convencao.dataBase));
        }
        control.push(addCtrl);
      });
      this.myForm.updateValueAndValidity();
      this.ref.markForCheck();
      this.ref.detectChanges();
    }
  }

  checkValidity() {
    if (this.myForm.valid) {
      this.cadastroAjuste.emit('Chamando Evento');
    }
  }

  public repeticaoGestorValidator(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];

    if (control.parent) {

      const PS = control.parent.get('primeiroSubstituto').value;
      const SS = control.parent.get('segundoSubstituto').value;
      const TS = control.parent.get('terceiroSubstituto').value;
      const QS = control.parent.get('quartoSubstituto').value;

      if (control.value === PS && control.value !== '' && PS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === SS && control.value !== '' && SS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === TS && control.value !== '' && TS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === QS && control.value !== '' && QS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      }

      control.parent.get('primeiroSubstituto').markAsPristine();
      control.parent.get('segundoSubstituto').markAsPristine();
      control.parent.get('terceiroSubstituto').markAsPristine();
      control.parent.get('quartoSubstituto').markAsPristine();
      if (!control.pristine) {
        control.parent.get('primeiroSubstituto').updateValueAndValidity();
        control.parent.get('segundoSubstituto').updateValueAndValidity();
        control.parent.get('terceiroSubstituto').updateValueAndValidity();
        control.parent.get('quartoSubstituto').updateValueAndValidity();
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  public repeticao1Validator(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];

    if (control.parent) {

      const gestor = control.parent.get('gestor').value;
      const SS = control.parent.get('segundoSubstituto').value;
      const TS = control.parent.get('terceiroSubstituto').value;
      const QS = control.parent.get('quartoSubstituto').value;

      if (control.value === gestor && control.value !== '' && gestor !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === SS && control.value !== '' && SS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === TS && control.value !== '' && TS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === QS && control.value !== '' && QS !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      }

      control.parent.get('gestor').markAsPristine();
      control.parent.get('segundoSubstituto').markAsPristine();
      control.parent.get('terceiroSubstituto').markAsPristine();
      control.parent.get('quartoSubstituto').markAsPristine();
      if (!control.pristine) {
        control.parent.get('gestor').updateValueAndValidity();
        control.parent.get('segundoSubstituto').updateValueAndValidity();
        control.parent.get('terceiroSubstituto').updateValueAndValidity();
        control.parent.get('quartoSubstituto').updateValueAndValidity();
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  public repeticao2Validator(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];

    if (control.parent) {

      const gestor = control.parent.get('gestor').value;
      const PS = control.parent.get('primeiroSubstituto').value;
      const TS = control.parent.get('terceiroSubstituto').value;
      const QS = control.parent.get('quartoSubstituto').value;

      if (control.value === gestor && control.value !== '' && gestor !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === PS && PS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === TS && TS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === QS && QS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      }

      control.parent.get('gestor').markAsPristine();
      control.parent.get('primeiroSubstituto').markAsPristine();
      control.parent.get('terceiroSubstituto').markAsPristine();
      control.parent.get('quartoSubstituto').markAsPristine();
      if (!control.pristine) {
        control.parent.get('gestor').updateValueAndValidity();
        control.parent.get('primeiroSubstituto').updateValueAndValidity();
        control.parent.get('terceiroSubstituto').updateValueAndValidity();
        control.parent.get('quartoSubstituto').updateValueAndValidity();
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  public repeticao3Validator(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];

    if (control.parent) {

      const gestor = control.parent.get('gestor').value;
      const PS = control.parent.get('primeiroSubstituto').value;
      const SS = control.parent.get('segundoSubstituto').value;
      const QS = control.parent.get('quartoSubstituto').value;

      if (control.value === gestor && control.value !== '' && gestor !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === PS && PS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === SS && SS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === QS && QS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      }

      control.parent.get('gestor').markAsPristine();
      control.parent.get('primeiroSubstituto').markAsPristine();
      control.parent.get('segundoSubstituto').markAsPristine();
      control.parent.get('quartoSubstituto').markAsPristine();
      if (!control.pristine) {
        control.parent.get('gestor').updateValueAndValidity();
        control.parent.get('primeiroSubstituto').updateValueAndValidity();
        control.parent.get('segundoSubstituto').updateValueAndValidity();
        control.parent.get('quartoSubstituto').updateValueAndValidity();
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  public repeticao4Validator(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];

    if (control.parent) {

      const gestor = control.parent.get('gestor').value;
      const PS = control.parent.get('primeiroSubstituto').value;
      const SS = control.parent.get('segundoSubstituto').value;
      const TS = control.parent.get('terceiroSubstituto').value;

      if (control.value === gestor && control.value !== '' && gestor !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === PS && PS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === SS && SS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      } else if (control.value === TS && TS !== '' && control.value !== '') {
        mensagem.push('Os nomes devem ser diferentes!');
      }

      control.parent.get('gestor').markAsPristine();
      control.parent.get('primeiroSubstituto').markAsPristine();
      control.parent.get('segundoSubstituto').markAsPristine();
      control.parent.get('terceiroSubstituto').markAsPristine();
      if (!control.pristine) {
        control.parent.get('gestor').updateValueAndValidity();
        control.parent.get('primeiroSubstituto').updateValueAndValidity();
        control.parent.get('segundoSubstituto').updateValueAndValidity();
        control.parent.get('terceiroSubstituto').updateValueAndValidity();
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }

  protected selectConvencao(codConvencao: number, indexForm: number): void {
    const i: number = this.convencoesColetivas.findIndex(item => item.codigo === Number(codConvencao));
    if (i !== -1) {
      this.getFormArrayItems()[indexForm].get('dataBase').setValue(this.dateToString(this.convencoesColetivas[i].dataBase));
    }
  }

  private dateToString(value: any): string {
    const date: string[] = value.split('-');
    return date[2] + '/' + date[1] + '/' + date['0'];
  }

  private stringToDate(value: string): Date {
    const date: string[] = value.split('/');
    return new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0]));
  }

  private formaCNPJ(value: string): string {
    const firstString: string = value.substring(0, 2);
    const secondString: string = value.substring(2, 5);
    const thirdString: string = value.substring(5, 8);
    const fourthString: string = value.substring(8, 12);
    const fifthString: string = value.substring(12);
    return firstString + '.' + secondString + '.' + thirdString + '/' + fourthString + '-' + fifthString;
  }

  verificaAjusteASerCadastrado() {
    this.tempCon = null;
    const contrato: Contrato = Object.assign({}, this.contrato);
    const funcoesContrato: Cargo[] = this.contrato.funcoes;
    contrato.percentuais = [];
    contrato.historicoGestao = [];
    contrato.funcoes = [];
    const eventoContratual: EventoContratual = new EventoContratual();
    let index: number = this.tiposEventosContratuais.findIndex(item => item.cod === Number(this.myForm.get('tipoAjuste').value));
    if (index !== -1) {
      eventoContratual.tipo = this.tiposEventosContratuais[index];
    }
    eventoContratual.assunto = this.myForm.get('assunto').value;
    eventoContratual.prorrogacao = this.myForm.get('prorrogacao').value;
    eventoContratual.dataInicioVigencia = this.stringToDate(this.myForm.get('inicioVigencia').value);
    eventoContratual.dataFimVigencia = this.stringToDate(this.myForm.get('fimVigencia').value);
    eventoContratual.dataAssinatura = this.stringToDate(this.myForm.get('assinatura').value);
    this.getFormArrayItems().forEach(control => {
      let funcao: Cargo = this.contrato.funcoes.find(element => element.nome === control.get('nome').value);
      index = this.contrato.funcoes.findIndex(item => item.nome === control.get('nome').value);
      funcao = this.contrato.funcoes[index];
      if ((Number(control.get('remuneracao').value) !== funcao.remuneracao) ||
        (Number(control.get('trienios').value) !== funcao.trienios) ||
        (Number(control.get('adicionais').value) !== funcao.adicionais) || (control.get('convencao').value.length !== 0)) {

        const func: Cargo = funcao;
        func.remuneracao = Number(control.get('remuneracao').value);
        func.trienios = Number(control.get('trienios').value);
        func.adicionais = Number(control.get('adicionais').value);

        if (funcao.convencao) {
          if (funcao.convencao.codigo !== Number(control.get('convencao').value)) {
            funcao.convencao = this.convencoesColetivas.find(item => item.codigo === Number(control.get('convencao').value));
          }
        } else if (control.get('convencao').value.length !== 0) {
          funcao.convencao = this.convencoesColetivas.find(item => item.codigo === Number(control.get('convencao').value));
        }
        contrato.funcoes.push(func);
      }

    });
    this.contrato.percentuais.forEach(percentual => {
      if (percentual.nome.includes('Décimo terceiro')) {
        if (Number(this.myForm.get('percentualDecimoTerceiro').value) !== percentual.percentual) {
          const pct: Percentual = new Percentual();
          pct.nome = percentual.nome;
          pct.codigo = percentual.codigo;
          pct.dataInicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
          pct.dataFim = this.stringToDate(this.myForm.get('fimVigencia').value);
          pct.dataAditamento = this.stringToDate(this.myForm.get('assinatura').value);
          pct.percentual = Number(this.myForm.get('percentualDecimoTerceiro').value);
          const rubrica = new Rubrica();
          rubrica.codigo = 3;
          rubrica.nome = 'Décimo terceiro salário';
          rubrica.sigla = '13°';
          pct.rubrica = rubrica;
          contrato.percentuais.push(pct);
        }
      }
      if (percentual.nome.includes('Férias')) {
        if (Number(this.myForm.get('percentualFerias').value) !== percentual.percentual) {
          let pct: Percentual = new Percentual();
          pct.nome = percentual.nome;
          pct.codigo = percentual.codigo;
          pct.dataInicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
          pct.dataFim = this.stringToDate(this.myForm.get('fimVigencia').value);
          pct.dataAditamento = this.stringToDate(this.myForm.get('assinatura').value);
          pct.percentual = Number(this.myForm.get('percentualFerias').value);
          let rubrica = new Rubrica();
          rubrica.codigo = 1;
          rubrica.nome = 'Férias';
          rubrica.sigla = 'Férias';
          pct.rubrica = rubrica;
          contrato.percentuais.push(pct);
          pct = this.contrato.percentuais.find(item => item.nome.includes('Terço'));
          pct.dataInicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
          pct.dataFim = this.stringToDate(this.myForm.get('fimVigencia').value);
          pct.dataAditamento = this.stringToDate(this.myForm.get('assinatura').value);
          pct.percentual = Number(this.myForm.get('percentualFerias').value) / 3;
          rubrica = new Rubrica();
          rubrica.codigo = 2;
          rubrica.nome = 'Terço constitucional';
          rubrica.sigla = 'Terço constitucional';
          pct.rubrica = rubrica;
          contrato.percentuais.push(pct);
        }
      }
      if (percentual.nome.includes('Incidência')) {
        if (Number(this.myForm.get('percentualIncidencia').value) !== percentual.percentual) {
          const pct: Percentual = new Percentual();
          pct.nome = percentual.nome;
          pct.codigo = percentual.codigo;
          pct.dataInicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
          pct.dataFim = this.stringToDate(this.myForm.get('fimVigencia').value);
          pct.dataAditamento = this.stringToDate(this.myForm.get('assinatura').value);
          pct.percentual = Number(this.myForm.get('percentualIncidencia').value);
          const rubrica = new Rubrica();
          rubrica.codigo = 7;
          rubrica.nome = 'Incidência do submódulo 4.1';
          rubrica.sigla = 'Submódulo 4.1';
          pct.rubrica = rubrica;
          contrato.percentuais.push(pct);

        }
      }
    });
    if (this.myForm.get('gestor').value !== this.nomeGestorContrato) {
      const historico: HistoricoGestor = new HistoricoGestor();
      historico.inicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
      historico.gestor = this.myForm.get('gestor').value;
      historico.fim = this.stringToDate(this.myForm.get('fimVigencia').value);
      historico.codigoPerfilGestao = 1;
      contrato.historicoGestao.push(historico);
    }
    if (this.myForm.get('primeiroSubstituto').value.length > 0) {
      const historico: HistoricoGestor = this.contrato.historicoGestao.find(item => item.codigoPerfilGestao === 2);
      let create = false;
      if (historico) {
        if (this.myForm.get('primeiroSubstituto').value !== historico.gestor) {
          create = true;
        }
      }else {
        create = true;
      }
      if (create) {
        const hist: HistoricoGestor = new HistoricoGestor();
        hist.inicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
        hist.gestor = this.myForm.get('primeiroSubstituto').value;
        hist.fim = this.stringToDate(this.myForm.get('fimVigencia').value);
        hist.codigoPerfilGestao = 2;
        contrato.historicoGestao.push(hist);
      }
    }
    if (this.myForm.get('segundoSubstituto').value.length > 0) {
      const historico: HistoricoGestor = this.contrato.historicoGestao.find(item => item.codigoPerfilGestao === 3);
      let create = false;
      if (historico) {
        if (this.myForm.get('segundoSubstituto').value !== historico.gestor) {
          create = true;
        }
      }else {
        create = true;
      }
      if (create) {
        const hist: HistoricoGestor = new HistoricoGestor();
        hist.inicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
        hist.gestor = this.myForm.get('segundoSubstituto').value;
        hist.fim = this.stringToDate(this.myForm.get('fimVigencia').value);
        hist.codigoPerfilGestao = 3;
        contrato.historicoGestao.push(hist);
      }
    }
    if (this.myForm.get('terceiroSubstituto').value.length > 0) {
      const historico: HistoricoGestor = this.contrato.historicoGestao.find(item => item.codigoPerfilGestao === 3);
      let create = false;
      if (historico) {
        if (this.myForm.get('terceiroSubstituto').value !== historico.gestor) {
          create = true;
        }
      }else {
        create = true;
      }
      if (create) {
        const hist: HistoricoGestor = new HistoricoGestor();
        hist.inicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
        hist.gestor = this.myForm.get('terceiroSubstituto').value;
        hist.fim = this.stringToDate(this.myForm.get('fimVigencia').value);
        hist.codigoPerfilGestao = 4;
        contrato.historicoGestao.push(hist);
      }
    }
    if (this.myForm.get('quartoSubstituto').value.length > 0) {
      const historico: HistoricoGestor = this.contrato.historicoGestao.find(item => item.codigoPerfilGestao === 3);
      let create = false;
      if (historico) {
        if (this.myForm.get('quartoSubstituto').value !== historico.gestor) {
          create = true;
        }
      }else {
        create = true;
      }
      if (create) {
        const hist: HistoricoGestor = new HistoricoGestor();
        hist.inicio = this.stringToDate(this.myForm.get('inicioVigencia').value);
        hist.gestor = this.myForm.get('quartoSubstituto').value;
        hist.fim = this.stringToDate(this.myForm.get('fimVigencia').value);
        hist.codigoPerfilGestao = 5;
        contrato.historicoGestao.push(hist);
      }
    }

    contrato.eventoContratual = eventoContratual;
    this.tempCon = Object.assign({}, contrato);
    this.ref.detectChanges();
    this.openModal();
  }

  public findInvalidControls() {
    const invalid = [];
    const controls = this.myForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push({nome: name, error: [controls[name].errors]});
      }
    }
    return invalid;
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
    this.navToAjustes();
  }

  openModal3() {
    this.modalActions3.emit({action: 'modal', params: ['open']});
  }

  closeModal3() {
    this.modalActions3.emit({action: 'modal', params: ['close']});
    this.navToAjustes();
  }

  cadastrarAjuste() {
    this.contratoService.cadastrarAjuste(this.tempCon).subscribe(res => {
        this.closeModal();
        this.openModal2();
      },
      error2 => {
        this.closeModal();
        this.openModal3();
      }
    );
  }

  private navToAjustes() {
    this.router.navigate(['./contratos']);
  }
    public percentualValidator(control: AbstractControl): {[key: string]: any} {
        const percentual = control.value;
        const mensagem = [];
        if (control.value) {
            if (percentual > this.incidenciaMaxima || percentual < this.incidenciaMinima) {
                mensagem.push('Percentual inválido. O percentual mínimo para esse campo é ' + this.incidenciaMinima + '% e o máximo é ' + this.incidenciaMaxima + '%');
            }
        } else if (percentual === 0) {
            mensagem.push('O percentual deve ser diferente de 0%');
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }
    public myDateValidator(control: AbstractControl): { [key: string]: any } {
        const val = control.value;
        const mensagem = [];
        const otherRegex = new RegExp(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
        if (val.length === 10) {
            const dia = Number(val.split('/')[0]);
            const mes = Number(val.split('/')[1]);
            const ano = Number(val.split('/')[2]);
            if (dia <= 0 || dia > 31) {
                mensagem.push('O dia da data é inválido.');
            } else if (mes <= 0 || mes > 12) {
                mensagem.push('O Mês digitado é inválido');
            } else if (ano < 2000 || ano > (new Date().getFullYear() + 5)) {
                mensagem.push('O Ano digitado é inválido');
            } else if (val.length === 10) {
                if (!otherRegex.test(val)) {
                    mensagem.push('A data digitada é inválida');
                }
            }
        }
        return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
    }
  public inicioVigenciaValidator(control: AbstractControl): { [key: string]: any } {
    const mensagem = [];
    if (control.parent) {
      if ((control.value.length === 10)) {
        let dia = Number(control.value.split('/')[0]);
        let mes = Number(control.value.split('/')[1]) - 1;
        let ano = Number(control.value.split('/')[2]);
        const inicioVigencia: Date = new Date(ano, mes, dia);

        dia = Number(control.parent.get('fimVigencia').value.split('/')[0]);
        mes = Number(control.parent.get('fimVigencia').value.split('/')[1]) - 1;
        ano = Number(control.parent.get('fimVigencia').value.split('/')[2]);
        const fimVigencia: Date = new Date(ano, mes, dia);

        const val: Number[] = control.parent.get('dataInicioContrato').value.split('-');
        const inicioContrato: Date = new Date(Number(val[0]), Number(val[1]) - 1, Number(val[2]));

        const val2: Number[] = control.parent.get('dataFimContrato').value.split('-');
        const fimContrato: Date = new Date(Number(val2[0]), Number(val2[1]) - 1, Number(val2[2]));

        if (inicioVigencia < inicioContrato) {
          mensagem.push('A data do ajuste não pode ser anterior ao início do contrato!');
        } else if (inicioVigencia >= fimVigencia) {
          mensagem.push('A data de início da vigência deve ser');
          mensagem.push('anterior à data fim da vigência do ajuste');
        } else if (control.parent.get('prorrogacao').value === 'S') {
          if (inicioVigencia <= fimContrato) {
            mensagem.push('Em caso de prorrogações, a data de início da vigência deve ser posterior a data de término do' +
              ' contrato ou do ajuste anterior!');
          } else {
              const diff = Math.abs(inicioVigencia.getTime() - fimContrato.getTime());
              console.log(diff);
              const diffDay = Math.round(diff / (1000 * 3600 * 24));
              console.log(diffDay);
              if (diffDay > 1) {
                  mensagem.push('A vigência da nova prorrogação deve ser imediatamente 1(um) dia posterior ao fim da' +
                      'vigência do contrato ou ajuste atual!');
              }
          }
        }
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }
  public fimVigenciaValidator(control: AbstractControl): { [key: string]: any} | null {
      const mensagem = [];
      if (control.parent) {
        if ((control.value.length === 10)) {
          let dia: number;
          let mes: number;
          let ano: number;
          dia = Number(control.value.split('/')[0]);
          mes = Number(control.value.split('/')[1]) - 1;
          ano = Number(control.value.split('/')[2]);
          const fimVig: Date = new Date(ano, mes, dia);

          dia = Number(control.parent.get('inicioVigencia').value.split('/')[0]);
          mes = Number(control.parent.get('inicioVigencia').value.split('/')[1]) - 1;
          ano = Number(control.parent.get('inicioVigencia').value.split('/')[2]);
          const inicioVig: Date = new Date(ano, mes, dia);

          let val: Number[] = control.parent.get('dataInicioContrato').value.split('-');
          const inicioContrato: Date = new Date(Number(val[0]), Number(val[1]) - 1, Number(val[2]));

          val = control.parent.get('dataFimContrato').value.split('-');
          const fimContrato: Date = new Date(Number(val[0]), Number(val[1]) - 1, Number(val[2]));

          if (fimVig <= inicioContrato) {
              mensagem.push('A data fim da vigência de um ajuste não pode ser anterior a data de início do contrato!');
          }
          if (fimVig <= inicioVig) {
            mensagem.push('Erro: data fim da vigência menor que a data início.');
          } else if ((control.parent.get('prorrogacao').value === 'S')) {
            const dataLimite = new Date(inicioVig.getFullYear() + 1, inicioVig.getMonth(), inicioVig.getDate() - 1);
            if (fimVig.getTime() !== dataLimite.getTime()) {
              mensagem.push('A vigência de uma prorrogação deve ter duração de 1(um) ano');
            }
          }
        }
      }
      return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }
  public assinaturaValidator(control: AbstractControl): { [key: string]: any} | null {
    const mensagem = [];
    if (control.parent) {
      if ((control.value.length === 10)) {
        let dia: number;
        let mes: number;
        let ano: number;
        dia = Number(control.value.split('/')[0]);
        mes = Number(control.value.split('/')[1]) - 1;
        ano = Number(control.value.split('/')[2]);
        const assinDig: Date = new Date(ano, mes, dia);
        dia = Number(control.parent.get('inicioVigencia').value.split('/')[0]);
        mes = Number(control.parent.get('inicioVigencia').value.split('/')[1]) - 1;
        ano = Number(control.parent.get('inicioVigencia').value.split('/')[2]);
        const inicioVig: Date = new Date(ano, mes, dia);
          if (control.parent.get('prorrogacao').value === 'S') {
              if (assinDig > inicioVig) {
                  mensagem.push('A data da assinatura de um ajuste não pode ser posterior ao início da vigência do ajuste!');
              } else {
                  // faz nada
              }
          }
      }
    }
    return (mensagem.length > 0) ? {'mensagem': [mensagem]} : null;
  }
  voltaContratos() {
    this.router.navigate(['/contratos']);
  }

  mudaFimVigencia(value) {
    this.myForm.controls.inicioVigencia.setValue('');
    this.myForm.controls.inicioVigencia.enable();
    this.myForm.controls.fimVigencia.setValue('');
    this.myForm.controls.fimVigencia.enable();
    if (value === 'S') {
      const ano = Number(this.myForm.controls.dataFimContrato.value.split('-')[0]);
      const mes = Number(this.myForm.controls.dataFimContrato.value.split('-')[1]) - 1;
      const dia = Number(this.myForm.controls.dataFimContrato.value.split('-')[2]) + 1;
      const data: Date = new Date(ano, mes, dia);
      this.myForm.controls.inicioVigencia.setValue(data.toLocaleDateString());
      this.myForm.controls.inicioVigencia.disable();
      this.myForm.controls.inicioVigencia.updateValueAndValidity();
    } else if (value === 'N') {
      const data: Date = new Date(this.myForm.controls.dataFimContrato.value.split('-'));
      this.myForm.controls.fimVigencia.setValue(data.toLocaleDateString());
      this.myForm.controls.fimVigencia.disable();
      this.myForm.controls.fimVigencia.updateValueAndValidity();
    }
  }
}

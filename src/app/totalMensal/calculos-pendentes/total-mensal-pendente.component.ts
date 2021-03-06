import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Contrato} from '../../contratos/contrato';
import {TotalMensalService} from '../total-mensal.service';
import {TotalMensalPendente} from '../total-mensal-pendente';
import {ContratosService} from '../../contratos/contratos.service';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {ConfigService} from '../../_shared/config.service';
import {ListaTotalMensalData} from '../lista-total-mensal-data';
import {MaterializeAction} from 'angular2-materialize';
import {Router} from '@angular/router';
import html2canvas from 'html2canvas';
import * as JsPDF from 'jspdf';
import {Workbook} from 'exceljs';
import {saveAs} from 'file-saver';

@Component({
  selector: 'app-total-mensal-pendente-component',
  templateUrl: './total-mensal-pendente.component.html',
  styleUrls: ['./total-mensal-pendente.component.scss']
})
export class TotalMensalPendenteComponent implements OnInit {
  @Input() codigoContrato: number;
  contratos: Contrato[];
  totais: TotalMensalPendente[] = [];
  totalMensalForm: FormGroup;
  totalMennsalFormAfter: FormGroup;
  config: ConfigService;
  cont = 0;
  isSelected = false;
  totaisAvaliados: TotalMensalPendente[] = [];
  somaFerias: number[] = [];
  somaTerco: number[] = [];
  somaDecimo: number[] = [];
  somaIncidencia: number[] = [];
  somaMultaFGTS: number[] = [];
  somaSaldo: number[] = [];
  modalActions = new EventEmitter<string | MaterializeAction>();
  modalActions2 = new EventEmitter<string | MaterializeAction>();
  modalActions3 = new EventEmitter<string | MaterializeAction>();
  modalActions4 = new EventEmitter<string | MaterializeAction>();
  @Output() nav = new EventEmitter();
  historicoPendente: TotalMensalPendente[] = [];
  notifications: number;

  constructor(private contratoService: ContratosService, private totalMensalService: TotalMensalService, private fb: FormBuilder, config: ConfigService, private router: Router, private ref: ChangeDetectorRef) {
    this.config = config;
    this.contratoService.getContratosDoUsuario().subscribe(res => {
      this.contratos = res;
      for (let i = 0; i < this.contratos.length; i++) {
        this.defineCodigoContrato(this.contratos[i]);
      }
      // if (this.totais[0]) {
      //     this.formInit();
      // }
      // if (this.codigoContrato) {
      //     this.totalMensalService.getTotaisPendentes(this.codigoContrato).subscribe(res2 => {
      //         const historico: TotalMensalPendente[] = [];
      //         if (!res.error) {
      //             this.totais = res2;
      //         }
      //         if (this.totais) {
      //             for (let i = 0; i < res.length; i++) {
      //                 if (res[i].status === 'NEGADO') {
      //                     const a: any =  res.slice(i, i + 1);
      //                     const val: TotalMensalPendente = a[0];
      //                     historico.push(val as TotalMensalPendente);
      //                     res.splice(i, 1);
      //                     i = -1;
      //                 }
      //             }
      //             this.historicoPendente = historico;
      //             this.notifications = this.historicoPendente.length;
      //             this.ref.markForCheck();
      //             this.formInit();
      //         }
      //     });
      // }
    });
  }

  ngOnInit() {
    // if (this.totais.length > 0) {
    //     if (this.totais.length > 0) {
    //         const historico: TotalMensalPendente[] = [];
    //         for (let j = 0; j < this.totais.length; j++) {
    //           for (let i = 0; i < this.totais[j].length; i++) {
    //             if (this.totais[j][i].status === 'NEGADO') {
    //               const a: any =  this.totais.slice(i, i + 1);
    //               const val: TotalMensalPendente = a[0];
    //               historico.push(val as TotalMensalPendente);
    //               this.totais.splice(i, 1);
    //             }
    //           }
    //         }
    //         this.historicoPendente = historico;
    //         this.notifications = this.historicoPendente.length;
    //         this.ref.markForCheck();
    //     }
    // }
    // this.formInit();
  }

  formInit() {
    this.totalMensalForm = this.fb.group({
      avaliacaoDeCalculo: this.fb.array([])
    });
    if (this.totais) {
      if (this.totais.length > 0) {
        const control = <FormArray>this.totalMensalForm.controls.avaliacaoDeCalculo;
        this.totais.forEach(item => {
          const addCtrl = this.fb.group({
            avaliacao: new FormControl('S'),
            selected: new FormControl(false),
            dataReferencia: new FormControl(item.totaisMensais.dataReferencia),
            codigoContrato: new FormControl(item.codigoContrato),
            nomeEmpresa: new FormControl(item.nomeEmpresa),
            numeroContrato: new FormControl(item.numeroContrato),
          });
          control.push(addCtrl);
        });

        this.somaFerias = new Array(this.totais.length).fill(0);
        this.somaTerco = new Array(this.totais.length).fill(0);
        this.somaDecimo = new Array(this.totais.length).fill(0);
        this.somaIncidencia = new Array(this.totais.length).fill(0);
        this.somaMultaFGTS = new Array(this.totais.length).fill(0);
        this.somaSaldo = new Array(this.totais.length).fill(0);

        let i;
        let j;
        for (i = 0; i < this.totais.length; i++) {
          for (j = 0; j < this.totais[i].totaisMensais.totais.length; j++) {
            this.somaFerias[i] = this.somaFerias[i] + this.totais[i].totaisMensais.totais[j].ferias;
            this.somaTerco[i] = this.somaTerco[i] + this.totais[i].totaisMensais.totais[j].tercoConstitucional;
            this.somaDecimo[i] = this.somaDecimo[i] + this.totais[i].totaisMensais.totais[j].decimoTerceiro;
            this.somaIncidencia[i] = this.somaIncidencia[i] + this.totais[i].totaisMensais.totais[j].incidencia;
            this.somaMultaFGTS[i] = this.somaMultaFGTS[i] + this.totais[i].totaisMensais.totais[j].multaFGTS;
            this.somaSaldo[i] = this.somaSaldo[i] + this.totais[i].totaisMensais.totais[j].total;
          }
        }
      }
    }
    this.totalMennsalFormAfter = this.fb.group({
      calculosAvaliados: this.fb.array([])
    });
  }

  defineCodigoContrato(contrato: Contrato) {
    this.historicoPendente = [];
    this.codigoContrato = contrato.codigo;
    if (this.totais.length > 0) {
      this.totais = [];
    }
    this.totalMensalService.getTotaisPendentes(contrato.codigo).subscribe(res => {
      const historico: TotalMensalPendente[] = [];
      if (!res.error) {
        for (let i = 0; i < res.length; i++) {
          if (res[i].status === 'NEGADO') {
            const a: any = res.slice(i, i + 1);
            const val: TotalMensalPendente = a[0];
            historico.push(val as TotalMensalPendente);
            res.splice(i, 1);
            i = -1;
          }
        }
        this.historicoPendente = historico;
        for (let i = 0; i < res.length; i++) {
          res[i].codigoContrato = contrato.codigo;
          res[i].nomeEmpresa = contrato.nomeDaEmpresa;
          res[i].numeroContrato = contrato.numeroDoContrato;
          this.totais[this.totais.length] = res[i];
        }

      }
      this.notifications = this.historicoPendente.length;
      this.formInit();
    });
  }

  openModal() {
    this.modalActions.emit({action: 'modal', params: ['open']});
  }

  closeModal() {
    this.modalActions.emit({action: 'modal', params: ['close']});
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
  }

  openModal2() {
    this.modalActions2.emit({action: 'modal', params: ['open']});
    if (this.totaisAvaliados) {
      const control = <FormArray>this.totalMennsalFormAfter.controls.calculosAvaliados;

      this.totaisAvaliados.forEach(item => {
        const addCtrl = this.fb.group({
          status: new FormControl(item.status),
          dataReferencia: new FormControl(item.totaisMensais.dataReferencia),
          observacoes: new FormControl()
        });
        control.push(addCtrl);
      });

    }
  }

  closeModal2() {
    this.modalActions2.emit({action: 'modal', params: ['close']});
  }

  verificaFormulario(): void {
    let aux = 0;
    if (this.totaisAvaliados) {
      if (this.totaisAvaliados.length > 0) {
        this.totaisAvaliados = [];
      }
    }
    for (let i = 0; i < this.totais.length; i++) {
      if (this.totalMensalForm.get('avaliacaoDeCalculo').get('' + i).get('selected').value) {
        aux++;
        const listaTotalMensalData = new ListaTotalMensalData(this.totalMensalForm.get('avaliacaoDeCalculo').get('' + i).get('dataReferencia').value, this.totais[i].totaisMensais.totais);
        const objeto = new TotalMensalPendente(listaTotalMensalData, this.totalMensalForm.get('avaliacaoDeCalculo').get('' + i).get('avaliacao').value);
        objeto.codigoContrato = this.totalMensalForm.get('avaliacaoDeCalculo').get('' + i).get('codigoContrato').value;
        this.totaisAvaliados.push(objeto);
      }
    }
    if (aux !== 0) {
      this.openModal2();
    } else {
      this.openModal();
    }
  }

  enviarAvaliacao() {
    for (let i = 0; i < this.totaisAvaliados.length; i++) {
      this.totaisAvaliados[i].observacoes = this.totalMennsalFormAfter.get('calculosAvaliados').get('' + i).get('observacoes').value;
    }
    for (let i = 0; i < this.totaisAvaliados.length; i++) {
      this.totalMensalService.enviarAvaliacaoCalculosTotalMensal(this.totaisAvaliados[i].codigoContrato, this.totaisAvaliados[i]).subscribe(res => {
        if (!res.error) {
          if (res.success) {
            this.openModal3();
            this.closeModal2();
          }
        } else {
          this.closeModal2();
        }
      });
    }
  }

  navegaViewExec() {
    this.closeModal3();
    this.nav.emit(this.codigoContrato);
  }

  corrigeCalculo(dataReferencia: Date) {
    this.router.navigate(['/totalMensal', this.codigoContrato, dataReferencia], {queryParams: [this.codigoContrato], skipLocationChange: true});
  }

  captureScreen(nomeEmpresa, dataReferencia) {
    const data = document.getElementById(nomeEmpresa);
    html2canvas(data, {scrollX: 0, scrollY: -window.scrollY}).then(canvas => {
      // Few necessary setting options
      const imgWidth = 205;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL('image/jpg');
      const pdf = new JsPDF('p', 'mm', 'a4'); // A4 size page of PDF
      const position = 45;

      dataReferencia = dataReferencia.split('-');

      pdf.text('Retenção Pendente de Aprovação', 105, 15, {align: 'center'});
      pdf.text(nomeEmpresa, 105, 25, {align: 'center'});
      pdf.text(dataReferencia[1] + '/' + dataReferencia[0], 105, 35, {align: 'center'});
      pdf.addImage(contentDataURL, 'jpg', 0, position, imgWidth, imgHeight);


      pdf.save('Relatório_Retenção_' + dataReferencia[1] + '/' + dataReferencia[0] + '_Aprovação.pdf'); // Generated PDF
    });
  }

  gerarRelatorioExcel(nomeEmpresa, dataReferencia) {
    dataReferencia = dataReferencia.split('-');
    const dataEditada = (dataReferencia[1] + '/' + dataReferencia[0]).toString();
    const workbookRetAprov = new Workbook();
    const worksheetRetAprov = workbookRetAprov.addWorksheet('Relatório Retenções Aprovação', {
      pageSetup: {
        fitToPage: true,
        fitToHeight: 2,
        fitToWidth: 1,
        paperSize: 9
      }
    });

    worksheetRetAprov.eachRow({includeEmpty: true}, function (rowW) {
      rowW.border = {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'}
      };
    });

    worksheetRetAprov.pageSetup.margins = {
      left: 0.7, right: 0.7,
      top: 0.5, bottom: 0.5,
      header: 0.3, footer: 0.3
    };
    // Título
    worksheetRetAprov.mergeCells('A1:H1');
    const rowEmpresa = worksheetRetAprov.getCell('A1').value = nomeEmpresa;
    worksheetRetAprov.getCell('A1').font = {name: 'Arial', size: 18};
    worksheetRetAprov.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
    worksheetRetAprov.addRow(rowEmpresa);
    worksheetRetAprov.getRow(1).height = 30;

    // Subtítulo
    worksheetRetAprov.mergeCells('A2:H2');
    const rowRelAprov = worksheetRetAprov.getCell('A2').value = 'Cálculos Pendentes de Aprovação - Mês de Referência: ' + dataReferencia[1] + '/' + dataReferencia[0];
    worksheetRetAprov.getCell('A2').font = {name: 'Arial', size: 18};
    worksheetRetAprov.getCell('A2').alignment = {vertical: 'middle', horizontal: 'center'};
    worksheetRetAprov.addRow(rowRelAprov);
    worksheetRetAprov.getRow(2).height = 30;

    const rowHeaders = [
      ['Função', 'Número de\nTerceirizados por\nFunção', 'Férias', 'Terço\nConstitucional', 'Décimo\nTerceiro', 'Incidência\nRetido',
        'Multa do\nFGTS', 'Total']
    ];

    worksheetRetAprov.addRows(rowHeaders);

    worksheetRetAprov.columns = [
      {header: rowHeaders[1], key: 'funcao', width: 40},
      {header: rowHeaders[2], key: 'numTerceirizados', width: 30},
      {header: rowHeaders[3], key: 'ferias', width: 20},
      {header: rowHeaders[4], key: 'terco', width: 20},
      {header: rowHeaders[5], key: 'decimoTerc', width: 25},
      {header: rowHeaders[6], key: 'incidencia', width: 20},
      {header: rowHeaders[7], key: 'multaFgts', width: 20},
      {header: rowHeaders[8], key: 'total', width: 20},
    ];
    worksheetRetAprov.getRow(4).font = {name: 'Arial', size: 18};
    worksheetRetAprov.getRow(4).alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
    worksheetRetAprov.getRow(4).height = 70;

    worksheetRetAprov.getColumn('ferias').numFmt = 'R$ #,##0.00';
    worksheetRetAprov.getColumn('terco').numFmt = 'R$ #,##0.00';
    worksheetRetAprov.getColumn('decimoTerc').numFmt = 'R$ #,##0.00';
    worksheetRetAprov.getColumn('incidencia').numFmt = 'R$ #,##0.00';
    worksheetRetAprov.getColumn('multaFgts').numFmt = 'R$ #,##0.00';
    worksheetRetAprov.getColumn('total').numFmt = 'R$ #,##0.00';

    let row;
    let i;
    let j;
    for (i = 0; i < this.totais.length; i++) {
      if (this.totais[i].nomeEmpresa === nomeEmpresa) {
        for (j = 0; j < this.totais[i].totaisMensais.totais.length; j++) {
          row = worksheetRetAprov.getRow(j + 5);
          row.getCell(1).value = this.totais[i].totaisMensais.totais[j].funcao;
          row.getCell(2).value = this.totais[i].totaisMensais.totais[j].numeroTerceirizados;
          row.getCell(3).value = this.totais[i].totaisMensais.totais[j].ferias;
          row.getCell(4).value = this.totais[i].totaisMensais.totais[j].tercoConstitucional;
          row.getCell(5).value = this.totais[i].totaisMensais.totais[j].decimoTerceiro;
          row.getCell(6).value = this.totais[i].totaisMensais.totais[j].incidencia;
          row.getCell(7).value = this.totais[i].totaisMensais.totais[j].multaFGTS;
          row.getCell(8).value = this.totais[i].totaisMensais.totais[j].total;
        }
      }
    }
    for (let m = 0; m < this.totais.length; m++) {
      if (this.totais[m].nomeEmpresa === nomeEmpresa) {
        for (let k = 0; k < this.totais[m].totaisMensais.totais.length; k++) {
          row = worksheetRetAprov.getRow(j + 6);
          row.getCell(1).value = '';
          row.getCell(2).value = 'Somatórios';
          row.getCell(3).value = this.somaFerias[m];
          row.getCell(4).value = this.somaTerco[m];
          row.getCell(5).value = this.somaDecimo[m];
          row.getCell(6).value = this.somaIncidencia[m];
          row.getCell(7).value = this.somaMultaFGTS[m];
          row.getCell(8).value = this.somaSaldo[m];
        }
      }
    }
    worksheetRetAprov.getRow(j + 6).font = {name: 'Arial', bold: true};

    for (let x = 5; x <= 200; x++) {
      worksheetRetAprov.getRow(x).height = 30;
      worksheetRetAprov.getRow(x).alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
    }


    let l = 9;
    while (l <= 16384) {
      const dobCol = worksheetRetAprov.getColumn(l);
      dobCol.hidden = true;
      l++;
    }

    workbookRetAprov.xlsx.writeBuffer()
      .then(buffer => saveAs(new Blob([buffer]), 'Relatório-Calculos-Retençôes-Pendentes-Aprovação.xlsx'))
      .catch(err => console.log('Error writing excel export', err));
  }
}

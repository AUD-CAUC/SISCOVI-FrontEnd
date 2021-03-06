import {ValorRestituicaoFerias} from './valor-restituicao-ferias';

export class TerceirizadoFeriasMovimentacao {
    private _codigoTerceirizadoContrato: number;
    private _nomeTerceirizado: string;
    private _inicioPeriodoAquisitivo: Date;
    private _fimPeriodoAquisitivo: Date;
    private _existeCalculoAnterior: boolean;
    private _valorRestituicaoFerias: ValorRestituicaoFerias;
    private _somaDiasVendidos: number;
    private _diasUsufruidos: number;
    private _parcela14Dias: boolean;
    private _parcelaAnterior: string;
    private _ultimoFimUsufruto: Date;
    private _emAnalise: boolean;
    private _dataDesligamento: Date;
    private _dataFimContrato: Date;

    get emAnalise(): boolean {
      return this._emAnalise;
    }

    get ultimoFimUsufruto(): Date {
      return this._ultimoFimUsufruto;
    }

    get parcelaAnterior(): string {
      return this._parcelaAnterior;
    }

    get existeCalculoAnterior(): boolean {
        return this._existeCalculoAnterior;
    }

    get codigoTerceirizadoContrato(): number {
        return this._codigoTerceirizadoContrato;
    }

    get nomeTerceirizado(): string {
        return this._nomeTerceirizado;
    }

    get inicioPeriodoAquisitivo(): Date {
        return this._inicioPeriodoAquisitivo;
    }

    get fimPeriodoAquisitivo(): Date {
        return this._fimPeriodoAquisitivo;
    }
    set valorRestituicaoFerias(valorRestituicaoFerias: ValorRestituicaoFerias){
        this._valorRestituicaoFerias = valorRestituicaoFerias;
    }

    get valorRestituicaoFerias(): ValorRestituicaoFerias {
        return this._valorRestituicaoFerias;
    }

    get somaDiasVendidos(): number {
      return this._somaDiasVendidos;
    }

    get diasUsufruidos(): number {
      return this._diasUsufruidos;
    }

    get parcela14Dias(): boolean {
      return this._parcela14Dias;
    }

    get dataDesligamento(): Date {
      return this._dataDesligamento;
    }

    get dataFimContrato(): Date {
      return this._dataFimContrato;
    }
}

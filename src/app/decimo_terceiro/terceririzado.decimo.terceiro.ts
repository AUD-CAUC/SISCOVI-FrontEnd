import {ValorDecimoTerceiro} from './valor-decimo-terceiro';

export class TerceririzadoDecimoTerceiro {
    codigoTerceirizadoContrato: number;
    nomeTerceirizado: string;
    inicioContagem: Date;
    valorDisponivel: number;
    tipoRestituicao: string;
    valorMovimentado: number;
    parcelas: number;
    valoresDecimoTerceiro: ValorDecimoTerceiro;
    fimContagem: Date;
    private _id: String;
    constructor(codigoTerceirizadoContrato: number, nomeTerceirizado: string, inicioContagem: Date, valorMovimentado: number, parcelas: number) {
        this.codigoTerceirizadoContrato = codigoTerceirizadoContrato;
        this.nomeTerceirizado = nomeTerceirizado;
        this.inicioContagem = inicioContagem;
        this.valorMovimentado = valorMovimentado;
        this.parcelas = parcelas;
    }
    public setNomeTerceirizado(nomeTerceirizado: string) {
        this.nomeTerceirizado = nomeTerceirizado;
    }
    set id(value: String) {
        this._id = value;
    }
}

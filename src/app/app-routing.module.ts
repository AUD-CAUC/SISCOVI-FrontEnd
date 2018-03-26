import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ComumComponent} from './layout/comum/comum.component';
import {LoginComponent} from './users/login.component';
import {LoggedInGuard} from './users/logged-in.guard';
import {IndicadoresComponent} from './indicadores/indicadores.component';
import {InicioComponent} from './inicio/inicio.component';
import {RubricasComponent} from './rubricas/rubricas.component';
import {TotalmensalComponent} from './totalMensal/totalmensal.component';
import {ProfileGuard} from './users/profile.guard';
import {PercentuaisEstaticosComponent} from './percentuais-estaticos/percentuais-estaticos.component';
import {UsuariosComponent} from './usuarios/usuarios.component';
import {CargoComponent} from './cargos/cargo.component';
import {ContratosComponent} from './contratos/contratos.component';
import {PercentuaisComponent} from './percentuais/percentuais.component';

const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'home'},
  {path: 're' , component: IndicadoresComponent, canActivate: [LoggedInGuard],
    children: []
  },
  {path: '', component: ComumComponent,
    children: [
      {path: 'login', component: LoginComponent},
      {path: 'indicadores', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'rubricas', component: RubricasComponent, canActivate: [LoggedInGuard, ProfileGuard]},
      {path: 'usuarios', component: UsuariosComponent, canActivate: [LoggedInGuard, ProfileGuard]},
      {path: 'cargos', component: CargoComponent, canActivate: [LoggedInGuard, ProfileGuard]},
      {path: 'gerenciar', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'contratos', component: ContratosComponent, canActivate: [LoggedInGuard]},
      {path: 'percentuais', component: PercentuaisComponent, canActivate: [LoggedInGuard]},
      {path: 'cargosContrato', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'convencoes', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'funcionarios', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'cargosFuncionarios', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'vigencias', component: IndicadoresComponent, canActivate: [LoggedInGuard]},
      {path: 'home', component: InicioComponent, canActivate: [LoggedInGuard]},
      {path: 'ferias', component: InicioComponent, canActivate: [LoggedInGuard]},
      {path: 'decTer', component: InicioComponent, canActivate: [LoggedInGuard]},
      {path: 'rescisao', component: InicioComponent, canActivate: [LoggedInGuard]},
      {path: 'totalMensal', component: TotalmensalComponent, canActivate: [LoggedInGuard]},
      {path: 'saldoConta', component: InicioComponent, canActivate: [LoggedInGuard]},
      {path: 'percentEst', component: PercentuaisEstaticosComponent, canActivate: [LoggedInGuard, ProfileGuard]}
    ]}
];
@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {}

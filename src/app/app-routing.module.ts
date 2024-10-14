import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {
  SearchResultsResolver,
  SearchParamsResolver,
  SearchByIdParamsResolver,
  EntityDetailResolver,
  CurrentEntityUnResolver,
  GraphEntityNetworkResolver,
  RecordResolver } from './services/entity-search.service';
import { SzCrossSourceSummaryCategoryType } from '@senzing/sdk-components-ng';
import { SearchResultsComponent } from './search-results/search-results.component';
import { SearchRecordComponent } from './record/record.component';
import { DetailComponent } from './detail/detail.component';
import { GraphComponent } from './graph/graph.component';
import { HowComponent } from './how/how.component';
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';
import { TipsComponent } from './common/tips/tips.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';
import { AboutComponent } from './about/about.component';
import { BlankComponent } from './common/blank/blank.component';
import { XtermComponent } from './admin/xterm/xterm.component';
import { NoDecorationComponent } from './common/no-decoration/no-decoration.component';
import { LandingComponent } from './landing/landing.component';
import { SampleGridComponent } from './sample/sample-grid.component';

/**
"MATCHES" | "AMBIGUOUS_MATCHES" | "POSSIBLE_MATCHES" | "POSSIBLE_RELATIONS" | "DISCLOSED_RELATIONS"
 */

export const routes: Routes = [
  { path: 'no-decorator', component: NoDecorationComponent},
  { path: 'debug', component: BlankComponent},
  { path: 'landing', component: LandingComponent },
  /** sample data table related */
  { path: 'sample', component: SampleGridComponent,                                                 },
  { path: 'sample/:datasource1', component: SampleGridComponent,                                    },
  { path: 'sample/:datasource1/matches', component: SampleGridComponent,                            data: {statType: SzCrossSourceSummaryCategoryType.MATCHES} },
  { path: 'sample/:datasource1/ambiguous', component: SampleGridComponent,                          data: {statType: SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES} },
  { path: 'sample/:datasource1/possible-matches', component: SampleGridComponent,                   data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES} },
  { path: 'sample/:datasource1/possible-relations', component: SampleGridComponent,                 data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS} },
  { path: 'sample/:datasource1/disclosed-relations', component: SampleGridComponent,                data: {statType: SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS} },
  { path: 'sample/:datasource1/vs/:datasource2', component: SampleGridComponent,                    },
  { path: 'sample/:datasource1/vs/:datasource2/matches', component: SampleGridComponent,            data: {statType: SzCrossSourceSummaryCategoryType.MATCHES} },
  { path: 'sample/:datasource1/vs/:datasource2/ambiguous', component: SampleGridComponent,          data: {statType: SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES} },
  { path: 'sample/:datasource1/vs/:datasource2/possible-matches', component: SampleGridComponent,   data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES} },
  { path: 'sample/:datasource1/vs/:datasource2/possible-relations', component: SampleGridComponent, data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS} },
  { path: 'sample/:datasource1/vs/:datasource2/disclosed-relations', component: SampleGridComponent,data: {statType: SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS} },
  /** search */
  { path: 'search', component: TipsComponent,                             resolve:  {entityId: CurrentEntityUnResolver}, data: { animation: 'search-results' }},
  { path: 'search/results', component: SearchResultsComponent,            resolve: { entityId: CurrentEntityUnResolver, params: SearchParamsResolver, results: SearchResultsResolver }, data: { animation: 'search-results' } },
  { path: 'search/results/:searchId', component: SearchResultsComponent,  resolve: { entityId: CurrentEntityUnResolver, params: SearchParamsResolver, results: SearchResultsResolver }, data: { animation: 'search-results' } },
  { path: 'entity/:entityId', component: DetailComponent, resolve: { entityData: EntityDetailResolver }, data: { animation: 'search-detail' } },
  { path: 'datasources/:datasource/records/:recordId', component: SearchRecordComponent, resolve: { params: SearchByIdParamsResolver, result: RecordResolver }, data: { animation: 'search-detail' } },
  { path: 'graph/:entityId', component: GraphComponent,           resolve: { networkData: GraphEntityNetworkResolver }, data: { animation: 'search-detail' } },
  { path: 'graph/:entityId/:detailId', component: GraphComponent, resolve: { networkData: GraphEntityNetworkResolver, entityData: EntityDetailResolver }, data: { animation: 'search-detail' } },
  { path: 'how/:entityId', component: HowComponent, data: { animation: 'search-detail' } },
  { path: 'errors/no-results', component: NoResultsComponent,     data: { animation: 'search-detail' } },
  { path: 'errors/404', component: PageNotFoundComponent,         data: { animation: 'search-detail' } },
  { path: 'errors/500', component: ServerErrorComponent,          data: { animation: 'search-detail' } },
  { path: 'errors/504', component: GatewayTimeoutErrorComponent,  data: { animation: 'search-detail' } },
  { path: 'errors/unknown', component: UnknownErrorComponent,     data: { animation: 'search-detail' } },
  { path: 'about', component: AboutComponent,                     data: { animation: 'search-detail'} },
  {
    path: 'console',
    outlet: 'popup',
    component: XtermComponent,
    data: { fullscreen: true }
  },
  { path: '',   redirectTo: 'landing', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SearchResultsResolverService, SearchParamsResolverService, EntityDetailResolverService, CurrentEntityUnResolverService, GraphEntityNetworkResolverService } from './services/entity-search.service';
import { SearchResultsComponent } from './search-results/search-results.component';
import { DetailComponent } from './detail/detail.component';
import { GraphComponent } from './graph/graph.component';
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';
import { BlankComponent } from './common/blank/blank.component';
import { TipsComponent } from './common/tips/tips.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
  { path: 'search', component: TipsComponent, resolve:  {entityId: CurrentEntityUnResolverService}, data: { animation: 'search-results' }},
  { path: 'search/results', component: SearchResultsComponent, resolve: { params: SearchParamsResolverService, results: SearchResultsResolverService }, data: { animation: 'search-results' } },
  { path: 'entity/:entityId', component: DetailComponent, resolve: { entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  { path: 'graph/:entityId', component: GraphComponent, resolve: { networkData: GraphEntityNetworkResolverService, entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  { path: 'graph/:entityId/:detailId', component: GraphComponent, resolve: { networkData: GraphEntityNetworkResolverService, entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  { path: 'errors/no-results', component: NoResultsComponent, data: { animation: 'search-detail' } },
  { path: 'errors/404', component: PageNotFoundComponent, data: { animation: 'search-detail' } },
  { path: 'errors/500', component: ServerErrorComponent, data: { animation: 'search-detail' } },
  { path: 'errors/504', component: GatewayTimeoutErrorComponent, data: { animation: 'search-detail' } },
  { path: 'errors/unknown', component: UnknownErrorComponent, data: { animation: 'search-detail' } },
  { path: 'about', component: AboutComponent, data: { animation: 'search-detail'} },
  { path: '',   redirectTo: 'search', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

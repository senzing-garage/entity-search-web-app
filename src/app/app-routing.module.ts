import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SearchResultsComponent } from './search-results/search-results.component';
import { DetailComponent } from './detail/detail.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { NoResultsComponent } from './search-results/no-results/no-results.component';
import { BlankComponent } from './blank/blank.component';
import { SearchResultsResolverService, SearchParamsResolverService, EntityDetailResolverService } from './services/entity-search.service';

const routes: Routes = [
  { path: 'search', component: BlankComponent },
  { path: 'search/results', component: SearchResultsComponent, resolve: { params: SearchParamsResolverService, results: SearchResultsResolverService }, data: { animation: 'search-results' } },
  { path: 'entity/:entityId', component: DetailComponent, resolve: { entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  { path: 'error/404', component: PageNotFoundComponent, data: { animation: 'search-detail' } },
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

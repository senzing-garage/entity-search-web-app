import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sdk-components-ng';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { NoResultsComponent } from './search-results/no-results/no-results.component';

import { DetailComponent } from './detail/detail.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { EntitySearchService } from './services/entity-search.service';
import { BlankComponent } from './blank/blank.component';

/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig } from './../environments/environment';

/**
 * create exportable config factory
 * for AOT compilation.
 *
 * @export
 */
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}
@NgModule({
  declarations: [
    AppComponent,
    SearchResultsComponent,
    DetailComponent,
    ToolbarComponent,
    PageNotFoundComponent,
    NoResultsComponent,
    BlankComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule,
    AppRoutingModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory )
  ],
  providers: [ EntitySearchService ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }

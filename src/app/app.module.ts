/** core angular, material, and senzing modules */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sdk-components-ng';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from '../../e2e/data/services/in-memory-data.service';
import { OverlayModule } from '@angular/cdk/overlay';

// third party components and modules

// local components and modules
import { AppRoutingModule } from './app-routing.module';
import { SpinnerModule } from './common/spinner/spinner.module';
import { EntitySearchService } from './services/entity-search.service';
// components
import { AppComponent } from './app.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { DetailComponent } from './detail/detail.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { UiService } from './services/ui.service';
import { TipsComponent } from './common/tips/tips.component';
import { BlankComponent } from './common/blank/blank.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';

// errors
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';
import { ErrorPageComponent } from './common/error/error.component';

/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig, environment } from './../environments/environment';

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
    ErrorPageComponent,
    PageNotFoundComponent,
    NoResultsComponent,
    GatewayTimeoutErrorComponent,
    ServerErrorComponent,
    UnknownErrorComponent,
    BlankComponent,
    TipsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    OverlayModule,
    MaterialModule,
    AppRoutingModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
    SpinnerModule,
    environment.test ? HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 100 }) : []
  ],
  providers: [ EntitySearchService, UiService ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }

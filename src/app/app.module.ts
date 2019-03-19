/** core angular, material, and senzing modules */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sdk-components-ng';

/** third party components and modules */
// import { NgxSpinnerModule } from 'ngx-spinner';

/** local components and modules */
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { DetailComponent } from './detail/detail.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { EntitySearchService } from './services/entity-search.service';
import { TipsComponent } from './common/tips/tips.component';
import { BlankComponent } from './blank/blank.component';
import { SpinnerModule } from './common/spinner/spinner.module';
import { UiService } from './services/ui.service';
// errors
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { ErrorPageComponent } from './common/error/error.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';

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
    MaterialModule,
    AppRoutingModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
    SpinnerModule
  ],
  providers: [ EntitySearchService, UiService ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }

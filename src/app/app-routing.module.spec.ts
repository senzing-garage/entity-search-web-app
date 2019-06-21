import { TestBed,  fakeAsync, tick, inject } from '@angular/core/testing';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SenzingSdkModule, SzRestConfiguration, SzConfigurationComponent } from '@senzing/sdk-components-ng';
import { AppModule } from './app.module';
import { apiConfig } from '../environments/environment';
import { routes } from './app-routing.module';

import { SearchResultsComponent } from './search-results/search-results.component';
import { DetailComponent } from './detail/detail.component';
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';
import { BlankComponent } from './common/blank/blank.component';
import { TipsComponent } from './common/tips/tips.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';

export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}

// test to make sure senzing sdk module is working correctly
describe(`App Routing`, () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [

            ],
            imports: [
              RouterTestingModule.withRoutes(routes),
              SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
              AppModule
            ],
            providers: [
              {
                provide: SzRestConfiguration,
                useFactory: SzRestConfigurationFactory
              }
            ]
        });
    });

    it(`should be pointing at api server on /api`, inject([SzRestConfiguration], (cfgSrv: SzRestConfiguration) => {
      const srv = new SzConfigurationComponent(cfgSrv);
      expect( cfgSrv.basePath ).toBe('/api');
    }));

});

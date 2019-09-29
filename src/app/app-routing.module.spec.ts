import { TestBed,  fakeAsync, tick, inject } from '@angular/core/testing';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SenzingSdkModule, SzRestConfiguration, SzConfigurationComponent } from '@senzing/sdk-components-ng';
import { AppModule } from './app.module';
import { apiConfig } from '../environments/environment';
import { routes } from './app-routing.module';

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
    /*
    it(`should be pointing at api server on /api`, inject([SzRestConfiguration], (cfgSrv: SzRestConfiguration) => {
      const srv = new SzConfigurationComponent(cfgSrv);
      expect( cfgSrv.basePath ).toBe('/api');
    }));
    */

});

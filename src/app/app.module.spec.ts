import { TestBed, inject } from '@angular/core/testing';
import { SenzingSdkModule, SzRestConfiguration, SzConfigurationComponent } from '@senzing/sdk-components-ng';
import { apiConfig } from '../environments/environment';
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}

// test to make sure senzing sdk module is working correctly
describe(`SenzingSdkModule`, () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ SenzingSdkModule.forRoot( SzRestConfigurationFactory ) ],
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

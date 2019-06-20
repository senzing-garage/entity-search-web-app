import { TestBed, inject } from '@angular/core/testing';
import { SenzingSdkModule, SzRestConfiguration, SzConfigurationComponent } from '@senzing/sdk-components-ng';
import { apiConfig } from '../../environments/environment';
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}

// test to make sure senzing sdk module is working correctly
describe(`Detail View`, () => {

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

    it(`should resolve entity id #1`, inject([SzRestConfiguration], (cfgSrv: SzRestConfiguration) => {

    }));

});

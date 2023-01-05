import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SenzingSdkModule, SzRestConfiguration, SzConfigurationComponent } from '@senzing/sdk-components-ng';
import { apiConfig } from '../../environments/environment';
import { DetailComponent } from './detail.component';
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}

// test to make sure senzing sdk module is working correctly
describe(`Detail View`, () => {

    beforeEach(async () => {
        await TestBed.configureTestingModule({
          imports: [ 
            SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
            RouterTestingModule
          ],
          providers: [
            {
              provide: SzRestConfiguration,
              useFactory: SzRestConfigurationFactory,
            }
          ],
          declarations: [
            DetailComponent
          ]
        }).compileComponents();
    });

    it('should create entity detail view', inject([SzRestConfiguration], (cfgSrv: SzRestConfiguration) => {
      const fixture = TestBed.createComponent(DetailComponent);
      const detailComponent = fixture.componentInstance;
      expect(detailComponent).toBeTruthy();
    }));

});

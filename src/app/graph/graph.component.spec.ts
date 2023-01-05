import { TestBed, inject } from '@angular/core/testing';
import { SenzingSdkModule, SzRestConfiguration, SzConfigurationComponent } from '@senzing/sdk-components-ng';
import { RouterTestingModule } from '@angular/router/testing';
import { GraphComponent } from './graph.component';
import { apiConfig } from '../../environments/environment';
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}

// test to make sure senzing sdk module is working correctly
describe(`Graph View`, () => {

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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        SenzingSdkModule.forRoot( SzRestConfigurationFactory )
      ],
      declarations: [
        GraphComponent
      ],
      providers: [
        {
          provide: SzRestConfiguration,
          useFactory: SzRestConfigurationFactory
        }
      ]
    }).compileComponents();
  });

  it('should create the graph view', inject([SzRestConfiguration], (cfgSrv: SzRestConfiguration) => {
    const fixture = TestBed.createComponent(GraphComponent);
    const graphComponent = fixture.componentInstance;
    expect(graphComponent).toBeTruthy();
  }));

});

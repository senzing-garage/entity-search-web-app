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
    let router: Router;
    let location: Location;

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
        router = TestBed.inject(Router) as Router;
        location = TestBed.inject(Location) as Location;
    });
    
    it(
      'automatically redirects to search when the app starts',
      fakeAsync(() => {
        router.navigate(['']);
        tick();
        expect(location.path()).toBe('/search');
      })
    );

});

import { Component, OnInit, ViewChild, Input, TemplateRef, ViewContainerRef, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitySearchService } from '../services/entity-search.service';
import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';
import { SzEntityDetailComponent, SzPdfUtilService } from '@senzing/sdk-components-ng';
import { UiService } from '../services/ui.service';
import { AboutInfoService } from '../services/about.service';
import { version as appVersion, dependencies as appDependencies } from '../../../package.json';


@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  public apiServerVersion: string;
  public restApiVersion: string;
  public appVersion: string;
  public sdkComponentsVersion: string;
  public graphComponentsVersion: string;
  public restApiClientVersion: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    public overlay: Overlay,
    public uiService: UiService,
    public viewContainerRef: ViewContainerRef,
    public aboutService: AboutInfoService
    ) {
    // this.route.params.subscribe( (params) => this.entityId = parseInt(params.entityId, 10) );
  }

  ngOnInit() {
    this.appVersion = appVersion;
    if(appDependencies) {
      // check to see if we can pull sdk-components-ng and sdk-graph-components
      // versions from the package json
      if (appDependencies['@senzing/sdk-components-ng']) {
        this.sdkComponentsVersion = appDependencies['@senzing/sdk-components-ng'];
      }
      if (appDependencies['@senzing/sdk-graph-components']) {
        this.graphComponentsVersion = appDependencies['@senzing/sdk-graph-components'];
      }
      if (appDependencies['@senzing/rest-api-client-ng']) {
        this.restApiClientVersion = appDependencies['@senzing/rest-api-client-ng'];
      }
    }
    this.aboutService.getHealthInfo().subscribe( (info: any) => {
      console.warn('heartbeat data: ', info);
      this.restApiVersion = info.restApiVersion;
      this.apiServerVersion = info.version;
    });
  }
}

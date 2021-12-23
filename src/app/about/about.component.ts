import { Component, AfterViewInit } from '@angular/core';
import { SzWebAppConfigService } from '../services/config.service';
import { AboutInfoService } from '../services/about.service';
/**
 * a component to display dependency version info
 * for diagnostics.
 *
 * @export
 * @class AboutComponent
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements AfterViewInit {
  public get isStreamLoadingEnabled(): boolean {
    let isEnabled = this.aboutService.isAdminEnabled && this.aboutService.isPocServerInstance && this.configService.isStreamingConfigured
    if(isEnabled && !this.configService.loadQueueConfigured) {
      isEnabled = false;
    }
    return isEnabled;
  }

  constructor(public aboutService: AboutInfoService, public configService: SzWebAppConfigService) {}

  ngAfterViewInit() {}
}

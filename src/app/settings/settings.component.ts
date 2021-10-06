import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';

import { slideInAnimation } from '../animations';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzEntityRecord,
  SzEntityData,
  SzSearchByIdFormParams,
  SzPreferencesComponent
} from '@senzing/sdk-components-ng';

import { EntitySearchService } from '../services/entity-search.service';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { PrefsManagerService } from '../services/prefs-manager.service';
import { SzWebAppConfigService } from '../services/config.service';
import { NavItem } from '../sidenav/sidenav.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class AppSettingsComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public prefsFromLocalStorage;

    /** prefs storage mode (do not directly modify)
     * local | session | memory
     */
    public get prefsStorageMode() {
        if ( this.prefsManager.storePrefsInLocalStorage ) {
        return 'local';
        } else if ( this.prefsManager.storePrefsInSessionStorage ) {
        return 'session';
        } else {
        return 'memory';
        }
    }
    

    constructor(
        private configService: SzWebAppConfigService,
        public breakpointObserver: BreakpointObserver,
        private titleService: Title,
        public uiService: UiService,
        private prefsManager: PrefsManagerService,
        public search: EntitySearchService,
    ) {
        // get "/config/api" for immutable api path configuration
        this.configService.getRuntimeApiConfig();
        this.prefsFromLocalStorage = this.prefsManager.getPrefsFromStorage();
        this.titleService.setTitle('Preferences and Settings');
    }

    ngOnInit() {}
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public myPrefsChangeHandler(evt) {
        console.log('prefsChange Evt', evt);
    }

    /** set the prefsManager storage mode via radio button change */
    public onPrefsStorageModeUIChange (value) {
        // console.warn('onPrefsStorageModeUIChange: ', value);
        switch ( value ) {
        case 'local':
            this.prefsManager.storePrefsInLocalStorage = true;
            this.prefsManager.storePrefsInSessionStorage = false;
            break;
        case 'session':
            this.prefsManager.storePrefsInLocalStorage = false;
            this.prefsManager.storePrefsInSessionStorage = true;
            break;
        default:
            this.prefsManager.storePrefsInLocalStorage = false;
            this.prefsManager.storePrefsInSessionStorage = false;
            break;
        }
    }
    /** clear prefs from local/session storage */
    public clearPrefs(deleteFromStorage?: boolean) {
        if ( deleteFromStorage === true) {
        // also clear from storage
        this.prefsManager.clearPrefsFromStorage(true, true);
        } else {
        this.prefsManager.resetPrefsToDefaults();
        }
    }
}
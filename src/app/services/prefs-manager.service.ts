import { OnDestroy, Injectable, Inject } from '@angular/core';
import { SzSdkPrefsModel, SzPrefsService } from '@senzing/sdk-components-ng';
import { StorageService, LOCAL_STORAGE, SESSION_STORAGE } from 'ngx-webstorage-service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PrefsManagerService implements OnDestroy {
  /** store pref state in persistent browser storage */
  private storePrefsInLocalStorage = true;
  /** store pref state in transient browser session storage */
  private storePrefsInSessionStorage = false;
  /** localstorage key to store pref data in */
  public STORAGE_KEY = 'senzing-app-prefs';
  /** localstorage key to store global app data in (for things like whether or not to store prefs) */
  public G_STORAGE_KEY = 'senzing-web-app';
  /** original json value when app was loaded */
  private _localStorageOriginalValue: SzSdkPrefsModel = this.lStore.get(this.STORAGE_KEY);
  /** original json value when app was loaded */
  private _sessionStorageOriginalValue: SzSdkPrefsModel = this.sStore.get(this.STORAGE_KEY);
  /** default prefs state (for reset/clear functionality) */
  private _defaultPrefsValues: SzSdkPrefsModel;
  /** local cached json model of prefs */
  private _prefsJSON: SzSdkPrefsModel;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  constructor(
    public prefs: SzPrefsService,
    @Inject(LOCAL_STORAGE) private lStore: StorageService,
    @Inject(SESSION_STORAGE) private sStore: StorageService) {

    // get default prefs state for reset/clear functionality
    this._defaultPrefsValues = this.prefs.toJSONObject();
    if (this.storePrefsInLocalStorage) {
      // initialize prefs from localStorage value
      this.prefs.fromJSONObject(this._localStorageOriginalValue);
    }

    // listen for prefs changes at the service level
    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChanged.bind(this) );
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** save value of  _prefsJSON to local storage */
  savePrefsToStorage() {
    if (this.storePrefsInLocalStorage) {
      this.lStore.set(this.STORAGE_KEY, this._prefsJSON);
    } else if (this.storePrefsInSessionStorage) {
      this.sStore.set(this.STORAGE_KEY, this._prefsJSON);
    }
  }
  /** get prefs json from local storage */
  getPrefsFromStorage() {
    if (this.storePrefsInLocalStorage) {
      return this.lStore.get(this.STORAGE_KEY);
    } else if (this.storePrefsInSessionStorage) {
      return this.sStore.get(this.STORAGE_KEY);
    }
  }
  /** remove any stored prefs state from storage */
  clearPrefsFromStorage() {
    if (this.storePrefsInLocalStorage) {
      this.lStore.remove(this.STORAGE_KEY);
    } else if (this.storePrefsInSessionStorage) {
      this.sStore.remove(this.STORAGE_KEY);
    }
  }
  /** reset prefs values to defaults */
  resetPrefsToDefaults() {
    this.prefs.fromJSONObject( this._defaultPrefsValues );
  }

  /** handler for when preferences have changed */
  public onPrefsChanged(srprefs: SzSdkPrefsModel) {
    this._prefsJSON = srprefs;
    this.savePrefsToStorage();
    console.warn('service level prefs change: ', srprefs);
  }
}

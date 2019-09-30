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
  private _storePrefsInLocalStorage = false;
  /** store pref state in transient browser session storage */
  private _storePrefsInSessionStorage = true;
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

  /** public getter for private "_storePrefsInLocalStorage" */
  public get storePrefsInLocalStorage(): boolean {
    return this._storePrefsInLocalStorage;
  }
  /** public setter for private "_storePrefsInLocalStorage" */
  public set storePrefsInLocalStorage(value: boolean) {
    const prev = this._storePrefsInLocalStorage;
    this._storePrefsInLocalStorage = value;
    if (value === true) {
      // immediately save current state
      this.savePrefsToStorage();
    } else {
      // clear any existing prefs from lstorage
      this.clearPrefsFromStorage(true);
    }
    // remember setting
    this.saveGlobalSettingsToStorage();
  }

  /** public getter for private "_storePrefsInLocalStorage" */
  public get storePrefsInSessionStorage(): boolean {
    return this._storePrefsInSessionStorage;
  }
  /** public setter for private "_storePrefsInLocalStorage" */
  public set storePrefsInSessionStorage(value: boolean) {
    this._storePrefsInSessionStorage = value;
    if (value === true) {
      // immediately save current state
      this.savePrefsToStorage();
      // immediately clear anything from local storage
      this.clearPrefsFromStorage(true);
    } else {
      // clear any existing prefs from session storage
      this.clearPrefsFromStorage();
    }
    // remember setting
    this.saveGlobalSettingsToStorage();
  }

  constructor(
    public prefs: SzPrefsService,
    @Inject(LOCAL_STORAGE) private lStore: StorageService,
    @Inject(SESSION_STORAGE) private sStore: StorageService) {

    // get default prefs state for reset/clear functionality
    this._defaultPrefsValues = this.prefs.toJSONObject();

    // set up global properties if set
    this.getGlobalSettingsFromStorage();

    // if (_savePrefsInLocalStorage) set up previous state from local storage
    if (this._storePrefsInLocalStorage) {
      // initialize prefs from localStorage value
      this.prefs.fromJSONObject(this._localStorageOriginalValue);
      // console.log('initializing from local storage values: ', this._localStorageOriginalValue);
    } else if (this._storePrefsInSessionStorage ) {
      // initialize from session storage
      this.prefs.fromJSONObject(this._sessionStorageOriginalValue);
      // console.log('initializing from session storage values: ', this._sessionStorageOriginalValue);
    } else {
      // console.warn('not initializing from  storage value: ', this._storePrefsInLocalStorage, this._storePrefsInSessionStorage);
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
    if (this._storePrefsInLocalStorage) {
      this.lStore.set(this.STORAGE_KEY, this._prefsJSON);
    } else if (this._storePrefsInSessionStorage) {
      this.sStore.set(this.STORAGE_KEY, this._prefsJSON);
    }
  }
  /** get prefs json from local storage */
  getPrefsFromStorage() {
    if (this._storePrefsInLocalStorage) {
      return this.lStore.get(this.STORAGE_KEY);
    } else if (this._storePrefsInSessionStorage) {
      return this.sStore.get(this.STORAGE_KEY);
    }
  }
  /** remove any stored prefs state from storage */
  clearPrefsFromStorage(forceDeleteLocalStorage?: boolean, forceDeleteSessionStorage?: boolean) {
    if (this._storePrefsInLocalStorage || forceDeleteLocalStorage === true) {
      this.lStore.remove(this.STORAGE_KEY);
    }
    if (this._storePrefsInSessionStorage || forceDeleteSessionStorage === true) {
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
  }
  // -------------------- global settings --------------------
  /** get global app values from local storage */
  private getGlobalSettingsFromStorage() {
    let settingsModel = false;
    if (this.lStore.has(this.G_STORAGE_KEY)) {
      settingsModel = this.lStore.get(this.G_STORAGE_KEY);
    }
    if (settingsModel) {
      const modelKeys = Object.keys(settingsModel);
      if (modelKeys.indexOf && modelKeys.indexOf('storePrefsInLocalStorage') > -1) {
        this._storePrefsInLocalStorage = settingsModel['storePrefsInLocalStorage'];
      }
      if (modelKeys.indexOf && modelKeys.indexOf('storePrefsInSessionStorage') > -1) {
        this._storePrefsInSessionStorage = settingsModel['storePrefsInSessionStorage'];
      }
    }
  }
  /** save any global settings to local storage */
  private saveGlobalSettingsToStorage() {
    const settingsModel = {
      storePrefsInLocalStorage: this.storePrefsInLocalStorage,
      storePrefsInSessionStorage: this._storePrefsInSessionStorage
    };
    this.lStore.set(this.G_STORAGE_KEY, settingsModel);
  }
}

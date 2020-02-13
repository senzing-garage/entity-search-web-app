import { Component, OnInit, Inject, ViewContainerRef, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { SzPrefsService, SzAdminService, SzDataSourcesService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult,
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';

/**
 * Provides an interface for loading files in to a datasource.
 * allowed file types are:
 *
 * @example
 * <sz-bulk-data-load></sz-bulk-data-load>
 *
 * @export
 */
@Component({
  selector: 'admin-bulk-data-load',
  templateUrl: './admin-bulk-data-load.component.html',
  styleUrls: ['./admin-bulk-data-load.component.scss']
})
export class AdminBulkDataLoadComponent implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** show the analysis summary embedded in component */
  private _showAnalysis = true;
  /** show the load summary embedded in component */
  private _showResults = true;

  /** file picker element */
  @ViewChild('filePicker')
  private filePicker: ElementRef;
  /** get the current analysis from service */
  get analysis(): SzBulkDataAnalysis {
    return this.bulkDataService.currentAnalysis;
  }
  /** does user have admin rights */
  public get adminEnabled() {
    return this.adminService.adminEnabled;
  }
  /** is the current server instance read only */
  public get readOnly() {
    return this.adminService.readOnly;
  }
  /** set result of load operation from service */
  @Input() public set result(value: SzBulkLoadResult) {
    if(value) { this.bulkDataService.currentLoadResult = value; }
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }
  /** show the analysis summary embedded in component */
  public get showAnalysis(): boolean {
    return this._showAnalysis;
  }
  /** show the load summary embedded in component */
  public get showResults(): boolean {
    return this._showResults;
  }
  /** @alias showSummary */
  @Input() public set showSummaries(value: boolean) {
    this.showSummary = value;
  }
  /** whether or not to show the analysis and load summaries embedded in component */
  @Input() public set showSummary(value: boolean) {
    this._showAnalysis = value;
    this._showResults = value;
  }
  public get currentError(): Error {
    return this.bulkDataService.currentError;
  }

  constructor(
    public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

    ngOnInit() {}
    ngAfterViewInit() {}
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

    /** take the current file focus and pass to api load endpoint */
    public onFileInputChange(event: Event) {
      this.bulkDataService.isAnalyzingFile = true;
      this.bulkDataService.analyzingFile.next(true);
      const target: HTMLInputElement = <HTMLInputElement> event.target;
      const fileList = target.files;
      this.bulkDataService.file = fileList.item(0);
    }
    /** upload a file for analytics */
    public chooseFileInput(event: Event) {
      event.preventDefault();
      event.stopPropagation();
      this.filePicker.nativeElement.click();
    }
    /** take the current file focus and pass to api load endpoint */
    public loadFile(event: Event) {
      this.bulkDataService.load();
    }
    /** clear the current bulkloader focal state */
    public clear() {
      this.bulkDataService.clear();
    }

}

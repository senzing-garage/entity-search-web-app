import { Component, OnInit, Inject, ViewContainerRef, Input, OnDestroy } from '@angular/core';
import { SzPrefsService, SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Provides a component that analyzes a datasource characteristics and mapping.
 *
 * @example
 * <sz-bulk-data-analysis></sz-bulk-data-analysis>
 *
 * @export
 */
@Component({
  selector: 'admin-bulk-data-analysis',
  templateUrl: './admin-bulk-data-analysis.component.html',
  styleUrls: ['./admin-bulk-data-analysis.component.scss']
})
export class AdminBulkDataAnalysisComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** show the textual summaries for analyze and  */
  private _showSummary = true;
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
  /** whether or not a file is being analysed */
  public get analyzingFile(): boolean {
    return this.bulkDataService.isAnalyzingFile;
  }
  /** whenther or not a file is being loaded */
  public get loadingFile(): boolean {
    return this.bulkDataService.isLoadingFile;
  }
  /** set result of load operation from service */
  @Input() public set result(value: SzBulkLoadResult) {
    if(value) { this.bulkDataService.currentLoadResult = value; }
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }
  /** @alias showSummary */
  @Input() public set showSummaries(value: boolean) {
    this.showSummary = value;
  }
  /** whether or not to show the analysis and load summaries embedded in component */
  @Input() public set showSummary(value: boolean) {
    this._showSummary = value;
  }
  /** whether or not the analysis and load summaries are shown in component */
  public get showSummary(): boolean {
    return this._showSummary;
  }
  /** set the file to be analyzed */
  @Input() public set file(value: File) {
    if(value) { this.analyzeFile(value); }
  }

  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    this.adminService.onServerInfo.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((info) => {
      console.log('ServerInfo obtained: ', info);
    });
    this.bulkDataService.onError.subscribe((err) => {
      console.warn('SHOW ERROR MESSAGE!', err);
    });
  }

  /** convenience method to analyze a file. used by file setter. */
  public analyzeFile(file: File) {
    return this.bulkDataService.analyze(file);
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

import { Component, OnInit, Inject, ViewContainerRef, Input, OnDestroy } from '@angular/core';
import { SzPrefsService, SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminBulkDataService, AdminStreamAnalysisSummary, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';

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
  /** set current analysis from service */
  @Input() public set analysis(value: SzBulkDataAnalysis | AdminStreamAnalysisSummary) {
    if(value) { this.adminBulkDataService.currentAnalysisResult = value; }
  }
  /** get the current analysis from service */
  public get analysis(): SzBulkDataAnalysis | AdminStreamAnalysisSummary {
    return this.adminBulkDataService.currentAnalysisResult;
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
    return this.adminBulkDataService.isAnalyzingFile;
  }
  /** whenther or not a file is being loaded */
  public get loadingFile(): boolean {
    return this.adminBulkDataService.isLoadingFile;
  }
  /** set result of load operation from service */
  @Input() public set result(value: SzBulkLoadResult | AdminStreamLoadSummary) {
    if(value) { this.adminBulkDataService.currentLoadResult = value; }
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult | AdminStreamLoadSummary {
    return this.adminBulkDataService.currentLoadResult;
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

  /** whether or not to use streaming sockets for analysis and loading */
  public get useSocketStream() {
    return this.adminBulkDataService.useStreaming;
  }
  public get canOpenStreamSocket(): boolean {
    return this.adminBulkDataService.canOpenStreamSocket;
  }

  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private adminBulkDataService: AdminBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    this.adminService.onServerInfo.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((info) => {
      console.log('ServerInfo obtained: ', info);
    });
    this.adminBulkDataService.onError.subscribe((err) => {
      console.warn('SHOW ERROR MESSAGE!', err);
    });
  }

  /** convenience method to analyze a file. used by file setter. */
  public analyzeFile(file: File) {
    console.info('AdminBulkDataAnalysisComponent.analyzeFile: ', file, this.adminBulkDataService.streamAnalysisConfig, this.adminBulkDataService.streamConnectionProperties);
    
    return this.adminBulkDataService.analyze(file);
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

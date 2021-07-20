import { Component, OnInit, Inject, ViewContainerRef, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { SzPrefsService, SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AdminBulkDataService, AdminStreamAnalysisSummary, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';
import { AboutInfoService } from '../../services/about.service';

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
export class AdminBulkDataAnalysisComponent implements OnInit, OnDestroy, AfterViewInit {
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
    return this.adminBulkDataService.useStreaming && this.aboutInfoService.isPocServerInstance;
  }
  public get canOpenStreamSocket(): boolean {
    return this.adminBulkDataService.canOpenStreamSocket;
  }

  /**
   * 0 = not loading
   * 1 = reading file
   * 2 = sending records
   * 3 = complete (all records sent)
   * @todo convert to dict enum value
   */
  private _streamImportPhase        = 0;
  private _streamImportInProgress   = false;
  private _streamImportPaused       = false;
  private _streamImportComplete     = false;
  private _currentStreamLoadStats: AdminStreamLoadSummary;

  private _streamAnalysisInProgress = false;
  private _streamAnalysisPaused     = false;
  private _streamAnalysisComplete   = false;
  private _currentStreamAnalysisStats: AdminStreamAnalysisSummary;

  public get currentAnalysisLoadStats(): AdminStreamAnalysisSummary {
    return this._currentStreamAnalysisStats;
  }
  public get streamAnalysisInProgress(): boolean {
    return this._streamAnalysisInProgress;
  }
  public set streamAnalysisInProgress(value: boolean) {
    this._streamAnalysisInProgress = value;
  }
  public get streamAnalysisPaused(): boolean {
    return this._streamAnalysisPaused;
  }
  public set streamAnalysisPaused(value: boolean) {
    this._streamAnalysisPaused = value;
  }
  
  public get streamAnalysisComplete(): boolean {
    return this._streamAnalysisComplete;
  }
  public set streamAnalysisComplete(value: boolean) {
    this._streamAnalysisComplete = value;
  }

  public get currentStreamLoadStats(): AdminStreamLoadSummary {
    return this._currentStreamLoadStats;
  }
  public get streamImportInProgress(): boolean {
    return this._streamImportInProgress;
  }
  public set streamImportInProgress(value: boolean) {
    this._streamImportInProgress = value;
  }
  public get streamImportPaused(): boolean {
    return this._streamImportPaused;
  }
  public set streamImportPaused(value: boolean) {
    this._streamImportPaused = value;
  }
  
  public get streamImportComplete(): boolean {
    return this._streamImportComplete;
  }
  public set streamImportComplete(value: boolean) {
    this._streamImportComplete = value;
  }
  public set streamImportPhase(value: number) {
    this._streamImportPhase = value;
    switch(value) {
      case 0:
        this._streamImportInProgress  = false;
        this._streamImportComplete    = false;
        break;
      case 1:
        this._streamImportInProgress  = true;
        break;
      case 2: 
        this._streamImportInProgress  = true;
        break;
      case 3:
        this._streamImportInProgress  = false;
        this._streamImportComplete    = false;
        break;
    }
  }
  public get streamImportPhase(): number {
    return this._streamImportPhase;
  }

  private _streamStatusMessageSpecialOperation = undefined;

  public get streamStatusMessage(): string {
    if(this._streamStatusMessageSpecialOperation && this._streamStatusMessageSpecialOperation !== undefined) {
      // special operation message overrides default logic
      return this._streamStatusMessageSpecialOperation;
    }
    let retStr = 'Initializing...';
    if(this._currentStreamLoadStats) {
      let sentValue        = this._currentStreamLoadStats.receivedRecordCount ? this._currentStreamLoadStats.receivedRecordCount : this._currentStreamLoadStats.sentRecordCount;
      if(this._currentStreamLoadStats.complete) {
        retStr = 'Complete';
      } else if(this._streamImportPaused) {
        retStr = `Paused: ${sentValue}/${this._currentStreamLoadStats.recordCount}`;
      } else {
        //retStr = undefined;
        retStr = `Loading: ${sentValue}/${this._currentStreamLoadStats.recordCount}`;
      }
    }
    return retStr;
  }
  
  public get streamImportProgressBarValue(): number {
    let retValue = 0;
    if(this._currentStreamLoadStats && this._currentStreamLoadStats.recordCount > 0){
      let percUnit        = (100 / this._currentStreamLoadStats.recordCount);
      let percMult        = this._currentStreamLoadStats.receivedRecordCount ? this._currentStreamLoadStats.receivedRecordCount : this._currentStreamLoadStats.sentRecordCount;
      let currentPercent  = Math.ceil((percMult * percUnit));
      retValue = currentPercent;
    }
    return retValue;
  }

  public get streamImportProgressBarMode(): string {
    let retValue = 'determinate';
    
    if(this._streamImportPhase === 2 || this._streamImportPhase === 3) {
      if(this._streamImportPhase === 2) {
        //retValue = 'query';
      } else {
        retValue = 'determinate';
      }
    }
    return retValue;
  }

  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    public aboutInfoService: AboutInfoService,
    private adminBulkDataService: AdminBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    this.adminService.onServerInfo.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((info) => {
      console.log('ServerInfo obtained: ', info);
    });
    this.adminBulkDataService.onError.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((err) => {
      console.warn('SHOW ERROR MESSAGE!', err);
    });
  }
  ngAfterViewInit() {
    // all phase 1
    // ---------------------- import records handlers --------------- 
    this.adminBulkDataService.onStreamLoadFileReadStarted
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((state) => { 
      if(this._streamImportInProgress){
        this.streamImportPhase = 1;
      }
    });
    this.adminBulkDataService.onStreamLoadFileReadProgress
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((summary: AdminStreamLoadSummary ) => {
      this.streamImportPhase = 1; 
      this._currentStreamLoadStats = (summary as AdminStreamLoadSummary);
    });
    this.adminBulkDataService.onStreamLoadFileReadComplete
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined && this._streamImportInProgress; })
    ).subscribe((state) => {
      this.streamImportPhase = 2; 
    });
    // ---------------------- analysis stream handlers --------------- 
    this.adminBulkDataService.onStreamAnalysisFileReadStarted
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((state) => { 
      this._streamAnalysisInProgress = true;
    });
    this.adminBulkDataService.onStreamAnalysisFileReadProgress
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((summary: AdminStreamAnalysisSummary) => { 
      this._currentStreamAnalysisStats = summary;
    });
    /*
    this.adminBulkDataService.onStreamAnalysisReadComplete
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined && this._streamImportInProgress; })
    ).subscribe((state) => {
      this._streamAnalysisComplete = true;
    });*/

    // analysis phases
    this.adminBulkDataService.onStreamAnalysisStarted.pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((state) => { 
      this.streamAnalysisInProgress = true;
    });
    this.adminBulkDataService.onStreamAnalysisComplete.pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; }))
    .subscribe((summary) => { 
      //console.warn('AdminBulkDataAnalysisComponent.onStreamAnalysisComplete: ', summary);
      this.streamAnalysisComplete = true;
      this.streamAnalysisInProgress = false;
    });

    // load phases
    this.adminBulkDataService.onStreamLoadStarted.pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((state) => { 
      this.streamImportInProgress = true;
      this.streamImportPhase = 2;
      //console.warn(`adminBulkDataService.onStreamLoadStarted: ${this.streamImportInProgress}`);
    });
    this.adminBulkDataService.onStreamLoadProgress
    .pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((summary) => { 
      this.streamImportPhase = 2; 
      this._currentStreamLoadStats = summary;
      //console.log('onStreamLoadProgress: ', summary);
    });
    this.adminBulkDataService.onStreamLoadPaused.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((pausedState: boolean) => { 
      this._streamImportPaused = pausedState; 
      //console.log('onStreamLoadProgress: ', summary);
    });
    this.adminBulkDataService.onStreamLoadComplete.pipe(
      takeUntil(this.unsubscribe$),
      filter( (value) => { return value !== undefined; })
    ).subscribe((state) => { 
      this.streamImportPhase = 3;
      this._streamImportComplete = true;
    });

    this.adminBulkDataService.onAutoCreatingDataSources.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (dataSources) => {
      if(dataSources && dataSources.length > 0 && this._streamStatusMessageSpecialOperation === undefined) {
        this._streamStatusMessageSpecialOperation = 'creating datasource'+ (dataSources && dataSources.length > 1 ? 's' : '') +': '+ (dataSources && dataSources.join ? dataSources.join(', ') : dataSources);
      } else {
        this._streamStatusMessageSpecialOperation = undefined;
      }
    });
    this.adminBulkDataService.onAnalysisCleared.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (cleared) => {
      this._streamAnalysisInProgress  = false;
      this._streamAnalysisComplete    = false;
      this._streamImportPhase         = 0;
      this._streamImportInProgress    = false;
      //console.info('cleared _streamAnalysisComplete: ', this._streamAnalysisComplete);
    });
    this.adminBulkDataService.onImportJobCleared.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (cleared) => {
      this._streamImportComplete    = false;
      this._streamImportPhase       = 0;
      this._streamImportInProgress  = false;
      this._streamImportPaused      = false;
      //console.info('cleared _streamLoadComplete: ', this._streamImportComplete);
    });
  }

  /** convenience method to analyze a file. used by file setter. */
  public analyzeFile(file: File) {    
    return this.adminBulkDataService.analyze(file);
  }
  /** pause stream load */
  public pauseStreamImport() {
    this.adminBulkDataService.pauseStreamLoad();
  }
  /** resume stream load */
  public resumeStreamImport() {
    this.adminBulkDataService.resumeStreamLoad();
  }

  public streamImportPhaseIs(phase: string | number) {
    let retValue = false;
    if((phase as number) && (phase as number).toPrecision && [0,1,2,3].indexOf((phase as number))) {
      // phase value is integer
      return (this._streamImportPhase === phase);
    } else if((phase as string) && (phase as string).substr) {
      //console.log('streamImportPhaseIs('+ phase +'): '+ (phase as string).toLowerCase());
      // assume string
      switch((phase as string).toLowerCase()) {
        case 'loading':
          return this._streamImportPhase === 0;
          break;
        case 'reading':
          return (this._streamImportPhase === 1);
          break;
        case 'sending': 
          return this._streamImportPhase === 2;
          break;
        case 'complete':
          return this._streamImportPhase === 3;
          break;
      }
    }
    return retValue;
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

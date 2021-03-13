import { Component, OnInit, Inject, ViewContainerRef, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { SzPrefsService, SzAdminService, SzDataSourcesService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult,
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { AdminBulkDataService, AdminStreamAnalysisSummary, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';
import { filter } from 'rxjs/operators';
import { SzStreamingFileRecordParser } from '../../common/streaming-file-record-parser';

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
  /*
  get analysis(): SzBulkDataAnalysis {
    return this.adminBulkDataService.currentAnalysis;
  }*/
  public get analysis(): SzBulkDataAnalysis | AdminStreamAnalysisSummary {
    return this.adminBulkDataService.currentAnalysisResult;
  }
  @Input() public set analysis(value: SzBulkDataAnalysis | AdminStreamAnalysisSummary) {
    if(value) { 
      if((value as AdminStreamAnalysisSummary).bytesSent >= 0) {
        this.adminBulkDataService.currentAnalysisResult = value as AdminStreamAnalysisSummary; 
      } else {
        this.adminBulkDataService.currentAnalysisResult = value as SzBulkDataAnalysis; 
      }
    }
  }

  /** use websockets to stream file input records and results*/
  @Input() public set useSocketStream(value: boolean) {
    this.adminBulkDataService.useStreaming = value;
    if(this.adminBulkDataService.useStreaming) {
      this._supportedFileTypes = [
        '.JSON',
        '.json',
        '.jsonl',
        '.JSONL'
      ]
    }
  }
  /** whether or not to use streaming sockets for analysis and loading */
  public get useSocketStream() {
    return this.adminBulkDataService.useStreaming;
  }
  public get canOpenStreamSocket(): boolean {
    return this.adminBulkDataService.canOpenStreamSocket;
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
  @Input() public set result(value: SzBulkLoadResult | AdminStreamLoadSummary) {
    if(value) { 
      if((value as AdminStreamLoadSummary).bytesSent >= 0) {
        this.adminBulkDataService.currentLoadResult = value as AdminStreamLoadSummary; 
      } else {
        this.adminBulkDataService.currentLoadResult = value as SzBulkLoadResult; 
      }
    }
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult | AdminStreamLoadSummary {
    return this.adminBulkDataService.currentLoadResult;
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
    return this.adminBulkDataService.currentError;
  }
  /** file types allowed to select in dropdown */
  private _supportedFileTypes = [
    '.JSON',
    '.json',
    '.csv',
    '.CSV',
    '.jsonl',
    '.JSONL'
  ]
  public get supportedFileTypes(): string {
    return this._supportedFileTypes.join(',');
  }
  public set supportedFileTypes(value: string) {
    this._supportedFileTypes = value.split(',');
  }

  constructor(
    public prefs: SzPrefsService,
    private adminService: SzAdminService,
    //private bulkDataService: SzBulkDataService,
    private adminBulkDataService: AdminBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

    ngOnInit() {}
    ngAfterViewInit() {
      // if its the users first file load and they just verified stream host
      // immediately prompt for file selection
      this.adminBulkDataService.onUseStreamingSocketChange.pipe(
        filter( (useStreamingForLoad: boolean) => {
          return useStreamingForLoad && !this.adminBulkDataService.file && this.adminBulkDataService.streamConnectionProperties.connectionTest;
        })
      ).subscribe( (useStreaming) => {
        console.info('AdminBulkDataLoadComponent.adminBulkDataService.onUseStreamingSocketChange: '+ useStreaming);
        this.chooseFileInputFS();
      });
    }
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

    /** take the current file focus and pass to api load endpoint */
    public onFileInputChange(event: Event) {
      //this.adminBulkDataService.isAnalyzingFile = true;
      //this.adminBulkDataService.analyzingFile.next(true);
      const target: HTMLInputElement = <HTMLInputElement> event.target;
      const fileList = target.files;
      /*if(this.useSocketStream && this.canOpenStreamSocket) {
        this.onFileInputStreamAnalysis(event);
        return;
      }*/
      this.adminBulkDataService.file = fileList.item(0);
    }
    /*
    public onFileInputStreamAnalysis(event: Event) {
      //alert('using stream parser for analysis..');
      const target: HTMLInputElement = <HTMLInputElement> event.target;
      const fileList = target.files;
      this.adminBulkDataService.file = fileList.item(0);
    }*/
    /** upload a file for analytics */
    public chooseFileInput(event?: Event) {
      
      if(event && event.preventDefault) event.preventDefault();
      if(event && event.stopPropagation) event.stopPropagation();
      this.filePicker.nativeElement.click();
    }
    /** upload a file for analytics */
    public chooseFileInputFS(event?: Event) {
      if(event && event.preventDefault) event.preventDefault();
      if(event && event.stopPropagation) event.stopPropagation();
      if(this.filePicker && this.filePicker.nativeElement) {
        try {
          this.filePicker.nativeElement.click();
        } catch(e) {
          console.warn('AdminBulkDataLoadComponent.filePicker.nativeElement.click error', e);
        }
      } else {
        console.warn('AdminBulkDataLoadComponent.filePicker.nativeElement missing');
      }
    }
    /** take the current file focus and pass to api load endpoint */
    public loadFile(event: Event) {
      this.adminBulkDataService.load();
    }

    /** take the current file focus and pass to api load endpoint */
    public loadFileFS(event: Event) {
      this.adminBulkDataService.streamLoad(this.adminBulkDataService.file)
      //.pipe(take(1))
      //.subscribe((loadSummary: AdminStreamLoadSummary) => {
        //console.log('[stats] streamLoad: ', loadSummary.recordCount);
      //  this._currentStreamLoadStats = loadSummary;
      //});
    }

    /** clear the current bulkloader focal state */
    public clear() {
      this.adminBulkDataService.clear();
    }
}

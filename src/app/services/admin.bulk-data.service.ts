import { Injectable, Inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, from, interval, Subject, BehaviorSubject, timer } from 'rxjs';
import { map, catchError, tap, switchMap, takeUntil, take, filter, takeWhile, delay } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzEntityTypesService, SzServerInfo, SzBaseResponseMeta, SzPrefsService, SzBulkDataService, SzDataSourcesService } from '@senzing/sdk-components-ng';
import { HttpClient } from '@angular/common/http';
import { AuthConfig, SzWebAppConfigService } from './config.service';
import { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig } from '@senzing/sdk-components-ng';

import {
    determineLineEndingStyle,
    getFileTypeFromName,
    lineEndingStyle, 
    lineEndingStyleAsEnumKey,
    validImportFileTypes,
    getUtf8ByteLength
} from '../common/import-utilities';

import { WebSocketService } from './websocket.service';
import { SzStreamingFileRecordParser } from '../common/streaming-file-record-parser';
import { BulkDataService, SzBulkDataAnalysis, SzBulkDataAnalysisResponse, SzBulkLoadResponse, SzBulkLoadResult, SzDataSourceRecordAnalysis, SzDataSourceBulkLoadResult, SzEntityTypeBulkLoadResult, SzEntityTypeRecordAnalysis } from '@senzing/rest-api-client-ng';
import { sum } from 'd3';

export interface AdminStreamLoadSummary {
    fileType: any,
    fileName: string,
    fileSize: number,
    fileLineEndingStyle: lineEndingStyle,
    fileColumns?: string[],
    characterEncoding: any,
    mediaType: any,
    recordCount: number,
    sentRecordCount: number,
    unsentRecordCount: number,
    failedRecordCount: number,
    missingDataSourceCount: number,
    missingEntityTypeCount: number
    bytesRead: number,
    bytesSent: number,
    bytesQueued: number,
    dataSources?: string[],
    complete?: boolean
    /**
     * The array of `SzDataSourceBulkDataResult` elements describing the load statistics by data source.
     */
    resultsByDataSource?: Array<SzDataSourceBulkLoadResult>;
    /**
     * The array of `SzEntityTypeBulkDataResult` elements describing the load statistics by entity type.
     */
    resultsByEntityType?: Array<SzEntityTypeBulkLoadResult>;
}

export interface AdminStreamAnalysisSummary {
    fileType: any,
    fileName: string,
    fileSize: number,
    fileLineEndingStyle: lineEndingStyle,
    fileColumns?: string[],
    characterEncoding: any,
    mediaType: any,
    recordCount: number,
    sentRecordCount: number,
    unsentRecordCount: number,
    failedRecordCount: number,
    missingDataSourceCount: number,
    missingEntityTypeCount: number
    bytesRead: number,
    bytesSent: number,
    bytesQueued: number,
    dataSources?: string[],
    complete?: boolean
    /**
     * The array of `SzDataSourceBulkDataResult` elements describing the load statistics by data source.
     */
    resultsByDataSource?: Array<SzDataSourceBulkLoadResult>;
    /**
     * The array of `SzEntityTypeBulkDataResult` elements describing the load statistics by entity type.
     */
    resultsByEntityType?: Array<SzEntityTypeBulkLoadResult>;
}

export interface StreamReaderComplete {
    (streamClosed: boolean): void;
}

/*
export interface AdminStreamConnProperties {
    connected: boolean;
    clientId?: string;
    hostname: string;
    sampleSize: number;
    port?: number;
    connectionTest: boolean;
    reconnectOnClose: boolean;
}*/

/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class AdminBulkDataService {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    /** current file to analyze or load */
    public currentFile: File;
    /**  
     * current result of last analysis operation 
     * @deprecated
     **/
    public currentAnalysis: SzBulkDataAnalysis;

    /** current result of last file load attempt */
    public currentLoadResult: SzBulkLoadResult | AdminStreamLoadSummary;
    /** current result of last analysis operation */
    public currentAnalysisResult: SzBulkDataAnalysis | AdminStreamAnalysisSummary;

    /** map of current datasource name to new datasource names */
    public dataSourceMap: { [key: string]: string };
    /** map of current entity type name to new entity type names */
    public entityTypeMap: { [key: string]: string };
    /** current datasources */
    _dataSources: string[];
    /** current entity types */
    _entityTypes: string[];
    /** when the file input changes this subject is broadcast */
    public onCurrentFileChange = new Subject<File>();
    /** when the analysis result changes this behavior subject is broadcast */
    public onAnalysisChange = new BehaviorSubject<SzBulkDataAnalysis>(undefined);
    /** when the datasources change this behavior subject is broadcast */
    public onDataSourcesChange = new BehaviorSubject<string[]>(undefined);
    /** when the entity types change this behavior subject is broadcast */
    public onEntityTypesChange = new BehaviorSubject<string[]>(undefined);
    /** when a datasrc destination changes this subject is broadcast */
    public onDataSourceMapChange = new Subject<{ [key: string]: string }>();
    /** when a enity type destination changes this subject is broadcast */
    public onEntityTypeMapChange = new Subject<{ [key: string]: string }>();
    /** when the result of a load operation changes this behavior subject is broadcast */
    public onLoadResult = new BehaviorSubject<SzBulkLoadResult | AdminStreamLoadSummary>(undefined);
    
    private _onAutoCreatingDataSource   = false;
    private _onAutoCreatingDataSources  = new Subject<string[]>();
    public onAutoCreatingDataSources    = this._onAutoCreatingDataSources.asObservable();

    // ------------------- stream loading -------------------
    private _onStreamLoadStarted    = new BehaviorSubject<AdminStreamLoadSummary>(undefined);
    private _onStreamLoadProgress   = new BehaviorSubject<AdminStreamLoadSummary>(undefined);
    private _onStreamLoadComplete   = new BehaviorSubject<AdminStreamLoadSummary>(undefined);
    private _onStreamReadStarted    = new BehaviorSubject<AdminStreamLoadSummary>(undefined);
    private _onStreamReadProgress   = new BehaviorSubject<AdminStreamLoadSummary>(undefined);
    private _onStreamReadComplete   = new BehaviorSubject<AdminStreamLoadSummary>(undefined);

    // --- public interfaces
    public onStreamLoadStarted      = this._onStreamLoadStarted.asObservable();
    public onStreamLoadProgress     = this._onStreamLoadProgress.asObservable();
    public onStreamLoadComplete     = this._onStreamLoadComplete.asObservable();
    public onStreamReadStarted      = this._onStreamReadStarted.asObservable();
    public onStreamReadProgress     = this._onStreamReadProgress.asObservable();
    public onStreamReadComplete     = this._onStreamReadComplete.asObservable();

    /** when the result of a load operation changes this behavior subject is broadcast */
    public onAnalysisResult = new BehaviorSubject<SzBulkDataAnalysis | AdminStreamAnalysisSummary>(undefined);
    /** when an error occurs this subject is emitted 
     * @internal
    */
    private _onError = new Subject<Error>();
    /** when an error occurs this subject is emitted */
    public onError = this._onError.asObservable();
    /** when the status of the websocket stream changes */
    private _onStreamStatusChange = new Subject<CloseEvent | Event>();
    public onStreamStatusChange = this._onStreamStatusChange.asObservable();
    public onStreamConnectionStateChange = this._onStreamStatusChange.asObservable().pipe(
        map( WebSocketService.statusChangeEvtToConnectionBool )
    )
    /** when a file is being analyzed */
    public analyzingFile = new Subject<boolean>();
    /** when a file is being analyzed */
    public isAnalyzingFile = false;
    /** when a file is being analyzed in the current thread */
    public loadingFile = new Subject<boolean>();
    /** when a file is being loaded in to the engine on thread*/
    public isLoadingFile = false;
    public currentError: Error;
    /** use streaming file record importing */
    public set useStreamingForLoad(value: boolean) {
        this.prefs.admin.useStreamingForLoad = value;
    }
    public get useStreamingForLoad(): boolean {
        return this.prefs.admin.useStreamingForLoad;
    }
    /** use streaming file importing analysis */
    public set useStreamingForAnalysis(value: boolean) {
        this.prefs.admin.useStreamingForAnalysis = value;
    }
    public get useStreamingForAnalysis(): boolean {
        return this.prefs.admin.useStreamingForAnalysis;
    }
    
    /** convenience setter for setting both "useStreamingForLoad" and "useStreamingForAnalysis" to the same value */
    public set useStreaming(value: boolean) {
        this.useStreamingForAnalysis = value;
        this.useStreamingForLoad = value;
    }
    /** convenience getter, returns true if both useStreamingForAnalysis and useStreamingForLoad are set to true */
    public get useStreaming(): boolean {
        return (this.useStreamingForAnalysis && this.useStreamingForLoad);
    }
    /** when the load behavrior changes from stream to http or vise-versa */
    private _onUseStreamingSocketChange = new BehaviorSubject<boolean>(this.useStreamingForLoad);
    public onUseStreamingSocketChange = this._onUseStreamingSocketChange.asObservable();
    /** is the configuration for streaming valid */
    public get canOpenStreamSocket(): boolean {
        return (this.webSocketService && this.webSocketService.connectionProperties) ? this.webSocketService.connectionProperties.connectionTest : false;
    }
    /** parameters that change behavior of streaming mode analysis. eg "sampleSize", "ignoreRecordsWithNoDataSource" */
    public get streamAnalysisConfig(): AdminStreamAnalysisConfig {
        return this.prefs.admin.streamAnalysisConfig;
    }
    /** parameters that change behavior of streaming mode analysis. eg "sampleSize", "ignoreRecordsWithNoDataSource" */
    public set streamAnalysisConfig(value: AdminStreamAnalysisConfig) {
        this.prefs.admin.streamAnalysisConfig = value;
    }
    /** proxy to websocket service connection properties */
    public set streamConnectionProperties(value: AdminStreamConnProperties) {
        //this.webSocketService.connectionProperties = value;
        // update stream connection prefs
        this.prefs.admin.streamConnectionProperties = value;
    }
    public get streamConnectionProperties(): AdminStreamConnProperties {
        return this.webSocketService.connectionProperties;
    }
    /** parameters that change behavior of loading/importing records via streaming interface. eg "mapUnspecifieD", "ignoreRecordsWithNoDataSource" */
    public get streamLoadConfig(): AdminStreamLoadConfig {
        return this.prefs.admin.streamLoadConfig;
    }
    public set streamLoadConfig(value: AdminStreamLoadConfig) {
        this.prefs.admin.streamLoadConfig = value
    }
    public set streamBulkPrefSet(value: boolean) {
        if(!value && this.prefs.admin.bulkSet) {
            // if changing from false to true, do immediate prefschange event
            this.prefs.admin.prefsChanged.next( this.prefs.admin.toJSONObject() );
        }
        this.prefs.admin.bulkSet = value;
    }
    public get streamConnected(): boolean {
        return this.webSocketService.connected;
    }
    // /AdminStreamAnalysisConfig, AdminStreamLoadConfig


    /** the file to analyze, map, or load */
    public set file(value: File) {
        this.currentFile = value;
        this.currentAnalysis = null;
        this.currentAnalysisResult = null;
        this.currentLoadResult = null;
        this.onCurrentFileChange.next( this.currentFile );
    }
    /** the file being analyzed, mapped, or loaded */
    public get file(): File {
        return this.currentFile;
    }
    /** the datasources currently present */
    private get dataSources(): string[] {
        return this._dataSources;
    }
    /** the entity types currently present */
    private get entityTypes(): string[] {
        return this._entityTypes;
    }

    constructor(
        public prefs: SzPrefsService,
        private adminService: SzAdminService,
        //private bulkDataService: SzBulkDataService,
        private bulkDataService: BulkDataService,
        private datasourcesService: SzDataSourcesService,
        private entityTypesService: SzEntityTypesService,
        private webSocketService: WebSocketService,
    ) {
        this.prefs.admin.prefsChanged.subscribe((prefs) => {
            //console.log('AdminBulkDataService.prefs.admin.prefChanged: ', this.webSocketService.connected, prefs);
            if(prefs && prefs && prefs.streamConnectionProperties !== undefined) {
                let _streamConnProperties = (prefs.streamConnectionProperties) as AdminStreamConnProperties;
                //console.log('stream connection properties saved to prefs: ', JSON.stringify(_streamConnProperties) == JSON.stringify(this.streamConnectionProperties), _streamConnProperties, this.streamConnectionProperties);
                this.webSocketService.connectionProperties = _streamConnProperties;
                // I tried doing some fancy checking etc
                // more reliable to just always publish this on change
                this._onUseStreamingSocketChange.next( (_streamConnProperties.connectionTest && prefs.useStreamingForLoad && prefs.useStreamingForAnalysis) );
            } else {
                console.warn('no stream connection props in payload: ', prefs);
            }
        });
        this.webSocketService.onError.subscribe((error: Error) => {
            //console.warn('AdminBulkDataService.webSocketService.onError: ', error);
            this._onError.next(error);
        });
        this.webSocketService.onStatusChange.subscribe((statusEvent: CloseEvent | Event) => {
            //console.warn('AdminBulkDataService.webSocketService.onStatusChange: ', statusEvent);
            this._onStreamStatusChange.next(statusEvent);
        });
        /** check if "reconnection error" is present, if connection state changes to "true" clear out error */
        this.webSocketService.onConnectionStateChange.pipe(
            takeUntil(this.unsubscribe$),
            filter( (connected) => {
                return (this.currentError !== undefined) && connected && !this.streamConnectionProperties.connected;
            }),
          ).subscribe((status) => {
            console.warn('AdminBulkDataService.webSocketService.onConnectionStateChange: clear current error:', this.currentError);
            // check to see if we should clear the current error
            this.currentError = undefined;
          });
        this.onCurrentFileChange.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe( (file: File) => {
            if(!file){ return; }
            this.analyzingFile.next(true);
            //console.info('AdminBulkDataService().onCurrentFileChange: ', file, this.streamAnalysisConfig, this.streamConnectionProperties);

            if(this.useStreamingForLoad && this.canOpenStreamSocket) {
                // open analysis stream

                this.streamAnalyze(file).pipe(
                    takeUntil(this.unsubscribe$),
                    take(1)
                )
                .subscribe((result: AdminStreamAnalysisSummary) => {
                    //this.currentAnalysisResult = result;
                    console.warn('AdminBulkDataService().onCurrentFileChange.streamAnalyze: result', result);
                }, (error: Error) =>{
                    console.warn('AdminBulkDataService().onCurrentFileChange.streamAnalyze: error', error)
                })
            } else {
                // standard serialized payload
                this.analyze(file).toPromise().then( (analysisResp: SzBulkDataAnalysisResponse) => {
                    //console.log('autowire analysis resp on file change: ', analysisResp, this.currentAnalysis);
                    this.analyzingFile.next(false);
                }, (err) => {
                    console.warn('analyzing of file threw..', err);
                });
            }
        });
        this.analyzingFile.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe( (isAnalyzing: boolean) => {
            this.isAnalyzingFile = isAnalyzing;
        });
        this.loadingFile.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe( (isLoading: boolean) => {
            this.isLoadingFile = isLoading;
        });
        // update datasources in case new ones were added on load
        this.onLoadResult.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe( (resp: SzBulkLoadResult) => {
            this.updateDataSources();
        });
        // update entity types in case new ones were added on load
        this.onLoadResult.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe( (resp: SzBulkLoadResult) => {
            this.updateEntityTypes();
        });
        this.onError.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe( (err: Error) => {
            console.log('error happened: ', err);
            this.currentError = err;
        });
        this.onAutoCreatingDataSources.subscribe( (dataSources: string[] | undefined) => {
            this._onAutoCreatingDataSource = (dataSources && dataSources.length > 0) ? true : false;
        });
        this.adminService.onServerInfo.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe((info) => {
            //console.log('ServerInfo obtained: ', info);
        });
        this.updateDataSources();
        this.updateEntityTypes();
    }

    /** update the internal list of datasources
     * @internal
     */
    private updateDataSources() {
        this.datasourcesService.listDataSources().pipe(
        takeUntil( this.unsubscribe$ )
        ).subscribe((datasources: string[]) => {
        //console.log('datasources obtained: ', datasources);
        this._dataSources = datasources.filter(s => s !== 'TEST' && s !== 'SEARCH');
        this.onDataSourcesChange.next(this._dataSources);
        },
        (err) => {
        // ignore errors since this is a auto-req
        });
    }
    /** update the internal list of datasources
     * @internal
     */
    private updateEntityTypes() {
        this.entityTypesService.listEntityTypes().pipe(
        takeUntil( this.unsubscribe$ )
        ).subscribe((entityTypes: string[]) => {
        //console.log('entity types obtained: ', entityTypes);
        this._entityTypes = entityTypes.filter(s => s !== 'TEST' && s !== 'SEARCH');
        this.onEntityTypesChange.next(this._entityTypes);
        },
        (err) => {
        // ignore errors since this is a auto-req
        });
    }
    /** create a new datasource */
    public createDataSources(dataSources: string[]): Observable<string[]> {
        console.log('SzBulkDataService.createDataSources: ', dataSources);
        return this.datasourcesService.addDataSources(dataSources);
    }
    /** create a new entity type */
    public createEntityTypes(entityTypes: string[]): Observable<string[]> {
        console.log('SzBulkDataService.createEntityTypes: ', entityTypes);
        return this.entityTypesService.addEntityTypes(entityTypes, "ACTOR");
    }

    /** analze a file and prep for mapping */
    public analyze(file: File): Observable<SzBulkDataAnalysisResponse> {
        //console.log('SzBulkDataService.analyze: ', file);
        this.currentError = undefined;
        this.analyzingFile.next(true);
        return this.bulkDataService.analyzeBulkRecords(file).pipe(
        catchError(err => {
            this._onError.next(err);
            return of(undefined);
        }),
        tap( (result: SzBulkDataAnalysisResponse) => {
            this.analyzingFile.next(false);
            this.currentAnalysis = (result && result.data) ? result.data : {};
            this.dataSourceMap = this.getDataSourceMapFromAnalysis( this.currentAnalysis.analysisByDataSource );
            this.entityTypeMap = this.getEntityTypeMapFromAnalysis( this.currentAnalysis.analysisByEntityType );
            this.onDataSourceMapChange.next( this.dataSourceMap );
            this.onEntityTypeMapChange.next( this.entityTypeMap );
            this.onAnalysisChange.next( this.currentAnalysis );
            console.log('analyze set analysis respose: ', this.dataSourceMap, this.entityTypeMap, this.currentAnalysis);
        })
        )
    }
    /**
     * load a files contents in to a datasource.
     * @TODO show usage example.
     */
    public load(file?: File, dataSourceMap?: { [key: string]: string }, entityTypeMap?: { [key: string]: string }, analysis?: SzBulkDataAnalysis ): Observable<SzBulkLoadResult> | undefined {
        //console.log('SzBulkDataService.load: ', dataSourceMap, entityTypeMap, file, this.currentFile);
        file = file ? file : this.currentFile;
        this.currentError = undefined;
        dataSourceMap = dataSourceMap ? dataSourceMap : this.dataSourceMap;
        entityTypeMap = entityTypeMap ? entityTypeMap : this.entityTypeMap;
        analysis      = analysis ?      analysis      : this.currentAnalysis;

        if(file && dataSourceMap && analysis) {
        const newDataSources = this.currentAnalysis.analysisByDataSource.filter(a => {
            const targetDS = this.dataSourceMap[((a.dataSource === null || a.dataSource === undefined) ? "" : a.dataSource)];
            return (targetDS && this._dataSources.indexOf(targetDS) < 0);
        }).map( (b) => {
            return this.dataSourceMap[(b.dataSource === null || b.dataSource === undefined ? "" :  b.dataSource)];
        });
        const newEntityTypes = this.currentAnalysis.analysisByEntityType.filter(a => {
            const targetET = this.entityTypeMap[((a.entityType === null || a.entityType === undefined) ? "" : a.entityType )];
            return (targetET && this._entityTypes.indexOf(targetET) < 0);
        }).map( (b) => {
            return this.entityTypeMap[(b.entityType === null || b.entityType === undefined ? "" : b.entityType)];
        });

        let promise = Promise.resolve([]);
        const promises = [];
        const retVal: Subject<SzBulkLoadResult> =  new Subject<SzBulkLoadResult>();
        // create new datasources if needed
        if (newDataSources.length > 0) {
            //console.log('create new datasources: ', newDataSources);
            const pTemp = this.createDataSources(newDataSources).toPromise();
            promises.push( pTemp );
        }
        // create new entity types if needed
        if (newEntityTypes.length > 0) {
            //console.log('create new entity types: ', newEntityTypes);
            const pTemp = this.createEntityTypes(newEntityTypes).toPromise();
            promises.push( pTemp );
        }
        promise = Promise.all( promises );

        // no new datasources or already avail
        this.loadingFile.next(true);
        promise.then(() => {
            //this.bulkDataService.loadBulkRecords(file, dataSource?: string, mapDataSources?: string, mapDataSource?: Array<string>, entityType?: string, mapEntityTypes?: string, mapEntityType?: Array<string>, progressPeriod?: string, observe?: 'body', reportProgress?: boolean)
            //this.bulkDataService.loadBulkRecords(file, dataSource, mapDataSources, mapDataSource, entityType?: string, mapEntityTypes, mapEntityType, progressPeriod, observe, reportProgress)
            this.bulkDataService.loadBulkRecords  (file, undefined,  JSON.stringify(dataSourceMap),  undefined,     undefined,           JSON.stringify(entityTypeMap)).pipe(
            //this.bulkDataService.loadBulkRecords(file, dataSourceMap, entityTypeMap ).pipe(
            catchError((err: Error) => {
                console.warn('Handling error locally and rethrowing it...', err);
                this.loadingFile.next(false);
                this._onError.next( err );
                return of(undefined);
            }),
            tap((response: SzBulkLoadResponse) => {
                //console.log('RESPONSE', dataSourceMap, response.data);
                this.currentLoadResult = response.data;
                this.onLoadResult.next( this.currentLoadResult );
                this.loadingFile.next(false);
                //retVal.next(response.data);
            }),
            map((response: SzBulkLoadResponse) => {
                return response.data;
            })
            ).pipe(
            takeUntil( this.unsubscribe$ )
            ).subscribe( (data: SzBulkDataAnalysis) => {
            console.log('SzBulkDataService.load', this.currentLoadResult, data);
            retVal.next(data);
            });
        });
        return retVal.asObservable();
        } else {
        console.warn('missing required parameter: ', file, dataSourceMap);
        throw new Error('missing required parameter: '+ file.name);
        return;
        }
    }
    /**
     * Used to keep a internal map of source to target datasource names.
     * @internal
     */
    public getDataSourceMapFromAnalysis(analysisArray: SzDataSourceRecordAnalysis[]): { [key: string]: string } {
        const _dsMap: { [key: string]: string } = {};
        if(analysisArray && analysisArray.forEach) {
        analysisArray.forEach(a => {
            if (this._dataSources.indexOf(a.dataSource) >= 0) {
            _dsMap[a.dataSource] = a.dataSource;
            } else if(a.dataSource !== null) {
            // this will automatically get mapped to specified datasource
            _dsMap[a.dataSource] = a.dataSource;
            }
        });
        }
        return _dsMap;
    }
    /**
     * Used to keep a internal map of source type to target entity type names.
     * @internal
     */
    public getEntityTypeMapFromAnalysis(analysisArray: SzEntityTypeRecordAnalysis[]): { [key: string]: string } {
        const _etMap: { [key: string]: string } = {};

        if(analysisArray && analysisArray.forEach) {
        analysisArray.forEach(a => {
            if (this._entityTypes.indexOf(a.entityType) >= 0) {
            _etMap[a.entityType] = a.entityType;
            } else if(a.entityType !== null) {
            _etMap[a.entityType] = a.entityType;
            } else if(a.entityType === null) {
            _etMap[""] = 'GENERIC';
            //_etMap[a.entityType] = 'GENERIC';
            }
        });
        }
        return _etMap;
    }
    /**
     * change the destination datasource of a file currently being mapped to datasource.
     */
    public changeDataSourceName(fromDataSource: string, toDataSource: string) {
        fromDataSource = (fromDataSource === null || fromDataSource === undefined) ? "" : fromDataSource;
        this.dataSourceMap = this.dataSourceMap;
        this.dataSourceMap[fromDataSource] = toDataSource;
        //console.log('DS MAP ' + fromDataSource + ' TO ' + toDataSource, this.dataSourceMap);
    }
    /**
     * change the destination entity type of a file currently being mapped to a entity type.
     */
    public changeEntityTypeName(fromEntityType: string, toEntityType: string) {
        fromEntityType = (fromEntityType === null || fromEntityType === undefined) ? "" : fromEntityType;
        console.log('ET MAP ' + fromEntityType + ' TO ' + toEntityType, this.entityTypeMap);
        this.entityTypeMap = this.entityTypeMap;
        this.entityTypeMap[fromEntityType] = toEntityType;
    }
    /** clear any file and associated data. removes file focus context */
    public clear(): void {
        this.currentAnalysis = undefined;
        this.currentLoadResult = undefined;
        this.currentFile = undefined;
        this.onAnalysisChange.next( this.currentAnalysis );
        this.onLoadResult.next( this.currentLoadResult );
        this.onCurrentFileChange.next( this.currentFile );
    }
    /**
     * unsubscribe event streams
     */
    destroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    // -------------------------------------- streaming handling --------------------------------------

    public reconnectStream() {
        if(!this.webSocketService.connected) {
            // do additional check to see if it's attempting to establish connection but has 
            // not successfully done so yet
            this.webSocketService.reconnect();
        } else {
            // were already connected, ignore
        }
    }
    public disconnectStream() {
        if(this.webSocketService.connected) {
            this.webSocketService.disconnect();
        } else {
            // were already disconnected, ignore
        }
    }
    
    /** analze a file and prep for mapping */
    public streamAnalyze(file: File): Observable<AdminStreamAnalysisSummary> {
        console.log('SzBulkDataService.streamAnalyze: ', file);
        this.currentError = undefined;

        // file related
        file = file ? file : this.currentFile;
        let fileSize = file && file.size ? file.size : 0;
        let fileType = getFileTypeFromName(file);
        let fileName = (file && file.name) ? file.name : undefined;
        // stream related
        let fsStream = file.stream();
        var reader = fsStream.getReader();
        this.streamConnectionProperties.reconnectOnClose = true;
        if(!this.webSocketService.connected){
            // we need to reopen connection
            console.log('SzBulkDataService.streamAnalyze: websocket needs to be opened: ', this.webSocketService.connected, this.streamConnectionProperties);
            this.webSocketService.reconnect();
        } else {
            console.log('SzBulkDataService.streamAnalyze: websocket thinks its still connected: ', this.webSocketService.connected, this.streamConnectionProperties);
        }

        // construct summary object that we can report 
        // statistics to
        let summary: AdminStreamAnalysisSummary = {
            fileType: fileType,
            mediaType: fileType,
            fileName: fileName,
            fileSize: fileSize,
            fileLineEndingStyle: lineEndingStyle.unknown,
            characterEncoding: 'utf-8',
            recordCount: 0,
            sentRecordCount: 0,
            unsentRecordCount: 0,
            failedRecordCount: 0,
            missingDataSourceCount: 0,
            missingEntityTypeCount: 0,
            bytesRead: 0,
            bytesSent: 0,
            bytesQueued: 0,
            fileColumns: [],
            dataSources: [],
            complete: false
        }

        this.analyzingFile.next(this.isStreamAnalyzing(summary));
        if(fileType === validImportFileTypes.JSONL || fileType === validImportFileTypes.JSON) {
            let finishedAnalysis = new Subject<void>();
            this.webSocketService.onError.pipe(
                takeUntil(this.unsubscribe$),
                takeUntil(finishedAnalysis),
                take(1)
            ).subscribe((error) => {
                // error occured before load was finished
                // take first error and report
                // stop spinner activity
                // ----- there are probably better ways(fancy rxjs-y ways) A.W.
                this.analyzingFile.next(false);
            })
            let retStreamSummary = this.streamAnalyzeJSONFileToWebsocketServer(file, reader, summary);
            retStreamSummary.pipe(
                catchError((err: Error) => {
                    console.warn('Handling error locally and rethrowing it...', err);
                    this.loadingFile.next(false);
                    this._onError.next( err );
                    finishedAnalysis.next();
                    return of(undefined);
                }),
                filter(this.isStreamAnalysisComplete.bind(this)),
                takeUntil(finishedAnalysis),
                take(1)
            ).subscribe((summary: AdminStreamAnalysisSummary) => {
                this.currentAnalysisResult = summary;
                this.onAnalysisResult.next( this.currentAnalysisResult );
                this.analyzingFile.next(this.isStreamAnalyzing(summary));
                finishedAnalysis.next();                
            }, (err: Error) => {
                this.loadingFile.next(false);
                this._onError.next( err );
                finishedAnalysis.next();
            });
            return retStreamSummary;
        } else if(fileType === validImportFileTypes.CSV) {
            this._onError.next(new Error('CSVs are not supported by stream loading at this point in time.'));
            return this.streamAnalyzeCSVFileToWebsocketServer(file, reader, summary);
        } else {
            console.warn('SzBulkDataService.streamLoad: noooooooo', fileType, fileType === validImportFileTypes.CSV);
        }
    }

    parseRecordsFromFile(file: File, onComplete?: StreamReaderComplete): Observable<any[]> {
        let _readRecords    = [];
        let retSubject      = new Subject<any[]>();
        let retObs          = retSubject.asObservable();
        let streamReader = new SzStreamingFileRecordParser(file);

        streamReader.onStreamChunkParsed.subscribe((records: any[]) => {
            _readRecords.push(records);
            retSubject.next(records);
        });
        if(onComplete){
            console.warn('SzBulkDataService.parseRecordsFromFile: onComplete handler passed to fn');
            streamReader.onStreamClosed.subscribe(onComplete);
        }
        streamReader.onStreamClosed.subscribe((state) => {
            console.warn('SzBulkDataService.parseRecordsFromFile: stream closed.', state);
        });
        streamReader.read();
        return retObs;
    }

    getDataSourcesFromRecords(records: any[] | undefined): any[] | undefined {
        let retVal = undefined;
        if(records && (records as any[]).length > 0) {
            let recordsArray            = (records as any[]);
            let dataSourcesInRecords    = recordsArray.filter((record) => {
                return record && record.DATA_SOURCE && record.DATA_SOURCE !== undefined;
            }).map((record) => {
                return record && record.DATA_SOURCE ? record.DATA_SOURCE : undefined;
            }).filter( (dataSource, index, self) => {
                return self.indexOf(dataSource) === index;
            });
            if(dataSourcesInRecords && dataSourcesInRecords.length > 0) {
                retVal  = dataSourcesInRecords;
            }
        }
        return retVal;
    }

    /** perform streaming import of records over websocket interface 
     * takes a file as argument, stream reads file, parses records,
     * then batch chunks to websocket connection. 
     * @returns Observeable<AdminStreamLoadSummary>
    */
    streamLoad(file?: File, dataSourceMap?: { [key: string]: string }, entityTypeMap?: { [key: string]: string }, analysis?: SzBulkDataAnalysis): Observable<AdminStreamLoadSummary> {
        console.log('SzBulkDataService.streamLoad: ', file, this.streamConnectionProperties);
        // event streams
        let retSubject  = new Subject<AdminStreamLoadSummary>();
        let retObs      = retSubject.asObservable();

        // file related
        file = file ? file : this.currentFile;
        let fileSize = file && file.size ? file.size : 0;
        let fileType = getFileTypeFromName(file);
        let fileName = (file && file.name) ? file.name : undefined;
        // how many records to send per 200 milliseconds
        // config value is per 1000ms, but .2s are better for UI draw
        let bulkRecordSendRate          = this.streamLoadConfig.uploadRate ? Math.floor(this.streamLoadConfig.uploadRate / 5) : -1;
        // record queues
        let readRecords                 = [];
        let readStreamComplete          = false;
        // socket related
        if(!this.webSocketService.connected){
            // we need to reopen connection
            console.log('SzBulkDataService.streamLoad: websocket needs to be opened: ', this.webSocketService.connected, this.streamConnectionProperties);
            this.webSocketService.reconnect();
        } else {
            console.log('SzBulkDataService.streamLoad: websocket thinks its still connected: ', this.webSocketService.connected, this.streamConnectionProperties);
        }

        // construct summary object that we can report 
        // statistics to
        let summary: AdminStreamLoadSummary = {
            fileType: fileType,
            mediaType: fileType,
            fileName: fileName,
            fileSize: fileSize,
            fileLineEndingStyle: lineEndingStyle.unknown,
            characterEncoding: 'utf-8',
            recordCount: 0,
            sentRecordCount: 0,
            unsentRecordCount: 0,
            failedRecordCount: 0,
            missingDataSourceCount: 0,
            missingEntityTypeCount: 0,
            bytesRead: 0,
            bytesSent: 0,
            bytesQueued: 0,
            fileColumns: [],
            dataSources: [],
            complete: false
        }
        // initialize behavior subjects with base info
        this._onStreamLoadStarted.next(summary); // singleton
        this._onStreamReadStarted.next(summary); // singleton
        retSubject.next(summary); // local

        // read file contents as stream
        // parse to array of records
        this.parseRecordsFromFile(file, (streamStatus) => {
            // on stream complete, do thing
            console.warn('SzBulkDataService.streamLoad: file stream read complete.');
            readStreamComplete = true;
            this._onStreamLoadProgress.next(summary);
            this._onStreamReadComplete.next(summary);
            retSubject.next(summary); // local
        }).subscribe(
            (records) => {
                // do count inc before we add to summary otherwise well double
                summary.recordCount         = summary.recordCount + records.length;
                // now concat
                readRecords                 = readRecords.concat(records);
                summary.unsentRecordCount   = readRecords.length;
                //console.log(`SzBulkDataService.streamLoad: read ${summary.recordCount} records`);
                this._onStreamLoadProgress.next(summary);
                this._onStreamReadProgress.next(summary);
                retSubject.next(summary); // local
            }
        );

        let sendQueuedRecords = (records?: any) => {
            if(readRecords && readRecords.length > 0) {
                //console.log('check for batching records..', readRecords.length, summary.sentRecordCount);

                // slice off a batch of records to send
                let currQueuePush   = readRecords && readRecords.length < bulkRecordSendRate ? readRecords : readRecords.slice(0, bulkRecordSendRate);
                readRecords         = readRecords.slice(currQueuePush.length);

                // push them in to websocket (as quick as we read them - so cool)
                this.webSocketService.sendMessages(currQueuePush);

                // update metadata
                summary.sentRecordCount     = summary.sentRecordCount + currQueuePush.length;
                summary.unsentRecordCount   = readRecords.length;

                // check if everything has been sent
                if(readStreamComplete && summary.sentRecordCount === summary.recordCount && summary.recordCount > 0) {
                    // all messages sent
                    //console.warn('stream load complete 1', summary);
                    summary.complete = true;
                    this._onStreamLoadComplete.next(summary);
                } else {
                    retSubject.next(summary); // local
                    this._onStreamLoadProgress.next(summary);
                }
            } else if(readRecords && readRecords.length <= 0) {
                // according to this we sent all the records, what went wrong
                // console.log('batch should be over. why is it still going?', readStreamComplete, summary.complete);
            }
        }
        let waitUntilDataSourcesAreValid = (): boolean => {
            let retVal = this._onAutoCreatingDataSource ? false : true;
            if(summary && summary.dataSources && summary.dataSources.length > 0) {
                // check that datasource exists in datasources list
                retVal = false;
                if(this._dataSources && this._dataSources.length > 0) {
                    retVal = summary.dataSources.every( (dataSource) => {
                        return this._dataSources.indexOf(dataSource) > -1;
                    });
                }
            }
            if(!this._onAutoCreatingDataSource && !retVal) {
                // mimic request for now..
                let missingDataSources  = summary.dataSources.filter( (dataSource) => {
                    return this._dataSources.indexOf(dataSource) < 0;
                });
                this._onAutoCreatingDataSources.next( missingDataSources );
                setTimeout(() => {
                    this._dataSources = this._dataSources.concat(summary.dataSources).filter((dataSource, index, self) => {
                        return self.indexOf(dataSource) === index;
                    });
                    this._onAutoCreatingDataSources.next( undefined );
                },5000);
            }
            return retVal;
        }

        let checkQueuedRecordsForDataSouces = (records?: any) => {
            if(readRecords && readRecords.length > 0) {
                // update metadata
                let _nextQueuedRecordSet = readRecords && readRecords.length < bulkRecordSendRate ? readRecords : readRecords.slice(0, bulkRecordSendRate);
                let _dsInRecords         = this.getDataSourcesFromRecords(_nextQueuedRecordSet);
                if(_dsInRecords && _dsInRecords.length > 0) {
                    summary.dataSources      = summary.dataSources.concat(_dsInRecords).filter((dataSource, index, self) => {
                        return self.indexOf(dataSource) === index;
                    });
                }
            } else {
                // no 
            }
        }

        // ------------ monitor status of queue, batch send records to socket ------------
        if(bulkRecordSendRate > 0) {
            // set up an interval that expires once all records read have been sent
            let streamSendMon = timer(100, 200);
            streamSendMon.pipe(
                map(() => {
                    return summary;
                }),
                takeWhile( (summary: AdminStreamLoadSummary) => {
                    return (summary && !summary.complete) ? true : false;
                }),
                filter((summary: AdminStreamLoadSummary) => {
                    return summary && summary.recordCount > 0;
                }),
                tap( checkQueuedRecordsForDataSouces ),
                filter( waitUntilDataSourcesAreValid ) 
            ).subscribe( sendQueuedRecords );
        } else {
            // unlimited send rate... probably a terrible idea but lets give it a try
            // immediately send all records as fast as they can be read
            // good for debugging, bad for prod
            this._onStreamReadProgress.pipe(
                takeWhile( (summary: AdminStreamLoadSummary) => {
                    return (summary && !summary.complete) ? true : false;
                })
            ).subscribe( sendQueuedRecords );
        }
        
        // when ANYTHING changes, update the singleton "currentLoadResult" var so components can read status
        retObs.subscribe((summary: AdminStreamLoadSummary) => {
            this.currentLoadResult = summary;
        });

        // ---------------------------- on complete evt handlers ----------------------------
        // on end of read double-check if whole thing is complete
        this._onStreamReadComplete.pipe(
            filter((summary: AdminStreamLoadSummary) => { return summary !== undefined;}),
            take(1),
            delay(5000)
        ).subscribe((summary: AdminStreamLoadSummary) => {
            /*
            if(readStreamComplete && summary && summary.sentRecordCount === summary.recordCount) {
                // set this to true to end batching loop Observeable
                summary.complete = true;
                this._onStreamLoadComplete.next(summary);
            }*/
            console.log('_onStreamReadComplete: ',readStreamComplete, summary);
        });
        // on end of records queue double-check if whole thing is complete
        this._onStreamLoadComplete.pipe(
            filter((summary: AdminStreamLoadSummary) => { return summary !== undefined;}),
            take(1),
            /*takeWhile( (summary: AdminStreamLoadSummary) => {
                return (summary && !summary.complete) ? true : false;
            }),
            delay(5000)*/
        ).subscribe((summary: AdminStreamLoadSummary) => {
            if(readStreamComplete && summary && summary.sentRecordCount === summary.recordCount) {
                // set this to true to end batching loop Observeable
                //console.warn('stream load complete 2', summary);
                summary.complete = true;
                //this._onStreamLoadComplete.next(summary);
            } else {
                console.warn('stream load complete 2', readStreamComplete, summary);
            }
        });
        return retObs;
    }

    streamAnalyzeCSVFileToWebsocketServer(fileHandle: File, fileReadStream: ReadableStreamDefaultReader<any>, summary: AdminStreamAnalysisSummary): Observable<AdminStreamAnalysisSummary> {
        // set up return observeable
        let retSubject  = new Subject<AdminStreamAnalysisSummary>();
        let retObs      = retSubject.asObservable();
        // text decoding
        let decoder = new TextDecoder(summary.characterEncoding);
        let encoder = new TextEncoder();
        let recordCount = 0;
        // current chunk to be sent
        let payloadChunk = '';
        let payloadChunks = [];
        let wsRecordsQueue = [];
        let resultChunks = undefined;
        //let fileLineEndingStyle = lineEndingStyle.default;
        let lineEndingLength = 1;
        let isValidJSONL = false;

        return retObs;
    }

    streamAnalyzeJSONFileToWebsocketServer(fileHandle: File, fileReadStream: ReadableStreamDefaultReader<any>, summary: AdminStreamAnalysisSummary): Observable<AdminStreamAnalysisSummary> {
        console.log('SzBulkDataService.streamAnalyzeJSONFileToWebsocketServer: ', fileHandle, fileReadStream, summary);

        // set up return observeable
        let retSubject  = new Subject<AdminStreamAnalysisSummary>();
        let retObs      = retSubject.asObservable();
        // text decoding
        let decoder = new TextDecoder(summary.characterEncoding);
        let encoder = new TextEncoder();
        let recordCount = 0;
        // current chunk to be sent
        let payloadChunk = '';
        let payloadChunks = [];
        let wsRecordsQueue = [];
        let resultChunks = undefined;
        //let fileLineEndingStyle = lineEndingStyle.default;
        let lineEndingLength = 1;
        let isValidJSONL = false;

        // check the retSubject for completion status
        retObs.subscribe((summary: AdminStreamAnalysisSummary) => {
            let isComplete = this.isStreamLoadComplete(summary);
            //console.log('checking if stream load is done: '+ isComplete +' | '+ summary.complete);
            return summary;
        });

        // read file
        fileReadStream.read()
        .then(function processChunk({ done, value}) {
          if (done) {
            console.log('-- END OF STREAM --');
            fileReadStream.releaseLock();
            return;
          } else {
            let decodedValue  = decoder.decode(value, {stream: true});
            let firstChunk    = (summary.bytesRead < 1) ? true : false;
            // get default line ending style for processing
            if(firstChunk){
              console.log('-- BEGINNING OF STREAM --');
              summary.fileLineEndingStyle = determineLineEndingStyle(decodedValue);
              lineEndingLength = (summary.fileLineEndingStyle === lineEndingStyle.Windows ? 2 : 1);
    
              console.log('file line ending style: ', lineEndingStyleAsEnumKey(summary.fileLineEndingStyle));
              console.log('file type: ', summary.fileType);
            } else {
              //console.log('no column header in chunk: ', payloadChunks);
            }
    
            // wheres the last line ending in stream chunk
            let lastRecordPos = decodedValue.lastIndexOf(summary.fileLineEndingStyle);    // last position of line ending in stream chunk
            let chunk = decodedValue.substring(0, lastRecordPos);                 // part of stream read minus any incomplete record
            // add any previous incompletes to payload
            payloadChunk += chunk;
            payloadChunk = payloadChunk.trim();
            if(value && value.length) {
              summary.bytesRead = summary.bytesRead+value.length;
              retSubject.next(summary);
            }
            let lineEndingRegEx = (summary.fileLineEndingStyle === lineEndingStyle.Windows) ? new RegExp(/\r\n/g) : new RegExp(/\n/g);
              
            if(firstChunk) {
            // test for validity
                isValidJSONL = (firstChunk && payloadChunk.indexOf('[') > -1) ? false : ((firstChunk && payloadChunk.indexOf('[') >= -1 && payloadChunk.indexOf('{') > -1) ? true : false);
                console.log('testing for valid jsonl: ', isValidJSONL, summary.fileType, payloadChunk.indexOf('['), payloadChunk.indexOf('{'));
            }
            if(!isValidJSONL) {
                // must be json
                // if not jsonl strip "[" out at the beginning, and "]" at the end
                if(firstChunk) {
                    payloadChunk = payloadChunk.trim();
                    payloadChunk = payloadChunk.substring(payloadChunk.indexOf('[')+1);
                    console.log('cutting "[" out from line 1', payloadChunk);
                }
            } else if(firstChunk){
                console.log('isValidJSONL: '+ isValidJSONL, );
            }

            payloadChunks.push(payloadChunk);
            // split chunk by line endings for per-record streaming
            let chunkLines = payloadChunk.split(summary.fileLineEndingStyle);
            wsRecordsQueue.push(chunkLines);
            
            chunkLines.forEach((_record) => {
                summary.bytesQueued += getUtf8ByteLength(_record);
                retSubject.next(summary);
                this.sendWebSocketMessage(_record).subscribe((messageSent) => {
                    summary.bytesSent = summary.bytesSent + getUtf8ByteLength(_record);
                    summary.sentRecordCount += 1;
                    retSubject.next(summary);
                }, (error: Error) => {
                    console.warn('sendWebSocketMessage error: ', error);
                });
            });

            // get number of records in chunk
            let numberOfRecordsInChunk = (payloadChunk.match( lineEndingRegEx ) || '').length + 1;
            summary.recordCount = summary.recordCount + numberOfRecordsInChunk;
            retSubject.next(summary);
            payloadChunk = '';
            // add incomplete remainder record to next chunk
            if(lastRecordPos < decodedValue.length) {
                payloadChunk = decodedValue.substring(lastRecordPos).trim();
            }
            
          }
          if(summary.recordCount < this.streamAnalysisConfig.sampleSize) {
            console.log(`read (${summary.recordCount} / ${this.streamAnalysisConfig.sampleSize})`);
            return fileReadStream.read().then(processChunk.bind(this));
          } else {
            console.warn(`!!!! HIT SAMPLE LIMIT (${summary.recordCount} / ${this.streamAnalysisConfig.sampleSize}) !!!!`);
            fileReadStream.cancel('sample limit reached');
          }
        }.bind(this))
        .catch((err) => {
          console.warn('error: ', err);
        })
        .finally(() => {
          // sometimes there is a last "hanging chunk"
          console.log('checking for hanging chunk.. ', payloadChunk);
          if(payloadChunk && payloadChunk.length > 0) {
            if(summary.fileType === validImportFileTypes.JSONL || summary.fileType === validImportFileTypes.JSON) {
              let payloadChunkHasEndBracket = payloadChunk.lastIndexOf(']') > payloadChunk.indexOf('}');
              if(payloadChunkHasEndBracket) {
                // was "json" not "jsonl", correct it
                payloadChunk = payloadChunk.replace(']','').trim();
                if(payloadChunk.indexOf('{') > -1 && payloadChunk.indexOf('}') > -1) {
                  let plChunkSplit = payloadChunk.split('}');
                  console.log("what's going on here? ", plChunkSplit);
                  summary.recordCount = summary.recordCount + plChunkSplit.length;
                  retSubject.next(summary);
                }
                payloadChunks.push(payloadChunk);
                // split chunk by line endings for per-record streaming
                let chunkLines = payloadChunk.split(summary.fileLineEndingStyle);
                wsRecordsQueue.push(chunkLines);
                
                chunkLines.forEach((_record) => {
                    summary.bytesQueued += getUtf8ByteLength(_record);
                    retSubject.next(summary);
                    this.sendWebSocketMessage(_record).pipe(take(1)).subscribe((messageSent) => {
                        summary.bytesSent = summary.bytesSent + getUtf8ByteLength(_record);
                        summary.sentRecordCount += 1;
                        retSubject.next(summary);
                    }, (error: Error) => {
                        console.warn('sendWebSocketMessage error: ', error);
                    });
                });
                //this.sendWebSocketMessage(payloadChunk);
              } else {
                console.log('no reason to strip out ', payloadChunk);
                if(payloadChunk.indexOf('{') > -1 && payloadChunk.indexOf('}') > -1) {
                  payloadChunk = payloadChunk.trim();
                  let plChunkSplit = payloadChunk.split('}').filter( (value) => {
                    return (value && value.trim() !== '') ? true : false;
                  });
                  console.log("what's going on here? ", plChunkSplit);
                  summary.recordCount = summary.recordCount + plChunkSplit.length;
                  retSubject.next(summary);
                }
              }
            }
          }
        })
        .finally( () => {
            console.log('file summary: ', summary);
            resultChunks = payloadChunks;
            retSubject.next(summary);
        });
        // return observeable of stream summary info
        return retObs;
    }

    streamLoadCSVFileToWebsocketServer(fileHandle: File, fileReadStream: ReadableStreamDefaultReader<any>, summary: AdminStreamLoadSummary): Observable<AdminStreamLoadSummary> {
        // set up return observeable
        let retSubject  = new Subject<AdminStreamLoadSummary>();
        let retObs      = retSubject.asObservable();
        // text decoding
        let decoder = new TextDecoder(summary.characterEncoding);
        let encoder = new TextEncoder();
        let recordCount = 0;
        // current chunk to be sent
        let payloadChunk = '';
        let payloadChunks = [];
        let wsRecordsQueue = [];
        let resultChunks = undefined;
        //let fileLineEndingStyle = lineEndingStyle.default;
        let lineEndingLength = 1;
        let isValidJSONL = false;

        return retObs;
    }

    /** check whether or not the stream has read input bytes but has not yet sent all records */
    private isStreamLoading(summary: AdminStreamLoadSummary): boolean {
        return summary.fileSize > 0 && !this.isStreamLoadComplete(summary);
    }
    private isStreamAnalyzing(summary: AdminStreamAnalysisSummary): boolean {
        return summary.fileSize > 0 && !this.isStreamAnalysisComplete(summary);
    }
    
    /** check whether or not the stream summary.complete property should return "true" */
    private isStreamLoadComplete(summary: AdminStreamLoadSummary): boolean {
        summary.complete = (
            (summary.sentRecordCount == summary.recordCount && summary.recordCount > 0) && 
            summary.bytesRead === summary.fileSize && 
            summary.bytesSent >= summary.bytesQueued
        );
        //console.log('isStreamLoadComplete ? '+ summary.complete, (summary.sentRecords == summary.totalRecords && summary.bytesRead === summary.fileSize && summary.bytesSent >= summary.bytesQueued), summary.bytesSent >= summary.bytesQueued );
        return summary.complete;
    }
    /** check whether or not the stream summary.complete property should return "true" */
    private isStreamAnalysisComplete(summary: AdminStreamAnalysisSummary): boolean {
        summary.complete = ((
            (summary.sentRecordCount == summary.recordCount && summary.recordCount > 0) && 
            (summary.bytesRead === summary.fileSize && 
            summary.bytesSent >= summary.bytesQueued)) || 
            (summary.sentRecordCount >= this.streamAnalysisConfig.sampleSize && this.streamAnalysisConfig.sampleSize >= 0)
        );
        //console.log('isStreamLoadComplete ? '+ summary.complete, (summary.sentRecords == summary.totalRecords && summary.bytesRead === summary.fileSize && summary.bytesSent >= summary.bytesQueued), summary.bytesSent >= summary.bytesQueued );
        return summary.complete;
    }
    /** alias to webSocketService.sendMessage */
    public sendWebSocketMessage(message: string): Observable<boolean> {
        return this.webSocketService.sendMessage(message);
    }
}
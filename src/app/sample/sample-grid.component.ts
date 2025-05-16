import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { SzWebAppConfigService } from '../services/config.service';
import { AboutInfoService } from '../services/about.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UiService } from '../services/ui.service';
import { SzCrossSourceStatistics, SzCrossSourceSummaryCategoryType, SzCrossSourceSummaryCategoryTypeToMatchLevel, SzDataMartService } from '@senzing/sdk-components-ng';
import { Subject, take, takeUntil } from 'rxjs';
import { Title } from '@angular/platform-browser';
/**
 * a component to display the a sampleset of datasource
 *
 * @export
 * @class SampleGridComponent
 */
@Component({
    selector: 'app-sample-grid',
    templateUrl: './sample-grid.component.html',
    styleUrls: ['./sample-grid.component.scss'],
    standalone: false
})
export class SampleGridComponent implements OnInit, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    
    private _statType: SzCrossSourceSummaryCategoryType;
    private _matchLevel: number;

    public get datasource1(): string {
        return this.dataMart.dataSource1;
    }
    public get datasource2(): string {
        return this.dataMart.dataSource2;
    }
    public get statType(): SzCrossSourceSummaryCategoryType {
        return this._statType;
    }
    public get matchLevel(): number {
        return this._matchLevel;
    }
    
    @ViewChild('cssTableRef') cssTableRef: SzCrossSourceStatistics;

    constructor(
        private router: Router, 
        private route: ActivatedRoute,
        public uiService: UiService,
        public dataMart: SzDataMartService,
        private titleService: Title
    ) {}
    ngOnInit() {
        
        this.dataMart.onSampleRequest.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe({
            next: this.onSampleLoading.bind(this),
            error: () => {
                this.uiService.spinnerActive = false;
            }
        });

        let _ds1        = this.route.snapshot.paramMap.get('datasource1');
        let _ds2        = this.route.snapshot.paramMap.get('datasource2');
        let _statType   = this.route.snapshot.data && this.route.snapshot.data.statType ? (this.route.snapshot.data.statType as SzCrossSourceSummaryCategoryType) : SzCrossSourceSummaryCategoryType.MATCHES;
        console.log('ROUTE DATA: ', this.route.snapshot.data);
        if((_ds1 && _ds1 !== undefined) || (_ds2 && _ds2 !== undefined)) {
            if(_ds1 && _ds1 !== undefined) {
                this.dataMart.dataSource1 = _ds1;
            }
            if(_ds2 && _ds2 !== undefined) {
                this.dataMart.dataSource2 = _ds2;
            }
            if(_statType && SzCrossSourceSummaryCategoryTypeToMatchLevel[_statType]) {
                // valid stat type
                this._statType      = _statType;
                this._matchLevel    = SzCrossSourceSummaryCategoryTypeToMatchLevel[this._statType];
                this.dataMart.sampleStatType    = this._statType;
                this.dataMart.sampleMatchLevel  = this._matchLevel;
            } else {
                // just choose matches by default
                this._statType      = SzCrossSourceSummaryCategoryType.MATCHES;
                this._matchLevel    = SzCrossSourceSummaryCategoryTypeToMatchLevel[SzCrossSourceSummaryCategoryType.MATCHES];
            }
            
            // get new sample set
            this.dataMart.createNewSampleSetFromParameters(
                this._statType, 
                this.dataMart.dataSource1,
                this.dataMart.dataSource2
            ).pipe(
                takeUntil(this.unsubscribe$),
                take(1)
            ).subscribe((resp) => {
                if(this.cssTableRef){
                    this.cssTableRef.updateTitle(this.dataMart.sampleDataSource1, this.dataMart.sampleDataSource2, this.dataMart.sampleStatType );
                    this.titleService.setTitle( this.cssTableRef.title );
                }
            });
        }
    }
    ngAfterViewInit() {
        // update title
        this.cssTableRef.onNewSampleSetRequested.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((evt) => {
            // update page title
            if(this.cssTableRef){
                this.titleService.setTitle( this.cssTableRef.title );
            }
        });
    }
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /** since data can be any format we have to use loose typing */
    onCellClick(data: any) {
        console.log(`onCellClick`, data);
        if(!data.value){ return; }
        if(data.key === 'entityId' || data.key === 'relatedEntityId') {
            this.router.navigate(['entity/', data.value]);
            /*this.dialog.open(SzAlertMessageDialog, {
                panelClass: 'alert-dialog-panel',
                width: '350px',
                height: '200px',
                data: {
                title: `Opening Entity #${data.value} Detail`,
                text: 'This would normally be a redirect to the entity detail page.',
                showOkButton: false,
                buttonText: 'Close'
                }
            });
            */
        }
    }

    onSampleLoading(isLoading) {
        console.log(`onSampleLoading`, isLoading);
        this.uiService.spinnerActive = isLoading;
    }
}
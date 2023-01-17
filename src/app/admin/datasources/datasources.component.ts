import { Component, OnInit, ViewChild, Inject, AfterViewInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzDataSourcesResponseData, SzDataSourcesResponse, SzDataSource } from '@senzing/sdk-components-ng';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

export interface DialogData {
  name: string;
}

@Component({
  selector: 'admin-datasources',
  templateUrl: './datasources.component.html',
  styleUrls: ['./datasources.component.scss']
})
export class AdminDataSourcesComponent implements OnInit {
  displayedColumns: string[] = ['dataSourceId', 'dataSourceCode'];
  public datasource:  MatTableDataSource<SzDataSource> = new MatTableDataSource<SzDataSource>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  private _datasourcesData: {
    [id: string]: SzDataSource;
  };
  private set dataSourcesData(value: {
    [id: string]: SzDataSource;
  }) {
    this._datasourcesData = value;

    if(this._datasourcesData) {
      this.datasource.data = Object.values( this._datasourcesData );
    }
  }

  private _loading: boolean = false;
  private _dialogOpen: boolean = false;

  public get loading(): boolean {
    return this._loading;
  }

  constructor(
    private adminBulkDataService: AdminBulkDataService,
    private datasourcesServices: SzDataSourcesService,
    private titleService: Title,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.datasource.paginator = this.paginator;
    // set page title
    this.titleService.setTitle( 'Admin Area - Data Sources' );
    this._loading = true;
    this.adminBulkDataService.onDataSourcesChange.subscribe(this.updateDataSourcesList.bind(this));
  }

  public updateDataSourcesList() {
    this._loading = true;
    this.datasourcesServices.listDataSourcesDetails().subscribe( (data: SzDataSourcesResponseData) => {
      this.dataSourcesData = data.dataSourceDetails;
      this._loading = false;
    } );
  }

  public openNewDataSourceDialog() {
    if(!this._dialogOpen) {
      const dialogRef = this.dialog.open(NewDataSourceDialogComponent, {
        width: '400px',
        data: { name: '' }
      });

      dialogRef.afterClosed().subscribe(dsName => {
        if(dsName && dsName.length > 0) {
          this.datasourcesServices.addDataSources([ dsName ]).subscribe(
            (result) => {
              console.log('created new datasource', result);
              this.updateDataSourcesList();
            }
          );
        }
        this._dialogOpen = false;
      });
    }
  }

}

@Component({
  selector: 'admin-add-datasource-dialog',
  templateUrl: 'add-datasource.component.html',
  styleUrls: ['./add-datasource.component.scss']
})
export class NewDataSourceDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewDataSourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  public isEmpty(value: any): boolean {
    return (value && value.trim() === '');
  }

}

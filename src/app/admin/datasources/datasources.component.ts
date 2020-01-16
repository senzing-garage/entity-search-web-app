import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzDataSourcesResponseData, SzDataSourcesResponse, SzDataSource } from '@senzing/sdk-components-ng';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTableDataSource, MatPaginator } from '@angular/material';

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
  public get loading(): boolean {
    return this._loading;
  }

  constructor(
    private datasourcesServices: SzDataSourcesService,
    private titleService: Title
  ) { }

  ngOnInit() {
    this.datasource.paginator = this.paginator;
    // set page title
    this.titleService.setTitle( 'Admin Area - Data Sources' );
    this._loading = true;
    this.datasourcesServices.listDataSourcesDetails().subscribe( this.onDataResponse.bind(this) );
  }

  private onDataResponse(data: SzDataSourcesResponseData) {
    this.dataSourcesData = data.dataSourceDetails;
    this._loading = false;
    console.warn('admin datasources: ', data, this._loading, this);
    this._loading = false;
  }

}

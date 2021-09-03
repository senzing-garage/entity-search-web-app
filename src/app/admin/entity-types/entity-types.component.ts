import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { 
  SzEntityTypesService, SzEntityType,
} from '@senzing/sdk-components-ng';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

export interface DialogData {
  name: string;
}

@Component({
  selector: 'admin-entity-types',
  templateUrl: './entity-types.component.html',
  styleUrls: ['./entity-types.component.scss']
})
export class AdminEntityTypesComponent implements OnInit {
  displayedColumns: string[] = ['entityTypeId', 'entityTypeCode', 'entityClassCode'];
  public datasource:  MatTableDataSource<SzEntityType> = new MatTableDataSource<SzEntityType>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  private _entityTypesData: {
    [id: string]: SzEntityType;
  };
  private set entityTypesData(value: {
    [id: string]: SzEntityType;
  }) {
    this._entityTypesData = value;

    if(this._entityTypesData) {
      this.datasource.data = Object.values( this._entityTypesData );
    }
  }

  private _loading: boolean = false;
  private _dialogOpen: boolean = false;

  public get loading(): boolean {
    return this._loading;
  }

  constructor(
    private adminBulkDataService: AdminBulkDataService,
    private entityTypesServices: SzEntityTypesService,
    private titleService: Title,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.datasource.paginator = this.paginator;
    // set page title
    this.titleService.setTitle( 'Admin Area - Entity Types' );
    this._loading = true;
    this.adminBulkDataService.onEntityTypesChange.subscribe(this.updateEntityTypesList.bind(this));
  }

  public updateEntityTypesList() {
    this._loading = true;
    this.entityTypesServices.listEntityTypesDetails().subscribe( 
      (data: {[key: string]: SzEntityType;}) => {
        console.log('listEntityTypesDetails: ', data);
        this.entityTypesData = data;
        this._loading = false;
      }, (err) => {
        console.error('hey', err);
      } );
  }
}

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

export interface DialogData {
  name: string;
}

@Component({
  selector: 'admin-entity-types',
  templateUrl: './entity-types.component.html',
  styleUrls: ['./entity-types.component.scss']
})
export class AdminEntityTypesComponent implements OnInit {
  displayedColumns: string[] = ['entityTypeId', 'entityTypeCode'];
  public datasource:  MatTableDataSource<SzEntityType> = new MatTableDataSource<SzEntityType>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  private _entityTypesData: {
    [id: string]: SzEntityType;
  };
  private set entityTypesData(value: {
    [id: string]: SzEntityType;
  }) {
    this._entityTypesData = value;
    console.log('entityTypesData = ', value);

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
    private entityTypesServices: SzEntityTypesService,
    private titleService: Title,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.datasource.paginator = this.paginator;
    // set page title
    this.titleService.setTitle( 'Admin Area - Entity Types' );
    this.updateEntityTypesList();
  }

  private updateEntityTypesList() {
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

  /*
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
  }*/

}
/*
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

}*/

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'admin-datasources',
  templateUrl: './datasources.component.html',
  styleUrls: ['./datasources.component.scss']
})
export class AdminDataSourcesComponent implements OnInit {

  constructor(
    private titleService: Title
  ) { }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - Data Sources' );
  }

}

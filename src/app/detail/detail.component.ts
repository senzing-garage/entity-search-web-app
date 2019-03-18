import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  public currentlySelectedEntityId: any;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe( (params) => this.currentlySelectedEntityId = parseInt(params.entityId, 10) );
  }

  ngOnInit() {
  }

  onRouteParamChange(params) {
    this.currentlySelectedEntityId = parseInt(params.entityId, 10);
    console.log('DetailComponent.onRouteParamChange: ', this.currentlySelectedEntityId, this);
  }

}

import { Component, OnInit } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {fadeInAnimation} from "@app/animations";

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css'],
  animations: [fadeInAnimation]
})
export class MoviesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation;
  }

}

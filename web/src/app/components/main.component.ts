import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {fadeInAnimation} from '../animations';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-main',
  template: `
    <app-top-nav></app-top-nav>
    <div [@routeAnimation]="getAnimationData(routerOutlet)">
      <router-outlet #routerOutlet="outlet"></router-outlet>
    </div>
  `,
  styles: [],
  animations: [fadeInAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation;
  }

}

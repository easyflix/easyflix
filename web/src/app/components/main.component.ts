import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {DEFAULT_TIMING, mainAnimations} from '../animations';
import {RouterOutlet} from '@angular/router';
import {Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {map} from 'rxjs/operators';
import {animate, query, style, transition, trigger} from '@angular/animations';

const detailsTransitions = [
  // transition(debugAnimation('details'), []),
  transition('detailsOn => detailsOff', [
    query('.details', style({ background: 'none' })),
    query(
      ':leave router-outlet + *',
      [
        style({ opacity: 1 }),
        animate(DEFAULT_TIMING, style({ opacity: 0 }))
      ]
    ),
  ]),
  transition('detailsOff => detailsOn', [
    query('.details', style({ background: 'none' })),
    query(
      ':enter router-outlet + *',
      [
        style({ opacity: 0 }),
        animate(DEFAULT_TIMING, style({ opacity: 1 }))
      ],
      { optional: true }
    ),
  ])
];

@Component({
  selector: 'app-main',
  template: `
    <header>
      <button mat-icon-button class="menu" *ngIf="showMenuButton$ | async" (click)="openSidenav()">
        <mat-icon>menu</mat-icon>
      </button>
      <app-logo></app-logo>
      <nav>
        <a [routerLink]="['./home']" routerLinkActive="active" queryParamsHandling="preserve">
          <mat-icon>home</mat-icon>
          Home
        </a>
        <a [routerLink]="['./movies']" routerLinkActive="active" queryParamsHandling="preserve">
          <mat-icon>local_movies</mat-icon>
          Movies
        </a>
        <a routerLink="./shows" routerLinkActive="active" queryParamsHandling="preserve">
          <mat-icon>live_tv</mat-icon>
          TV Shows
        </a>
        <!--<a routerLink="/others" routerLinkActive="active" queryParamsHandling="preserve">Others</a>-->
      </nav>
    </header>
    <main [@mainAnimation]="getAnimationData(main)">
      <router-outlet #main="outlet"></router-outlet>
    </main>
    <div [@detailsTransitions]="getDetailsAnimation(details)" class="details-animation">
      <router-outlet name="details" #details="outlet"></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .menu {
      position: absolute;
      top: 10px;
      left: 10px;
    }
    header {
      height: 60px;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 60px;
      position: fixed;
      width: 100%;
      z-index: 10;
      box-sizing: border-box;
    }
    header > nav {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    app-logo {
      margin: 0 0.5rem;
      width: 120px;
    }
    a {
      text-decoration: none;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      box-sizing: border-box;
      text-align: center;
      white-space: nowrap;
    }
    a mat-icon {
      margin-right: .5rem;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    a:not(:first-child) {
      border-left: 1px solid;
    }
    main {
      flex-grow: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      padding-top: 60px;
    }
    .details-animation {
      z-index: 20;
    }
  `],
  animations: [
    mainAnimations,
    trigger('detailsTransitions', detailsTransitions)
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit {

  showMenuButton$: Observable<boolean>;

  constructor(
    private core: CoreService
  ) {
    this.showMenuButton$ = core.getShowSidenav().pipe(map(b => !b));
  }

  ngOnInit() {}

  openSidenav() {
    this.core.openSidenav();
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
  }

  getDetailsAnimation(outlet: RouterOutlet) {
    return outlet && outlet.isActivated && outlet.activatedRoute && outlet.activatedRoute.firstChild && 'detailsOn' || 'detailsOff';
  }

/*  getDetailsAnimationData(outlet: RouterOutlet) {
    const primary =
      history.state.transition && history.state.id ?
        history.state.transition + '-' + history.state.id : '';

    const fallback = outlet
      && outlet.isActivated
      && outlet.activatedRoute
      && outlet.activatedRoute.firstChild
      && outlet.activatedRoute.firstChild.firstChild
      && outlet.activatedRoute.firstChild.firstChild.snapshot.data.animation || 'empty';

    return primary || fallback;
  }*/

}

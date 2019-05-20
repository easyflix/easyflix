import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {DEFAULT_TIMING, mainAnimations} from '../animations';
import {Router, RouterOutlet} from '@angular/router';
import {Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {map} from 'rxjs/operators';
import {animate, query, style, transition, trigger} from '@angular/animations';

const detailsTransitions = [
  // transition(debugAnimation('details'), []),
  transition('detailsOn => detailsOff', [
    query('.details', style({ background: 'none' })),
    query(
      ':leave router-outlet ~ *',
      [animate(DEFAULT_TIMING, style({opacity: 0}))],
      { optional: true }
    ),
  ]),
  transition('detailsOff => detailsOn', [
    query('.details', style({ background: 'none' })),
    query(
      ':enter router-outlet ~ *',
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
      <h1>Webflix</h1>
      <nav>
        <a [routerLink]="['/home']" routerLinkActive="active" queryParamsHandling="preserve">Home</a>
        <a [routerLink]="['/movies']" routerLinkActive="active" queryParamsHandling="preserve">Movies</a>
        <a routerLink="/shows" routerLinkActive="active" queryParamsHandling="preserve">TV Shows</a>
        <a routerLink="/others" routerLinkActive="active" queryParamsHandling="preserve">Others</a>
      </nav>
      <!--<mat-icon (click)="searchInput.focus()">search</mat-icon>
      <input #searchInput
             placeholder="Titles, people, genres"
             value="" type="search" autocomplete="off"
             [class.active]="searchFocused"
             (focus)="searchFocused = true"
             (blur)="searchFocused = false">-->
      <app-filters></app-filters>
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
    h1 {
      margin: 0 1rem 0 0;
    }
    a {
      text-decoration: none;
      display: inline-block;
      padding: 0 1rem;
      box-sizing: border-box;
      text-align: center;
      white-space: nowrap;
    }
    a:not(:first-child) {
      border-left: 1px solid;
    }
    app-filters {
      margin-left: auto;
      display: flex;
      flex-direction: row;
      align-items: center;
      flex-wrap: nowrap;
      height: 60px;
      overflow: hidden;
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

  searchFocused = false;
  showMenuButton$: Observable<boolean>;

  viewGrid = true;

  constructor(
    private core: CoreService,
    private router: Router,
    private location: Location
  ) {
    this.showMenuButton$ = core.getShowSidenav().pipe(map(b => !b));
    router.events.subscribe(() => {
      this.viewGrid = !location.path().startsWith('/movies/list');
    });
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

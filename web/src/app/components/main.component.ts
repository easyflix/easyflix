import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {mainAnimations, movieAnimations} from '../animations';
import {Router, RouterOutlet} from '@angular/router';
import {Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {map} from 'rxjs/operators';

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
        <nav>
          <mat-icon>arrow_right</mat-icon>
          <button mat-icon-button
                  [routerLink]="viewGrid ?
                      ['/movies/list', {outlets: {movie: null}}] :
                      ['/movies']"
                  queryParamsHandling="preserve"
                  routerLinkActive="active">
            <mat-icon>{{ viewGrid ? 'view_module' : 'view_stream' }}</mat-icon>
          </button>
        </nav>
        <a routerLink="/shows" routerLinkActive="active" queryParamsHandling="preserve">TV Shows</a>
        <!--<nav>
          <mat-icon>arrow_right</mat-icon>
          <button mat-icon-button
                  (click)="viewGrid = !viewGrid"
                  [routerLink]="viewGrid ? '/movies/list' : '/movies'"
                  queryParamsHandling="preserve"
                  routerLinkActive="active">
            <mat-icon>{{ viewGrid ? 'view_module' : 'view_stream' }}</mat-icon>
          </button>
        </nav>-->
        <a routerLink="/shows" routerLinkActive="active" queryParamsHandling="preserve">Others</a>
      </nav>
      <!--<mat-icon (click)="searchInput.focus()">search</mat-icon>
      <input #searchInput
             placeholder="Titles, people, genres"
             value="" type="search" autocomplete="off"
             [class.active]="searchFocused"
             (focus)="searchFocused = true"
             (blur)="searchFocused = false">-->
    </header>
    <main [@mainAnimation]="getAnimationData(main)">
      <div [@movieAnimation]="getAnimationData(movie)">
        <router-outlet name="movie" #movie="outlet"></router-outlet>
      </div>
      <router-outlet #main="outlet"></router-outlet>
    </main>
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
      min-height: 60px;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 60px;
      z-index: 1;
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
    }
    a:not(:first-child) {
      border-left: 1px solid;
    }
    nav nav {
      display: inline-flex;
      align-items: center;
      width: 0;
      overflow: hidden;
      transition: width 300ms ease;
      position: relative;
      left: -7px;
    }
    a.active + nav {
      width: 65px;
    }
    input {
      width: 0;
      padding: 0.5rem 0;
      margin: 0 0 0 0.25rem;
      border: none;
      border-bottom: 1px solid black;
      outline: none;
      background: transparent;
      transition: width 300ms ease;
    }
    input:focus {
      width: 250px;
      padding: 0.5rem 0.25rem;
    }
    main {
      flex-grow: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
  `],
  animations: [mainAnimations, movieAnimations],
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

  ngOnInit() {
  }

  openSidenav() {
    this.core.openSidenav();
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
  }

}

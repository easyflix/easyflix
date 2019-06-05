import {ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {concat, Observable} from 'rxjs';
import {CoreService} from './services/core.service';
import {playerAnimations} from '@app/animations';
import {RouterOutlet} from '@angular/router';
import {FilesService} from '@app/services/files.service';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {first, switchMap, tap} from 'rxjs/operators';
import {LibrariesService} from '@app/services/libraries.service';
import {SocketService} from '@app/services/socket.service';
import {MoviesService} from '@app/services/movies.service';
import {ShowsService} from '@app/services/shows.service';

@Component({
  selector: 'app-app',
  template: `
    <mat-sidenav-container>
      <mat-sidenav [mode]="sidenavMode$ | async"
                   [ngClass]="sidenavWidth$ | async"
                   [opened]="showSidenav$ | async"
                   [cdkTrapFocus]="showSidenav$ | async"
                   (closedStart)="closeSidenav()">
        <app-sidenav (closeSidenav)="closeSidenav()"></app-sidenav>
      </mat-sidenav>
      <mat-sidenav-content [@playerAnimation]="getAnimationData(player)">
        <app-main></app-main>
        <router-outlet name="player" #player="outlet"></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    mat-sidenav-container {
      height: 100%;
    }
    mat-sidenav {
      width: 400px;
    }
    mat-sidenav.normal {
      width: 600px;
    }
    mat-sidenav.wide {
      width: 800px;
    }
    mat-sidenav-content {
      position: relative;
      overflow-x: hidden;
    }
  `],
  animations: [playerAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {

  showSidenav$: Observable<boolean>;
  sidenavMode$: Observable<SidenavModeType>;
  sidenavWidth$: Observable<SidenavWidthType>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private libraries: LibrariesService,
    private movies: MoviesService,
    private shows: ShowsService,
    private socket: SocketService
  ) { }

  ngOnInit() {
    this.showSidenav$ = this.core.getShowSidenav();
    this.sidenavMode$ = this.core.getSidenavMode();
    this.sidenavWidth$ = this.core.getSidenavWidth();

    // Prepare authorization, must happen before any subscription
    this.core.getToken().pipe(
      first(),
      tap(token => this.socket.send({ method: 'Authorization', id: 0, entity: token }))
    ).subscribe();

    this.socket.open();

    // Initialize services with socket subscriptions
    this.libraries.init();
    this.files.init();
    this.movies.init();
    this.shows.init();

    // Load data
    // setTimeout(() => {
    this.libraries.load().pipe(
      switchMap(libraries => concat(...libraries.map(lib => this.files.load(lib))))
    ).subscribe(
      () => {},
      error => console.log(error),
    );
    this.movies.load().subscribe();
    this.shows.load().subscribe();
    this.core.load().subscribe();
    // }, 5000);
  }

  ngOnDestroy(): void {
    this.socket.close();
  }

  openSidenav() {
    this.core.openSidenav();
  }

  @HostListener('document:keyup.escape')
  closeSidenav() {
    this.core.closeSidenav();
  }

  @HostListener('document:keyup.²')
  toggleSidenav() {
    this.core.toggleSidenav();
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
  }

}

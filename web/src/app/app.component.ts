import {ChangeDetectionStrategy, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {Observable} from 'rxjs';
import {CoreService} from './services/core.service';
import {playerAnimations} from '@app/animations';
import {RouterOutlet} from '@angular/router';
import {FilesService} from '@app/services/files.service';
import {SidenavModeType} from '@app/reducers/core.reducer';
import {map} from 'rxjs/operators';
import {MediaTypesService} from '@app/services/media-types.service';
import {LibrariesService} from '@app/services/libraries.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  animations: [playerAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  themeCssClass$: Observable<string>;
  showSidenav$: Observable<boolean>;
  sidenavMode$: Observable<SidenavModeType>;
  sidenavWide$: Observable<boolean>;

  @ViewChild('sidenav')
  sidenav: MatSidenav;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private libraries: LibrariesService,
    private mediaTypes: MediaTypesService
  ) { }

  ngOnInit() {
    this.themeCssClass$ = this.core.getTheme().pipe(map(t => t.cssClass));
    this.showSidenav$ = this.core.getShowSidenav();
    this.sidenavMode$ = this.core.getSidenavMode();
    this.sidenavWide$ = this.core.getSidenavSize().pipe(
      map(size => size === 'wide')
    );
    this.libraries.load();
    this.files.load();
    this.mediaTypes.load();
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

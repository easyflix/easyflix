import {ChangeDetectionStrategy, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {concat, Observable} from 'rxjs';
import {CoreService} from './services/core.service';
import {playerAnimations} from '@app/animations';
import {RouterOutlet} from '@angular/router';
import {FilesService} from '@app/services/files.service';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {map, mergeMap} from 'rxjs/operators';
import {MediaTypesService} from '@app/services/media-types.service';
import {LibrariesService} from '@app/services/libraries.service';
import {ThemesUtils} from '@app/utils/themes.utils';

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
  sidenavWidth$: Observable<SidenavWidthType>;

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
    this.sidenavWidth$ = this.core.getSidenavWidth();
    /*concat(
      this.libraries.load(),
      this.files.load(),
      this.mediaTypes.load()
    ).subscribe(
      () => {},
      error => console.log(error),
      () => console.log('complete')
    );*/
    concat(
      this.libraries.load().pipe(
        mergeMap(libraries => concat(...libraries.map(lib => this.files.load(lib))))
      ),
      this.mediaTypes.load()
    ).subscribe(
      () => {},
      error => console.log(error),
      () => console.log('complete')
    );
    this.core.changeTheme(ThemesUtils.allThemes[0]);
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

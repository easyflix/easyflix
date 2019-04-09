import {ChangeDetectionStrategy, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {Observable} from 'rxjs';
import {CoreService} from './services/core.service';
import {playerAnimations} from '@app/animations';
import {RouterOutlet} from '@angular/router';
import {FilesService} from '@app/services/files.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  animations: [playerAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  sideNavOpening = false;
  showSidenav$: Observable<boolean>;
  sidenavMode$: Observable<string>;

  @ViewChild('sidenav')
  sidenav: MatSidenav;

  constructor(
    private core: CoreService,
    private files: FilesService
  ) { }

  ngOnInit() {
    this.showSidenav$ = this.core.getShowSidenav();
    this.sidenavMode$ = this.core.getSidenavMode();
    this.files.loadLibrairies();
    this.files.loadFiles();
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

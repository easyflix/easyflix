import {ChangeDetectionStrategy, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {Observable} from 'rxjs';
import {CoreService} from './services/core.service';
import {playerAnimations} from '@app/animations';
import {RouterOutlet} from '@angular/router';

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

  @ViewChild('sidenav')
  sidenav: MatSidenav;

  constructor(
    private core: CoreService,
  ) { }

  ngOnInit() {
    this.showSidenav$ = this.core.getShowSidenav();
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

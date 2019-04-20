import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {Theme, ThemesUtils} from '@app/utils/themes.utils';

@Component({
  selector: 'app-local',
  templateUrl: './local.component.html',
  styleUrls: ['./local.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocalComponent implements OnInit {

  sidenavMode$: Observable<SidenavModeType>;
  sidenavWidth$: Observable<SidenavWidthType>;

  theme$: Observable<Theme>;
  allThemes: Theme[] = ThemesUtils.allThemes;

  constructor(
    private core: CoreService,
    private sanitizer: DomSanitizer,
  ) {
    this.sidenavMode$ = core.getSidenavMode();
    this.sidenavWidth$ = core.getSidenavWidth();
    this.theme$ = core.getTheme();
  }

  ngOnInit() {
  }

  changeTheme(theme: Theme) {
    this.core.changeTheme(theme);
  }

  getThemeStyle(theme: Theme) {
    const style = `
      background-color: ${theme.background};
      color: ${theme.accent};
      border: 3px solid ${theme.primary}
    `;
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  setSidenavMode(mode: SidenavModeType) {
    this.core.setSidenavMode(mode);
  }

  setSidenavSize(size: SidenavWidthType) {
    this.core.setSidenavSize(size);
    setTimeout(() => this.core.closeSidenav());
    setTimeout(() => this.core.openSidenav());
  }

}

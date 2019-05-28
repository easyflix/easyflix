import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {Theme, ThemesUtils} from '@app/utils/themes.utils';

@Component({
  selector: 'app-local',
  template: `
    <h3>Themes</h3>
    <section class="themes">
      <ng-container *ngFor="let theme of allThemes">
        <button mat-icon-button class="theme" [style]="getThemeStyle(theme)" (click)="changeTheme(theme)">
          <mat-icon *ngIf="(theme$ | async) === theme">done</mat-icon>
        </button>
      </ng-container>
    </section>
    <mat-divider></mat-divider>
    <h3>Sidenav</h3>
    <section class="sidenav">
      <mat-form-field>
        <mat-label>Mode</mat-label>
        <mat-select [value]="sidenavMode$ | async" (selectionChange)="setSidenavMode($event.value)">
          <mat-option value="side">Side</mat-option>
          <mat-option value="push">Push</mat-option>
          <mat-option value="over">Over</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Width</mat-label>
        <mat-select [value]="sidenavWidth$ | async" (selectionChange)="setSidenavSize($event.value)">
          <mat-option value="narrow">Narrow</mat-option>
          <mat-option value="normal">Normal</mat-option>
          <mat-option value="wide">Wide</mat-option>
        </mat-select>
      </mat-form-field>
    </section>
  `,
  styles: [`
    h3 {
      margin: 1.25rem 0;
      font-size: 18px
    }
    .themes {
      display: flex;
      margin-bottom: 1rem
    }
    .theme {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 1rem;
    }
    .sidenav {
      display: flex
    }
    mat-form-field {
      width: 100px
    }
    .sidenav mat-form-field {
      flex-grow: 1
    }
    .sidenav mat-form-field:not(:last-of-type) {
      margin-right: 1rem
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientSettingsComponent implements OnInit {

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

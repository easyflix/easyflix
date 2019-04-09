import {Action} from '@ngrx/store';
import {SidenavModeType} from '@app/reducers/core.reducer';

export enum CoreActionTypes {
  OpenSidenav   = 'core/sidenav/open',
  CloseSidenav  = 'core/sidenav/close',
  ToggleSidenav = 'core/sidenav/toggle',
  SetSidenavMode = 'core/sidenav/mode',
  // ChangeTheme   = 'core/theme',
}

export class OpenSidenav implements Action {
  readonly type = CoreActionTypes.OpenSidenav;
}

export class CloseSidenav implements Action {
  readonly type = CoreActionTypes.CloseSidenav;
}

export class ToggleSidenav implements Action {
  readonly type = CoreActionTypes.ToggleSidenav;
}

export class SetSidenavMode implements Action {
  readonly type = CoreActionTypes.SetSidenavMode;
  constructor(public payload: SidenavModeType) {}
}

/*export class ChangeTheme implements Action {
  readonly type = CoreActionTypes.ChangeTheme;
  constructor(public payload: Theme) {}
}*/

export type CoreActionsUnion =
  OpenSidenav |
  CloseSidenav |
  ToggleSidenav |
  SetSidenavMode;
  // ChangeTheme;

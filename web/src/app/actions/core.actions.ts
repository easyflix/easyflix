import {Action} from '@ngrx/store';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {Theme} from '@app/utils/themes.utils';
import {ImagesConfig} from '@app/models/images-config';

export enum CoreActionTypes {
  OpenSidenav = 'core/sidenav/open',
  CloseSidenav = 'core/sidenav/close',
  ToggleSidenav = 'core/sidenav/toggle',
  SetSidenavMode = 'core/sidenav/mode',
  SetSidenavSize = 'core/sidenav/size',
  ChangeTheme = 'core/theme',
  LoadConfig = 'core/config/load',
  LoadConfigSuccess = 'core/config/load/success',
  LoadConfigError = 'core/config/load/error'
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

export class SetSidenavSize implements Action {
  readonly type = CoreActionTypes.SetSidenavSize;
  constructor(public payload: SidenavWidthType) {}
}

export class ChangeTheme implements Action {
  readonly type = CoreActionTypes.ChangeTheme;
  constructor(public payload: Theme) {}
}

export class LoadConfig implements Action {
  readonly type = CoreActionTypes.LoadConfig;
}

export class LoadConfigSuccess implements Action {
  readonly type = CoreActionTypes.LoadConfigSuccess;
  constructor(public payload: ImagesConfig) {}
}

export class LoadConfigError implements Action {
  readonly type = CoreActionTypes.LoadConfigError;
  constructor(public payload: string) {}
}

export type CoreActionsUnion =
  OpenSidenav |
  CloseSidenav |
  ToggleSidenav |
  SetSidenavMode |
  SetSidenavSize |
  ChangeTheme |
  LoadConfig |
  LoadConfigSuccess |
  LoadConfigError;

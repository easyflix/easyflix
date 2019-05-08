import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import * as fromStore from '../reducers';
import {Observable} from 'rxjs';
import {
  ChangeTheme,
  CloseSidenav, CoreActionTypes, LoadConfig,
  OpenSidenav,
  SetSidenavMode,
  SetSidenavSize,
  ToggleSidenav
} from '../actions/core.actions';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {Theme} from '@app/utils/themes.utils';
import {ImagesConfig} from '@app/models/images-config';
import {ServiceHelper} from '@app/services/service-helper';
import {State} from '../reducers';
import {Actions} from '@ngrx/effects';

@Injectable()
export class CoreService extends ServiceHelper {

  constructor(store: Store<State>, actions$: Actions) {
    super(store, actions$);
  }

  getShowSidenav() {
    return this.store.select(fromStore.getShowSidenav);
  }

  openSidenav() {
    this.store.dispatch(new OpenSidenav());
  }

  closeSidenav() {
    this.store.dispatch(new CloseSidenav());
  }

  toggleSidenav() {
    this.store.dispatch(new ToggleSidenav());
  }

  setSidenavMode(mode: SidenavModeType) {
    this.store.dispatch(new SetSidenavMode(mode));
  }

  getSidenavMode(): Observable<SidenavModeType> {
    return this.store.select(fromStore.getSidenavMode);
  }

  setSidenavSize(size: SidenavWidthType) {
    this.store.dispatch(new SetSidenavSize(size));
  }

  getSidenavWidth(): Observable<SidenavWidthType> {
    return this.store.select(fromStore.getSidenavWidth);
  }

  getTheme(): Observable<Theme> {
    return this.store.select(fromStore.getTheme);
  }

  changeTheme(theme: Theme) {
    this.store.dispatch(new ChangeTheme(theme));
  }

  getConfig(): Observable<ImagesConfig> {
    return this.store.select(fromStore.getConfig);
  }

  loadConfig(): Observable<ImagesConfig> {
    return this.dispatchActionObservable(
      new LoadConfig(),
      CoreActionTypes.LoadConfigSuccess,
      CoreActionTypes.LoadConfigError
    );
  }

}

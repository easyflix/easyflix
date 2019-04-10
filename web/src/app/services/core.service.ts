import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import * as fromStore from '../reducers';
import {Observable} from 'rxjs';
import {
  ChangeTheme,
  CloseSidenav,
  OpenSidenav,
  SetSidenavMode,
  SetSidenavSize,
  ToggleSidenav
} from '../actions/core.actions';
import {SidenavModeType, SidenavSizeType} from '@app/reducers/core.reducer';
import {Theme} from '@app/utils/themes.utils';

@Injectable()
export class CoreService {

  constructor(private store: Store<fromStore.State>) {}

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

  setSidenavSize(size: SidenavSizeType) {
    this.store.dispatch(new SetSidenavSize(size));
  }

  getSidenavSize(): Observable<SidenavSizeType> {
    return this.store.select(fromStore.getSidenavSize);
  }

  getTheme(): Observable<Theme> {
    return this.store.select(fromStore.getTheme);
  }

  changeTheme(theme: Theme) {
    this.store.dispatch(new ChangeTheme(theme));
  }

}

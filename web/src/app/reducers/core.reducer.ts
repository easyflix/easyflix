/**
 * State
 */
import {CoreActionsUnion, CoreActionTypes} from '../actions/core.actions';

export type SidenavModeType = 'over' | 'push' | 'side';
export type SidenavSizeType = 'wide' | 'narrow';

export interface State {
  showSidenav: boolean;
  sidenavMode: SidenavModeType;
  sidenavSize: SidenavSizeType;
  // currentTheme: Theme;
}

const initialState: State = {
  showSidenav: true,
  sidenavMode: 'side',
  sidenavSize: 'wide',
  // currentTheme: CoreUtils.allThemes[0],
};

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: CoreActionsUnion
): State {
  switch (action.type) {

    case CoreActionTypes.OpenSidenav:
      return {
        ...state,
        showSidenav: true,
      };

    case CoreActionTypes.CloseSidenav:
      return {
        ...state,
        showSidenav: false,
      };

    case CoreActionTypes.ToggleSidenav:
      return {
        ...state,
        showSidenav: !state.showSidenav,
      };

    case CoreActionTypes.SetSidenavMode:
      return {
        ...state,
        sidenavMode: action.payload
      };

    case CoreActionTypes.SetSidenavSize:
      return {
        ...state,
        sidenavSize: action.payload
      };

    // case CoreActionTypes.ChangeTheme:
    //   return {
    //     ...state,
    //     currentTheme: action.payload,
    //   };

    default:
      return state;
  }
}

/**
 * Selectors
 */
export const getShowSidenav = (state: State) => state.showSidenav;
export const getSidenavMode = (state: State) => state.sidenavMode;
export const getSidenavSize = (state: State) => state.sidenavSize;
// export const getCurrentTheme = (state: State) => state.currentTheme;

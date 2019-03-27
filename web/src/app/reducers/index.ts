import {ActionReducerMap, createSelector, MetaReducer} from '@ngrx/store';
import {environment} from '../../environments/environment';

import * as fromCore from './core.reducer';
import * as fromVideo from './video.reducer';

export interface State {
  core: fromCore.State;
  video: fromVideo.State;
}

export const reducers: ActionReducerMap<State> = {
  core: fromCore.reducer,
  video: fromVideo.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const getCoreState = (state: State) => state.core;

export const getVideoState = (state: State) => state.video;

export const getShowSidenav = createSelector(
  getCoreState,
  fromCore.getShowSidenav
);

// export const getCurrentTheme = createSelector(
//   getCoreState,
//   fromCore.getCurrentTheme
// );

export const getVideoInput = createSelector(
  getVideoState,
  fromVideo.getVideoInput
);

export const getVideoPlaying = createSelector(
  getVideoState,
  fromVideo.getVideoPlaying
);

export const getVideoLoading = createSelector(
  getVideoState,
  fromVideo.getVideoLoading
);

export const getVideoDuration = createSelector(
  getVideoState,
  fromVideo.getVideoDuration
);

export const getVideoMuted = createSelector(
  getVideoState,
  fromVideo.getVideoMuted
);

export const getVideoVolume = createSelector(
  getVideoState,
  fromVideo.getVideoVolume
);

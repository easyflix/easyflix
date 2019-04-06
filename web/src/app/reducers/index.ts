import {ActionReducerMap, createSelector, MetaReducer} from '@ngrx/store';
import {environment} from '@env/environment';

import * as fromCore from './core.reducer';
import * as fromVideo from './video.reducer';
import * as fromFiles from './files.reducer';

import {Folder, Library, LibraryFile} from '@app/models/file';

export interface State {
  core: fromCore.State;
  video: fromVideo.State;
  files: fromFiles.State;
}

export const reducers: ActionReducerMap<State> = {
  core: fromCore.reducer,
  video: fromVideo.reducer,
  files: fromFiles.reducer
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const getCoreState = (state: State) => state.core;

export const getVideoState = (state: State) => state.video;

export const getFilesState = (state: State) => state.files;

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

export const getVideoSource = createSelector(
  getVideoInput,
  input => input.source
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

export const {
  selectIds: getFilesIds,
  selectEntities: getFilesEntities,
  selectAll: getAllFiles,
  selectTotal: getTotalFiles,
} = fromFiles.adapter.getSelectors(getFilesState);

export const getFilesOfFolder = createSelector(
  getAllFiles,
  (files: LibraryFile[], folder: Folder | Library) => {
    let folderPath;
    switch (folder.type) {
      case 'library':
        folderPath = folder.name; break;
      case 'folder':
        folderPath = `${folder.parent}/${folder.name}`;
    }
    return files.filter(file => file.parent === folderPath);
  }
);

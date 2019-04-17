import {ActionReducerMap, createSelector, MetaReducer} from '@ngrx/store';
import {environment} from '@env/environment';
import {Dictionary} from '@ngrx/entity';

import * as fromCore from './core.reducer';
import * as fromVideo from './video.reducer';
import * as fromFiles from './files.reducer';
import * as fromLibraries from './libraries.reducer';
import * as fromMediaTypes from './media-types.reducer';

import {Library, LibraryFile, MediaType} from '@app/models';

export interface State {
  core: fromCore.State;
  video: fromVideo.State;
  files: fromFiles.State;
  libraries: fromLibraries.State;
  mediaTypes: fromMediaTypes.State;
}

export const reducers: ActionReducerMap<State> = {
  core: fromCore.reducer,
  video: fromVideo.reducer,
  files: fromFiles.reducer,
  libraries: fromLibraries.reducer,
  mediaTypes: fromMediaTypes.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const getCoreState = (state: State) => state.core;
export const getVideoState = (state: State) => state.video;
export const getFilesState = (state: State) => state.files;
export const getLibrariesState = (state: State) => state.libraries;
export const getMediaTypesState = (state: State) => state.mediaTypes;

export const getShowSidenav = createSelector(
  getCoreState,
  fromCore.getShowSidenav
);

export const getSidenavMode = createSelector(
  getCoreState,
  fromCore.getSidenavMode
);

export const getSidenavWidth = createSelector(
  getCoreState,
  fromCore.getSidenavWidth
);

export const getTheme = createSelector(
  getCoreState,
  fromCore.getTheme
);

export const getVideoSource = createSelector(
  getVideoState,
  fromVideo.getVideoSource
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
  selectAll: getAllFiles,
  selectEntities: getAllFilesEntities
} = fromFiles.adapter.getSelectors(getFilesState);

export const getFilesOfFolder = createSelector(
  getAllFiles,
  (files: LibraryFile[], folder: LibraryFile) => {
    function getParentPath(file: LibraryFile) {
      const segments = file.path.split('/');
      return segments.slice(0, segments.length - 1).join('/');
    }
    return files.filter(file => getParentPath(file) === folder.path);
  }
);

export const getFileById = createSelector(
  getAllFiles,
  (files: LibraryFile[], id: string) => files.find(file => file.id === id)
);

export const getFileByPath = createSelector(
  getAllFilesEntities,
  (entities: Dictionary<LibraryFile>, path: string) => entities[path]
);

/*export const getFilesLoaded = createSelector(
  getFilesState,
  fromFiles.getLoaded
);*/

export const {
  selectEntities: getAllLibrariesEntities,
  selectAll: getAllLibraries,
} = fromLibraries.adapter.getSelectors(getLibrariesState);

export const getLibraryByName = createSelector(
  getAllLibrariesEntities,
  (libraries: Dictionary<Library>, name: string) => libraries[name]
);

export const getLibrariesLoaded = createSelector(
  getLibrariesState,
  fromLibraries.getLoaded
);

export const {
  selectEntities: getAllMediaTypesEntities,
  selectAll: getAllMediaTypes,
} = fromMediaTypes.adapter.getSelectors(getMediaTypesState);

export const getMediaTypeBySubType = createSelector(
  getAllMediaTypesEntities,
  (mediaTypes: Dictionary<MediaType>, subType: string) => mediaTypes[subType]
);

export const getMediaTypesLoaded = createSelector(
  getMediaTypesState,
  fromMediaTypes.getLoaded
);



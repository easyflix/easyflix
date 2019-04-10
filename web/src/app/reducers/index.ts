import {ActionReducerMap, createSelector, MetaReducer} from '@ngrx/store';
import {environment} from '@env/environment';
import {Dictionary} from '@ngrx/entity';

import * as fromCore from './core.reducer';
import * as fromVideo from './video.reducer';
import * as fromFiles from './files.reducer';
import * as fromLibraries from './libraries.reducer';
import * as fromMediaTypes from './media-types.reducer';

import {Folder, Library, LibraryFile, MediaType} from '@app/models/file';

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

export const getSidenavSize = createSelector(
  getCoreState,
  fromCore.getSidenavSize
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
  (files: LibraryFile[], folder: Folder | Library) => {
    let folderPath;
    switch (folder.type) {
      case 'library':
        folderPath = `${folder.name}/`; break;
      case 'folder':
        folderPath = `${folder.parent}${folder.name}/`;
    }
    return files.filter(file => file.parent === folderPath);
  }
);

export const getFileById = createSelector(
  getAllFilesEntities,
  (entities: Dictionary<LibraryFile>, id: string) => entities[id]
);

export const getFilesLoaded = createSelector(
  getFilesState,
  fromFiles.getLoaded
);

export const {
  selectEntities: getAllLibrariesEntities,
  selectAll: getAllLibraries,
} = fromLibraries.adapter.getSelectors(getLibrariesState);

export const getLibraryByName = createSelector(
  getAllLibrariesEntities,
  (libraries: Dictionary<Library>, name: string) => libraries[name]
);

export const getLibrariesError = createSelector(
  getLibrariesState,
  fromLibraries.getError
);

export const getLibrariesAdding = createSelector(
  getLibrariesState,
  fromLibraries.getAdding
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

export const getMediaTypesError = createSelector(
  getMediaTypesState,
  fromMediaTypes.getError
);

export const getMediaTypesAdding = createSelector(
  getMediaTypesState,
  fromMediaTypes.getAdding
);

export const getMediaTypesLoaded = createSelector(
  getMediaTypesState,
  fromMediaTypes.getLoaded
);



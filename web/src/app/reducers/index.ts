import {ActionReducerMap, createSelector, MetaReducer} from '@ngrx/store';
import {environment} from '@env/environment';
import {Dictionary} from '@ngrx/entity';

import * as fromCore from './core.reducer';
import * as fromVideo from './video.reducer';
import * as fromFiles from './files.reducer';
import * as fromLibraries from './libraries.reducer';
import * as fromMovies from './movies.reducer';
import * as fromFilters from './filters.reducer';

import {Library, LibraryFile} from '@app/models';
import {FilesUtils} from '@app/utils/files.utils';

export interface State {
  core: fromCore.State;
  video: fromVideo.State;
  files: fromFiles.State;
  libraries: fromLibraries.State;
  movies: fromMovies.State;
  filters: fromFilters.State;
}

export const reducers: ActionReducerMap<State> = {
  core: fromCore.reducer,
  video: fromVideo.reducer,
  files: fromFiles.reducer,
  libraries: fromLibraries.reducer,
  movies: fromMovies.reducer,
  filters: fromFilters.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const getCoreState = (state: State) => state.core;
export const getVideoState = (state: State) => state.video;
export const getFilesState = (state: State) => state.files;
export const getLibrariesState = (state: State) => state.libraries;
export const getMoviesState = (state: State) => state.movies;
export const getFiltersState = (state: State) => state.filters;

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

export const getConfig = createSelector(
  getCoreState,
  fromCore.getConfig
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
    return files.filter(file =>
      // file is a direct child of folder
      FilesUtils.getParentPath(file) === folder.path &&
      // file is not a directory or is non empty)
      (!file.isDirectory || files.filter(f => !f.isDirectory && f.path.startsWith(file.path + '/')).length > 0)
    );
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

export const getLibraryCount = createSelector(
  getAllFiles,
  (files: LibraryFile[], library: Library) => files.filter(file => file.libraryName === library.name && !file.isDirectory).length
);

export const getFolderCount = createSelector(
  getAllFiles,
  (files: LibraryFile[], folder: LibraryFile) => files.filter(file => file.path.startsWith(folder.path + '/') && !file.isDirectory).length
);

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
  selectEntities: getAllMoviesEntities,
  selectAll: getAllMovies,
} = fromMovies.adapter.getSelectors(getMoviesState);

export const getMovieById = createSelector(
  getAllMoviesEntities,
  (entities, id) => entities[id]
);

export const getShowFilters = createSelector(
  getFiltersState,
  fromFilters.getShow
);

export const getSearchFilter = createSelector(
  getFiltersState,
  fromFilters.getSearch
);

export const getRatingFilter = createSelector(
  getFiltersState,
  fromFilters.getRating
);

export const getYearsFilter = createSelector(
  getFiltersState,
  fromFilters.getYears
);

export const getLanguagesFilter = createSelector(
  getFiltersState,
  fromFilters.getLanguages
);

export const getTagsFilter = createSelector(
  getFiltersState,
  fromFilters.getTags
);

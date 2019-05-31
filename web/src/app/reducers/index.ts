import {ActionReducerMap, createSelector, MetaReducer} from '@ngrx/store';
import {environment} from '@env/environment';
import {Dictionary} from '@ngrx/entity';

import * as fromCore from './core.reducer';
import * as fromVideo from './video.reducer';
import * as fromFiles from './files.reducer';
import * as fromLibraries from './libraries.reducer';
import * as fromMovies from './movies.reducer';
import * as fromShows from './shows.reducer';
import * as fromMovieFilters from './movie-filters.reducer';
import * as fromShowFilters from './show-filters.reducer';

import {Library, LibraryFile} from '@app/models';
import {FilesUtils} from '@app/utils/files.utils';

export interface State {
  core: fromCore.State;
  video: fromVideo.State;
  files: fromFiles.State;
  libraries: fromLibraries.State;
  movies: fromMovies.State;
  shows: fromShows.State;
  movie_filters: fromMovieFilters.State;
  show_filters: fromShowFilters.State;
}

export const reducers: ActionReducerMap<State> = {
  core: fromCore.reducer,
  video: fromVideo.reducer,
  files: fromFiles.reducer,
  libraries: fromLibraries.reducer,
  movies: fromMovies.reducer,
  shows: fromShows.reducer,
  movie_filters: fromMovieFilters.reducer,
  show_filters: fromShowFilters.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const getCoreState = (state: State) => state.core;
export const getVideoState = (state: State) => state.video;
export const getFilesState = (state: State) => state.files;
export const getLibrariesState = (state: State) => state.libraries;
export const getMoviesState = (state: State) => state.movies;
export const getShowsState = (state: State) => state.shows;
export const getMovieFiltersState = (state: State) => state.movie_filters;
export const getShowFiltersState = (state: State) => state.show_filters;

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

export const {
  selectEntities: getAllShowsEntities,
  selectAll: getAllShows,
} = fromShows.adapter.getSelectors(getShowsState);

export const getShowById = createSelector(
  getAllShowsEntities,
  (entities, id) => entities[id]
);

// Movie filters

export const getMovieFiltersShow = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getShow
);

export const getMovieSearchFilter = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getSearch
);

export const getMovieRatingFilter = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getRating
);

export const getMovieYearsFilter = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getYears
);

export const getMovieLanguagesFilter = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getLanguages
);

export const getMovieTagsFilter = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getTags
);

export const getMovieGenresFilter = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getGenres
);

export const getMovieSortStrategy = createSelector(
  getMovieFiltersState,
  fromMovieFilters.getSort
);

// Show filters

export const getShowFiltersShow = createSelector(
  getShowFiltersState,
  fromShowFilters.getShow
);

export const getShowSearchFilter = createSelector(
  getShowFiltersState,
  fromShowFilters.getSearch
);

export const getShowRatingFilter = createSelector(
  getShowFiltersState,
  fromShowFilters.getRating
);

export const getShowYearsFilter = createSelector(
  getShowFiltersState,
  fromShowFilters.getYears
);

export const getShowLanguagesFilter = createSelector(
  getShowFiltersState,
  fromShowFilters.getLanguages
);

export const getShowNetworksFilter = createSelector(
  getShowFiltersState,
  fromShowFilters.getNetworks
);

export const getShowGenresFilter = createSelector(
  getShowFiltersState,
  fromShowFilters.getGenres
);

export const getShowSortStrategy = createSelector(
  getShowFiltersState,
  fromShowFilters.getSort
);

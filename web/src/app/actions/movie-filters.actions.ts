import {Action} from '@ngrx/store';

export type MovieSortStrategy = 'alphabetical' | 'release' | 'addition';

export enum MovieFiltersActionTypes {
  ToggleFilters = 'filters/movies/toggle',
  SetSearch = 'filters/movies/search',
  SetRating = 'filters/movies/rating',
  SetYears = 'filters/movies/years',
  SetLanguages = 'filters/movies/languages',
  SetTags = 'filters/movies/tags',
  SetGenres = 'filters/movies/genres',
  SetSort = 'filters/movies/sort',
  ClearFilters = 'filters/movies/clear',
}

export class ToggleFilters implements Action {
  readonly type = MovieFiltersActionTypes.ToggleFilters;
}

export class SetMovieSearch implements Action {
  readonly type = MovieFiltersActionTypes.SetSearch;
  constructor(public payload: string) {}
}

export class SetMovieRating implements Action {
  readonly type = MovieFiltersActionTypes.SetRating;
  constructor(public payload: number) {}
}

export class SetMovieYears implements Action {
  readonly type = MovieFiltersActionTypes.SetYears;
  constructor(public payload: string[]) {}
}

export class SetMovieLanguages implements Action {
  readonly type = MovieFiltersActionTypes.SetLanguages;
  constructor(public payload: string[]) {}
}

export class SetMovieTags implements Action {
  readonly type = MovieFiltersActionTypes.SetTags;
  constructor(public payload: string[]) {}
}

export class SetMovieGenres implements Action {
  readonly type = MovieFiltersActionTypes.SetGenres;
  constructor(public payload: string[]) {}
}

export class SetMovieSort implements Action {
  readonly type = MovieFiltersActionTypes.SetSort;
  constructor(public payload: MovieSortStrategy) {}
}

export class ClearMovieFilters implements Action {
  readonly type = MovieFiltersActionTypes.ClearFilters;
}

export type MovieFiltersActionsUnion =
  ToggleFilters |
  SetMovieSearch |
  SetMovieRating |
  SetMovieYears |
  SetMovieLanguages |
  SetMovieTags |
  SetMovieGenres |
  SetMovieSort |
  ClearMovieFilters;

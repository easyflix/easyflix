import {Action} from '@ngrx/store';

export enum MovieFiltersActionTypes {
  SetSearch = 'filters/movies/search',
  SetRating = 'filters/movies/rating',
  SetYears = 'filters/movies/years',
  SetLanguages = 'filters/movies/languages',
  SetTags = 'filters/movies/tags',
  SetGenres = 'filters/movies/genres',
  ClearFilters = 'filters/movies/clear',
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

export class ClearMovieFilters implements Action {
  readonly type = MovieFiltersActionTypes.ClearFilters;
}

export type MovieFiltersActionsUnion =
  SetMovieSearch |
  SetMovieRating |
  SetMovieYears |
  SetMovieLanguages |
  SetMovieTags |
  SetMovieGenres |
  ClearMovieFilters;

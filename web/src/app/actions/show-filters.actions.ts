import {Action} from '@ngrx/store';

export enum ShowFiltersActionTypes {
  SetSearch = 'filters/shows/search',
  SetRating = 'filters/shows/rating',
  SetYears = 'filters/shows/years',
  SetLanguages = 'filters/shows/languages',
  SetNetworks = 'filters/shows/networks',
  SetGenres = 'filters/shows/genres',
  ClearFilters = 'filters/shows/clear',
}

export class SetShowSearch implements Action {
  readonly type = ShowFiltersActionTypes.SetSearch;
  constructor(public payload: string) {}
}

export class SetShowRating implements Action {
  readonly type = ShowFiltersActionTypes.SetRating;
  constructor(public payload: number) {}
}

export class SetShowYears implements Action {
  readonly type = ShowFiltersActionTypes.SetYears;
  constructor(public payload: string[]) {}
}

export class SetShowLanguages implements Action {
  readonly type = ShowFiltersActionTypes.SetLanguages;
  constructor(public payload: string[]) {}
}

export class SetShowNetworks implements Action {
  readonly type = ShowFiltersActionTypes.SetNetworks;
  constructor(public payload: string[]) {}
}

export class SetShowGenres implements Action {
  readonly type = ShowFiltersActionTypes.SetGenres;
  constructor(public payload: string[]) {}
}

export class ClearShowFilters implements Action {
  readonly type = ShowFiltersActionTypes.ClearFilters;
}

export type ShowFiltersActionsUnion =
  SetShowSearch |
  SetShowRating |
  SetShowYears |
  SetShowLanguages |
  SetShowNetworks |
  SetShowGenres |
  ClearShowFilters;

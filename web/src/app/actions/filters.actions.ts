import {Action} from '@ngrx/store';

export enum FiltersActionTypes {
  ShowFilters = 'filters/show',
  HideFilters = 'filters/hide',
  SetSearch = 'filters/search',
  SetRating = 'filters/rating',
  SetYears = 'filters/years',
  SetLanguages = 'filters/languages',
  SetTags = 'filters/tags',
  ClearFilters = 'filters/clear',
}

export class ShowFilters implements Action {
  readonly type = FiltersActionTypes.ShowFilters;
}

export class HideFilters implements Action {
  readonly type = FiltersActionTypes.HideFilters;
}

export class SetSearch implements Action {
  readonly type = FiltersActionTypes.SetSearch;
  constructor(public payload: string) {}
}

export class SetRating implements Action {
  readonly type = FiltersActionTypes.SetRating;
  constructor(public payload: number) {}
}

export class SetYears implements Action {
  readonly type = FiltersActionTypes.SetYears;
  constructor(public payload: string[]) {}
}

export class SetLanguages implements Action {
  readonly type = FiltersActionTypes.SetLanguages;
  constructor(public payload: string[]) {}
}

export class SetTags implements Action {
  readonly type = FiltersActionTypes.SetTags;
  constructor(public payload: string[]) {}
}

export class ClearFilters implements Action {
  readonly type = FiltersActionTypes.ClearFilters;
}

export type FiltersActionsUnion =
  ShowFilters |
  HideFilters |
  SetSearch |
  SetRating |
  SetYears |
  SetLanguages |
  SetTags |
  ClearFilters;

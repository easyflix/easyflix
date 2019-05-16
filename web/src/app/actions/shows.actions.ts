import {Action} from '@ngrx/store';
import {Show, ShowDetails} from '@app/models/show';

export enum ShowsActionTypes {
  AddShows = 'shows/add',
  UpdateShows = 'shows/update',
  LoadShows = 'shows/load',
  LoadShowsSuccess = 'shows/load/success',
  LoadShowsError = 'shows/load/error',
}

export class AddShows implements Action {
  readonly type = ShowsActionTypes.AddShows;
  constructor(public payload: Show[]) {}
}

export class UpdateShows implements Action {
  readonly type = ShowsActionTypes.UpdateShows;
  constructor(public payload: ShowDetails[]) {}
}

export class LoadShows implements Action {
  readonly type = ShowsActionTypes.LoadShows;
}

export class LoadShowsSuccess implements Action {
  readonly type = ShowsActionTypes.LoadShowsSuccess;
  constructor(public payload: Show[]) {}
}

export class LoadShowsError implements Action {
  readonly type = ShowsActionTypes.LoadShowsError;
  constructor(public payload: string) {}
}

export type ShowsActionsUnion =
  AddShows |
  UpdateShows |
  LoadShows |
  LoadShowsSuccess |
  LoadShowsError;

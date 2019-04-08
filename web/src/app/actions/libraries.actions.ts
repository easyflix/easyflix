import {Action} from '@ngrx/store';
import {Library} from '@app/models/file';

export enum LibrariesActionTypes {
  LoadLibraries = 'libraries/load',
  LoadLibrariesSuccess = 'libraries/load/success',
  LoadLibrariesError = 'libraries/load/error',
}

export class LoadLibraries implements Action {
  readonly type = LibrariesActionTypes.LoadLibraries;
}

export class LoadLibrariesSuccess implements Action {
  readonly type = LibrariesActionTypes.LoadLibrariesSuccess;
  constructor(public payload: Library[]) {}
}

export class LoadLibrariesError implements Action {
  readonly type = LibrariesActionTypes.LoadLibrariesError;
  constructor(public payload: string) {}
}

export type LibrariesActionsUnion =
  LoadLibraries |
  LoadLibrariesSuccess |
  LoadLibrariesError;

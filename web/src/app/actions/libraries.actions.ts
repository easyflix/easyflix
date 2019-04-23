import {Action} from '@ngrx/store';
import {LibraryFile} from '@app/models/library-file';
import {ValidationError} from '@app/models/validation-error';
import {Library} from '@app/models/library';

export enum LibrariesActionTypes {
  LoadLibraries = 'libraries/load',
  LoadLibrariesSuccess = 'libraries/load/success',
  LoadLibrariesError = 'libraries/load/error',
  AddLibrary = 'libraries/add',
  AddLibrarySuccess = 'libraries/add/success',
  AddLibraryError = 'libraries/add/error',
  RemoveLibrary = 'libraries/remove',
  RemoveLibrarySuccess = 'libraries/remove/success',
  RemoveLibraryError = 'libraries/remove/error',
  ScanLibrary = 'libraries/scan',
  ScanLibrarySuccess = 'libraries/scan/success',
  ScanLibraryError = 'libraries/scan/error',
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

export class AddLibrary implements Action {
  readonly type = LibrariesActionTypes.AddLibrary;
  constructor(public payload: Library) {}
}

export class AddLibrarySuccess implements Action {
  readonly type = LibrariesActionTypes.AddLibrarySuccess;
  constructor(public payload: Library) {}
}

export class AddLibraryError implements Action {
  readonly type = LibrariesActionTypes.AddLibraryError;
  constructor(public payload: ValidationError) {}
}

export class RemoveLibrary implements Action {
  readonly type = LibrariesActionTypes.RemoveLibrary;
  constructor(public payload: Library) {}
}

export class RemoveLibrarySuccess implements Action {
  readonly type = LibrariesActionTypes.RemoveLibrarySuccess;
  constructor(public payload: Library) {}
}

export class RemoveLibraryError implements Action {
  readonly type = LibrariesActionTypes.RemoveLibraryError;
  constructor(public payload: ValidationError) {}
}

export class ScanLibrary implements Action {
  readonly type = LibrariesActionTypes.ScanLibrary;
  constructor(public payload: Library) {}
}

export class ScanLibrarySuccess implements Action {
  readonly type = LibrariesActionTypes.ScanLibrarySuccess;
  constructor(public payload: LibraryFile[], public library: Library) {}
}

export class ScanLibraryError implements Action {
  readonly type = LibrariesActionTypes.ScanLibraryError;
  constructor(public payload: string, public library: Library) {}
}

export type LibrariesActionsUnion =
  LoadLibraries |
  LoadLibrariesSuccess |
  LoadLibrariesError |
  AddLibrary |
  AddLibrarySuccess |
  AddLibraryError |
  RemoveLibrary |
  RemoveLibrarySuccess |
  RemoveLibraryError |
  ScanLibrary |
  ScanLibrarySuccess |
  ScanLibraryError;

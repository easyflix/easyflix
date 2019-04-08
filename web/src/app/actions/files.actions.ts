import {Action} from '@ngrx/store';
import {LibraryFile} from '@app/models/file';

export enum FilesActionTypes {
  LoadFiles = 'files/load',
  LoadFilesSuccess = 'files/load/success',
  LoadFilesError = 'files/load/error',
}

export class LoadFiles implements Action {
  readonly type = FilesActionTypes.LoadFiles;
}

export class LoadFilesSuccess implements Action {
  readonly type = FilesActionTypes.LoadFilesSuccess;
  constructor(public payload: LibraryFile[]) {}
}

export class LoadFilesError implements Action {
  readonly type = FilesActionTypes.LoadFilesError;
  constructor(public payload: string) {}
}

export type FilesActionsUnion =
  LoadFiles |
  LoadFilesSuccess |
  LoadFilesError;

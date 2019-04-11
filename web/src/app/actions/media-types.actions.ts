import {Action} from '@ngrx/store';
import {MediaType} from '@app/models/file';
import {ValidationError} from '@app/models/validation-error';

export enum MediaTypesActionTypes {
  LoadMediaTypes = 'media-types/load',
  LoadMediaTypesSuccess = 'media-types/load/success',
  LoadMediaTypesError = 'media-types/load/error',
  AddMediaType = 'media-types/add',
  AddMediaTypeSuccess = 'media-types/add/success',
  AddMediaTypeError = 'media-types/add/error',
  RemoveMediaType = 'media-types/remove',
  RemoveMediaTypeSuccess = 'media-types/remove/success',
  RemoveMediaTypeError = 'media-types/remove/error',
}

export class LoadMediaTypes implements Action {
  readonly type = MediaTypesActionTypes.LoadMediaTypes;
}

export class LoadMediaTypesSuccess implements Action {
  readonly type = MediaTypesActionTypes.LoadMediaTypesSuccess;
  constructor(public payload: MediaType[]) {}
}

export class LoadMediaTypesError implements Action {
  readonly type = MediaTypesActionTypes.LoadMediaTypesError;
  constructor(public payload: string) {}
}

export class AddMediaType implements Action {
  readonly type = MediaTypesActionTypes.AddMediaType;
  constructor(public payload: MediaType) {}
}

export class AddMediaTypeSuccess implements Action {
  readonly type = MediaTypesActionTypes.AddMediaTypeSuccess;
  constructor(public payload: MediaType) {}
}

export class AddMediaTypeError implements Action {
  readonly type = MediaTypesActionTypes.AddMediaTypeError;
  constructor(public payload: ValidationError) {}
}

export class RemoveMediaType implements Action {
  readonly type = MediaTypesActionTypes.RemoveMediaType;
  constructor(public payload: string) {}
}

export class RemoveMediaTypeSuccess implements Action {
  readonly type = MediaTypesActionTypes.RemoveMediaTypeSuccess;
  constructor(public payload: string) {}
}

export class RemoveMediaTypeError implements Action {
  readonly type = MediaTypesActionTypes.RemoveMediaTypeError;
  constructor(public payload: ValidationError) {}
}

export type MediaTypesActionsUnion =
  LoadMediaTypes |
  LoadMediaTypesSuccess |
  LoadMediaTypesError |
  AddMediaType |
  AddMediaTypeSuccess |
  AddMediaTypeError |
  RemoveMediaType |
  RemoveMediaTypeSuccess |
  RemoveMediaTypeError;

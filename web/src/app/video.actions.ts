import { Action } from '@ngrx/store';

export enum VideoActionTypes {
  SetVideoSource   = 'core/video/source',
  SetVideoVolume   = 'core/video/volume',
  SetVideoMuted    = 'core/video/muted',
  SetVideoLoading  = 'core/video/loading',
  SetVideoPlaying  = 'core/video/playing',
  SetVideoDuration = 'core/video/duration',
  SetVideoError    = 'core/video/error',
}

export class SetVideoSource implements Action {
  readonly type = VideoActionTypes.SetVideoSource;
  constructor(public payload: string) {}
}

export class SetVideoVolume implements Action {
  readonly type = VideoActionTypes.SetVideoVolume;
  constructor(public payload: number) {}
}

export class SetVideoMuted implements Action {
  readonly type = VideoActionTypes.SetVideoMuted;
  constructor(public payload: boolean) {}
}

export class SetVideoLoading implements Action {
  readonly type = VideoActionTypes.SetVideoLoading;
  constructor(public payload: boolean) {}
}

export class SetVideoPlaying implements Action {
  readonly type = VideoActionTypes.SetVideoPlaying;
  constructor(public payload: boolean) {}
}

export class SetVideoDuration implements Action {
  readonly type = VideoActionTypes.SetVideoDuration;
  constructor(public payload: number) {}
}

export class SetVideoError implements Action {
  readonly type = VideoActionTypes.SetVideoError;
  constructor(public payload: string) {}
}

export type VideoActionsUnion =
  SetVideoSource |
  SetVideoVolume |
  SetVideoMuted |
  SetVideoLoading |
  SetVideoPlaying |
  SetVideoDuration |
  SetVideoError;

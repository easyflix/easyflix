/**
 * State
 */
import {VideoActionsUnion, VideoActionTypes} from '../actions/video.actions';

// TODO remove videoInput and VideoState
export interface State {
  source: string;
  volume: number;
  muted: boolean;
  loading: boolean;
  playing: boolean;
  duration: number;
  error: string;
}

const initialState: State = {
  source: null,
  volume: 1,
  muted: false,
  loading: false,
  playing: false,
  duration: 0,
  error: null
};

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: VideoActionsUnion
): State {
  switch (action.type) {

    case VideoActionTypes.SetVideoSource:
      return {
        ...state,
        source: action.payload
      };

    case VideoActionTypes.SetVideoVolume:
      return {
        ...state,
        volume: action.payload
      };

    case VideoActionTypes.SetVideoMuted:
      return {
        ...state,
        muted: action.payload
      };

    case VideoActionTypes.SetVideoDuration:
      return {
        ...state,
        duration: action.payload
      };

    case VideoActionTypes.SetVideoError:
      return {
        ...state,
        error: action.payload
      };

    case VideoActionTypes.SetVideoPlaying:
      return {
        ...state,
        playing: action.payload
      };

    case VideoActionTypes.SetVideoLoading:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
}

/**
 * Selectors
 */
export const getVideoSource = (state: State) => state.source;
export const getVideoMuted = (state: State) => state.muted;
export const getVideoVolume = (state: State) => state.volume;

export const getVideoPlaying = (state: State) => state.playing;
export const getVideoLoading = (state: State) => state.loading;
export const getVideoDuration = (state: State) => state.duration;

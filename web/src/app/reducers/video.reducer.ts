/**
 * State
 */
import {VideoActionsUnion, VideoActionTypes} from '../actions/video.actions';

export interface State {
  videoInput: {
    source: string;
    volume: number;
    muted: boolean;
  };
  videoState: {
    loading: boolean;
    playing: boolean;
    duration: number;
    error: string;
  };
}

const initialState: State = {
  videoInput: {
    source: null,
    volume: 1,
    muted: false,
  },
  videoState: {
    loading: false,
    playing: false,
    duration: 0,
    error: null
  },
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
        videoInput: {
          ...state.videoInput,
          source: action.payload
        }
      };

    case VideoActionTypes.SetVideoVolume:
      return {
        ...state,
        videoInput: {
          ...state.videoInput,
          volume: action.payload
        }
      };

    case VideoActionTypes.SetVideoMuted:
      return {
        ...state,
        videoInput: {
          ...state.videoInput,
          muted: action.payload
        }
      };

    case VideoActionTypes.SetVideoDuration:
      return {
        ...state,
        videoState: {
          ...state.videoState,
          duration: action.payload
        }
      };

    case VideoActionTypes.SetVideoError:
      return {
        ...state,
        videoState: {
          ...state.videoState,
          error: action.payload
        }
      };

    case VideoActionTypes.SetVideoPlaying:
      return {
        ...state,
        videoState: {
          ...state.videoState,
          playing: action.payload
        }
      };

    case VideoActionTypes.SetVideoLoading:
      return {
        ...state,
        videoState: {
          ...state.videoState,
          loading: action.payload
        }
      };

    default:
      return state;
  }
}

/**
 * Selectors
 */
export const getVideoInput = (state: State) => state.videoInput;
export const getVideoMuted = (state: State) => state.videoInput.muted;
export const getVideoVolume = (state: State) => state.videoInput.volume;

export const getVideoPlaying = (state: State) => state.videoState.playing;
export const getVideoLoading = (state: State) => state.videoState.loading;
export const getVideoDuration = (state: State) => state.videoState.duration;

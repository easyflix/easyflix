import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {MediaType} from '@app/models/file';
import {MediaTypesActionsUnion, MediaTypesActionTypes} from '@app/actions/media-types.actions';

/**
 * State
 */
export const adapter: EntityAdapter<MediaType> = createEntityAdapter<MediaType>({
  selectId: mt => mt.subType
});

export interface State extends EntityState<MediaType> {
  error: string;
  adding: boolean;
  loaded: boolean;
}

export const initialState: State = adapter.getInitialState({
  error: null,
  adding: false,
  loaded: false,
});

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: MediaTypesActionsUnion
): State {
  switch (action.type) {

    case MediaTypesActionTypes.LoadMediaTypesSuccess: {
      return adapter.upsertMany(action.payload, {
        ...state,
        loaded: true
      });
    }

    case MediaTypesActionTypes.AddMediaType: {
      return {
        ...state,
        adding: true,
        error: null
      };
    }

    case MediaTypesActionTypes.RemoveMediaType: {
      return {
        ...state,
        error: null
      };
    }

    case MediaTypesActionTypes.AddMediaTypeSuccess: {
      return adapter.upsertOne(action.payload, {
        ...state,
        error: null,
        adding: false,
      });
    }

    case MediaTypesActionTypes.RemoveMediaTypeSuccess: {
      return adapter.removeOne(action.payload, {
        ...state,
        error: null,
        adding: false
      });
    }

    case MediaTypesActionTypes.AddMediaTypeError || MediaTypesActionTypes.RemoveMediaTypeError: {
      return {
        ...state,
        error: action.payload,
        adding: false,
      };
    }

    default: return state;
  }
}

/**
 * Selectors
 */
export const getLoaded = (state: State) => state.loaded;
export const getAdding = (state: State) => state.adding;
export const getError = (state: State) => state.error;

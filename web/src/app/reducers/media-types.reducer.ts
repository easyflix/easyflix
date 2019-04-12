import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {MediaType} from '@app/models/file';
import {MediaTypesActionsUnion, MediaTypesActionTypes} from '@app/actions/media-types.actions';
import {ValidationError} from '@app/models/validation-error';

/**
 * State
 */
export const adapter: EntityAdapter<MediaType> = createEntityAdapter<MediaType>({
  selectId: mt => mt.subType
});

export interface State extends EntityState<MediaType> {
  loaded: boolean;
}

export const initialState: State = adapter.getInitialState({
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

    case MediaTypesActionTypes.AddMediaTypeSuccess: {
      return adapter.upsertOne(action.payload, state);
    }

    case MediaTypesActionTypes.RemoveMediaTypeSuccess: {
      return adapter.removeOne(action.payload, state);
    }

    default: return state;
  }
}

/**
 * Selectors
 */
export const getLoaded = (state: State) => state.loaded;

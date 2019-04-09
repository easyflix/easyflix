import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Library} from '@app/models/file';
import {LibrariesActionsUnion, LibrariesActionTypes} from '@app/actions/libraries.actions';

/**
 * State
 */
export const adapter: EntityAdapter<Library> = createEntityAdapter<Library>({
  selectId: lib => lib.name,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

export interface State extends EntityState<Library> {
  error: string;
}

export const initialState: State = adapter.getInitialState({
  error: null,
});

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: LibrariesActionsUnion
): State {
  switch (action.type) {

    case LibrariesActionTypes.LoadLibrariesSuccess: {
      return adapter.upsertMany(action.payload, state);
    }

    case LibrariesActionTypes.AddLibrarySuccess: {
      return adapter.upsertOne(action.payload, {
        ...state,
        error: null
      });
    }

    case LibrariesActionTypes.RemoveLibrarySuccess: {
      return adapter.removeOne(action.payload, {
        ...state,
        error: null
      });
    }

    case LibrariesActionTypes.AddLibraryError || LibrariesActionTypes.RemoveLibraryError: {
      return {
        ...state,
        error: action.payload
      };
    }

    default: return state;
  }
}

/**
 * Selectors
 */
export const getError = (state: State) => state.error;

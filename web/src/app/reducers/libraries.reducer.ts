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
  action: LibrariesActionsUnion
): State {
  switch (action.type) {

    case LibrariesActionTypes.LoadLibrariesSuccess: {
      return adapter.upsertMany(action.payload, {
        ...state,
        loaded: true
      });
    }

    case LibrariesActionTypes.AddLibrary: {
      return {
        ...state,
        adding: true,
      };
    }

    case LibrariesActionTypes.AddLibrarySuccess: {
      return adapter.upsertOne(action.payload, {
        ...state,
        error: null,
        adding: false,
      });
    }

    case LibrariesActionTypes.RemoveLibrarySuccess: {
      return adapter.removeOne(action.payload, {
        ...state,
        error: null,
        adding: false
      });
    }

    case LibrariesActionTypes.AddLibraryError || LibrariesActionTypes.RemoveLibraryError: {
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

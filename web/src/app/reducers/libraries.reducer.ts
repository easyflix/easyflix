import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Library} from '@app/models';
import {LibrariesActionsUnion, LibrariesActionTypes} from '@app/actions/libraries.actions';

/**
 * State
 */
export const adapter: EntityAdapter<Library> = createEntityAdapter<Library>({
  selectId: lib => lib.name,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

export interface State extends EntityState<Library> {
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
  action: LibrariesActionsUnion
): State {
  switch (action.type) {

    case LibrariesActionTypes.LoadLibrariesSuccess: {
      return adapter.upsertMany(action.payload, {
        ...state,
        loaded: true
      });
    }

    case LibrariesActionTypes.AddLibrarySuccess: {
      return adapter.upsertOne(action.payload, state);
    }

    case LibrariesActionTypes.RemoveLibrarySuccess: {
      return adapter.removeOne(action.payload.name, state);
    }

    case LibrariesActionTypes.ScanLibrary: {
      return adapter.updateOne({ id: action.payload.name, changes: { scanning: true } }, state);
    }

    case LibrariesActionTypes.ScanLibrarySuccess: {
      return adapter.updateOne({ id: action.library.name, changes: { scanning: false } }, state);
    }

    case LibrariesActionTypes.ScanLibraryError: {
      return adapter.updateOne({ id: action.library.name, changes: { scanning: false } }, state);
    }

    default: return state;
  }
}

/**
 * Selectors
 */
export const getLoaded = (state: State) => state.loaded;

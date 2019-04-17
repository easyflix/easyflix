import {createEntityAdapter, EntityAdapter, EntityState, Update} from '@ngrx/entity';
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
      return adapter.removeOne(action.payload, state);
    }

    case LibrariesActionTypes.ScanLibrary: {
      return adapter.updateOne({ id: action.payload, changes: { scanning: true } }, state);
    }

    default: return state;
  }
}

/**
 * Selectors
 */
export const getLoaded = (state: State) => state.loaded;

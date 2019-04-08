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

export interface State extends EntityState<Library> {}

export const initialState: State = adapter.getInitialState();

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

    default: return state;
  }
}

/**
 * Selectors
 */

import {ShowsActionsUnion, ShowsActionTypes} from '../actions/shows.actions';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Show} from '@app/models/show';

/**
 * State
 */
export const adapter: EntityAdapter<Show> = createEntityAdapter<Show>({
  selectId: movie => movie.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

export interface State extends EntityState<Show> {}

export const initialState: State = adapter.getInitialState({});

const addType: (show: Show) => Show = (show: Show) => {
  return {
    type: 'show',
    ...show
  };
};

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: ShowsActionsUnion
): State {
  switch (action.type) {

    case ShowsActionTypes.LoadShowsSuccess: {
      return adapter.upsertMany(action.payload.map(addType), state);
    }

    case ShowsActionTypes.AddShows: {
      return adapter.upsertMany(action.payload.map(addType), state);
    }

    case ShowsActionTypes.UpdateShows: {
      return adapter.updateMany(
        action.payload.map(details => ({ id: details.id, changes: { details } })),
        state
      );
    }

    default: return state;
  }
}

/**
 * Selectors
 */
// export const getLoaded = (state: State) => state.loaded;

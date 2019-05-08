import {MoviesActionsUnion, MoviesActionTypes} from '../actions/movies.actions';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Movie} from '@app/models';

/**
 * State
 */
export const adapter: EntityAdapter<Movie> = createEntityAdapter<Movie>({
  selectId: movie => movie.path
});

export interface State extends EntityState<Movie> {}

export const initialState: State = adapter.getInitialState({});

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: MoviesActionsUnion
): State {
  switch (action.type) {

    case MoviesActionTypes.LoadMoviesSuccess: {
      return adapter.upsertMany(action.payload, state);
    }

    case MoviesActionTypes.AddMovies: {
      return adapter.upsertMany(action.payload, state);
    }

    default: return state;
  }
}

/**
 * Selectors
 */
// export const getLoaded = (state: State) => state.loaded;

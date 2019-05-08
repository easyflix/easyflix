import {Action} from '@ngrx/store';
import {Movie} from '@app/models';

export enum MoviesActionTypes {
  LoadMovies = 'movies/load',
  LoadMoviesSuccess = 'movies/load/success',
  LoadMoviesError = 'movies/load/error',
}

export class LoadMovies implements Action {
  readonly type = MoviesActionTypes.LoadMovies;
}

export class LoadMoviesSuccess implements Action {
  readonly type = MoviesActionTypes.LoadMoviesSuccess;
  constructor(public payload: Movie[]) {}
}

export class LoadMoviesError implements Action {
  readonly type = MoviesActionTypes.LoadMoviesError;
  constructor(public payload: string) {}
}

export type MoviesActionsUnion =
  LoadMovies |
  LoadMoviesSuccess |
  LoadMoviesError;

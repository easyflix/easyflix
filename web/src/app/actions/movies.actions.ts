import {Action} from '@ngrx/store';
import {Movie} from '@app/models';
import {MovieDetails} from '@app/models/movie';

export enum MoviesActionTypes {
  AddMovies = 'movies/add',
  UpdateMovies = 'movies/update',
  DeleteMovies = 'movies/delete',
  LoadMovies = 'movies/load',
  LoadMoviesSuccess = 'movies/load/success',
  LoadMoviesError = 'movies/load/error',
}

export class AddMovies implements Action {
  readonly type = MoviesActionTypes.AddMovies;
  constructor(public payload: Movie[]) {}
}

export class UpdateMovies implements Action {
  readonly type = MoviesActionTypes.UpdateMovies;
  constructor(public payload: MovieDetails[]) {}
}

export class DeleteMovies implements Action {
  readonly type = MoviesActionTypes.DeleteMovies;
  constructor(public payload: number[]) {}
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
  AddMovies |
  UpdateMovies |
  DeleteMovies |
  LoadMovies |
  LoadMoviesSuccess |
  LoadMoviesError;

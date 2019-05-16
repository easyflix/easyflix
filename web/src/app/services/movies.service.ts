import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Movie} from '@app/models';
import {Store} from '@ngrx/store';
import {State, getAllMovies, getMovieById} from '@app/reducers';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {AddMovies, LoadMovies, MoviesActionTypes, UpdateMovies} from '@app/actions/movies.actions';
import {bufferTime, filter, map, tap} from 'rxjs/operators';
import {MovieDetails} from '@app/models/movie';

@Injectable()
export class MoviesService extends ServiceHelper {

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>, actions$: Actions
  ) {
    super(store, actions$);

    this.socketClient.getSocket().pipe(
      filter(message => message.method === 'MovieAdded'),
      map(message => message.entity),
      bufferTime(100, null, 15),
      filter(movies => movies.length > 0),
      // tap(movies => console.log(movies)),
      tap((movies: Movie[]) => this.store.dispatch(new AddMovies(movies)))
    ).subscribe();

    this.socketClient.getSocket().pipe(
      filter(message => message.method === 'MovieUpdate'),
      map(message => message.entity),
      bufferTime(100, null, 15),
      filter(updates => updates.length > 0),
      // tap(movies => console.log(movies)),
      tap((updates: MovieDetails[]) => this.store.dispatch(new UpdateMovies(updates)))
    ).subscribe();
  }

  getAll(): Observable<Movie[]> {
    return this.store.select(getAllMovies);
  }

  getById(id: number): Observable<Movie> {
    return this.store.select(getMovieById, id);
  }

  load(): Observable<Movie[]> {
    return this.dispatchActionObservable(
      new LoadMovies(),
      MoviesActionTypes.LoadMoviesSuccess,
      MoviesActionTypes.LoadMoviesError
    );
  }

}

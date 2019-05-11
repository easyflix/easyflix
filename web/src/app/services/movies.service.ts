import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Movie} from '@app/models';
import {Store} from '@ngrx/store';
import {State, getAllMovies, getMovieByPath} from '@app/reducers';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {AddMovies, LoadMovies, MoviesActionTypes} from '@app/actions/movies.actions';
import {bufferTime, filter, map, tap} from 'rxjs/operators';

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
  }

  getAll(): Observable<Movie[]> {
    return this.store.select(getAllMovies);
  }

  getByPath(path: string): Observable<Movie> {
    return this.store.select(getMovieByPath, path);
  }

  load(): Observable<Movie[]> {
    return this.dispatchActionObservable(
      new LoadMovies(),
      MoviesActionTypes.LoadMoviesSuccess,
      MoviesActionTypes.LoadMoviesError
    );
  }

}

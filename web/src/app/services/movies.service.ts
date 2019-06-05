import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {Movie} from '@app/models';
import {Store} from '@ngrx/store';
import {getAllMovies, getMovieById, State} from '@app/reducers';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {AddMovies, DeleteMovies, LoadMovies, MoviesActionTypes, UpdateMovies} from '@app/actions/movies.actions';
import {bufferTime, filter, tap} from 'rxjs/operators';
import {MovieDetails} from '@app/models/movie';

@Injectable()
export class MoviesService extends ServiceHelper {

  private subscriptions: Subscription[] = [];

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>, actions$: Actions
  ) {
    super(store, actions$);
  }

  init(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.push(
      this.socketClient.observe('MovieAdded').pipe(
        bufferTime(100, null, 15),
        filter(messages => messages.length > 0),
        tap((movies: Movie[]) => this.store.dispatch(new AddMovies(movies)))
      ).subscribe(),
      this.socketClient.observe('MovieUpdate').pipe(
        bufferTime(100, null, 15),
        filter(messages => messages.length > 0),
        tap((updates: MovieDetails[]) => this.store.dispatch(new UpdateMovies(updates)))
      ).subscribe(),
      this.socketClient.observe('MovieDeleted').pipe(
        bufferTime(100, null, 15),
        filter(messages => messages.length > 0),
        tap((ids: number[]) => this.store.dispatch(new DeleteMovies(ids)))
      ).subscribe()
    );
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

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Movie} from '@app/models';
import {Store} from '@ngrx/store';
import {State, getAllMovies, getMovieByPath} from '@app/reducers';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {LoadMovies, MoviesActionTypes} from '@app/actions/movies.actions';

@Injectable()
export class MoviesService extends ServiceHelper {

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>, actions$: Actions
  ) {
    super(store, actions$);

    /*this.socketClient.getSocket().pipe(
      filter(message => message.method === 'FileAdded'),
      map(message => message.entity),
      bufferTime(100, null, 15),
      filter(files => files.length > 0),
      tap(files => console.log(files)),
      tap((files: LibraryFile[]) => this.store.dispatch(new AddFiles(files)))
    ).subscribe();*/
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

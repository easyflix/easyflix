import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Show} from '@app/models/show';
import {Store} from '@ngrx/store';
import {State, getAllShows, getShowById} from '@app/reducers';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {AddShows, DeleteShows, LoadShows, ShowsActionTypes, UpdateShows} from '@app/actions/shows.actions';
import {bufferTime, filter, map, tap} from 'rxjs/operators';
import {ShowDetails} from '@app/models/show';

@Injectable()
export class ShowsService extends ServiceHelper {

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>, actions$: Actions
  ) {
    super(store, actions$);

    this.socketClient.getSocket().pipe(
      filter(message => message.method === 'ShowAdded'),
      map(message => message.entity),
      bufferTime(100, null, 15),
      filter(shows => shows.length > 0),
      // tap(movies => console.log(movies)),
      tap((shows: Show[]) => this.store.dispatch(new AddShows(shows)))
    ).subscribe();

    this.socketClient.getSocket().pipe(
      filter(message => message.method === 'ShowUpdate'),
      map(message => message.entity),
      bufferTime(100, null, 15),
      filter(updates => updates.length > 0),
      // tap(movies => console.log(movies)),
      tap((updates: ShowDetails[]) => this.store.dispatch(new UpdateShows(updates)))
    ).subscribe();

    this.socketClient.getSocket().pipe(
      filter(message => message.method === 'ShowDeleted'),
      map(message => message.entity),
      bufferTime(100, null, 15),
      filter(ids => ids.length > 0),
      // tap(movies => console.log(movies)),
      tap((ids: number[]) => this.store.dispatch(new DeleteShows(ids)))
    ).subscribe();

  }

  getAll(): Observable<Show[]> {
    return this.store.select(getAllShows);
  }

  getById(id: number): Observable<Show> {
    return this.store.select(getShowById, id);
  }

  load(): Observable<Show[]> {
    return this.dispatchActionObservable(
      new LoadShows(),
      ShowsActionTypes.LoadShowsSuccess,
      ShowsActionTypes.LoadShowsError
    );
  }

}

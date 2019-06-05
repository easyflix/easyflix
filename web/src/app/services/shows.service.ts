import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {Show, ShowDetails} from '@app/models/show';
import {Store} from '@ngrx/store';
import {getAllShows, getShowById, State} from '@app/reducers';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {AddShows, DeleteShows, LoadShows, ShowsActionTypes, UpdateShows} from '@app/actions/shows.actions';
import {bufferTime, filter, tap} from 'rxjs/operators';

@Injectable()
export class ShowsService extends ServiceHelper {

  private subscriptions: Subscription[] = [];

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>, actions$: Actions
  ) {
    super(store, actions$);
  }

  init() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.push(
      this.socketClient.observe('ShowAdded').pipe(
        bufferTime(100, null, 15),
        filter(shows => shows.length > 0),
        tap((shows: Show[]) => this.store.dispatch(new AddShows(shows)))
      ).subscribe(),
      this.socketClient.observe('ShowUpdate').pipe(
        bufferTime(100, null, 15),
        filter(updates => updates.length > 0),
        tap((updates: ShowDetails[]) => this.store.dispatch(new UpdateShows(updates)))
      ).subscribe(),
      this.socketClient.observe('ShowDeleted').pipe(
        bufferTime(100, null, 15),
        filter(updates => updates.length > 0),
        tap((ids: number[]) => this.store.dispatch(new DeleteShows(ids)))
      ).subscribe()
    );
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

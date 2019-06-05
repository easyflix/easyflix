import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {Library, LibraryFile} from '@app/models';
import {Store} from '@ngrx/store';
import {getAllLibraries, getLibrariesLoaded, getLibraryByName, State} from '@app/reducers';
import {
  AddLibrary,
  LibrariesActionTypes,
  LibraryUpdate,
  LoadLibraries,
  RemoveLibrary,
  ScanLibrary
} from '@app/actions/libraries.actions';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from '@app/services/service-helper';
import {SocketService} from '@app/services/socket.service';
import {tap} from 'rxjs/operators';

@Injectable()
export class LibrariesService extends ServiceHelper {

  private subscriptions: Subscription[] = [];

  constructor(
    private socket: SocketService,
    store: Store<State>,
    actions$: Actions
  ) {
    super(store, actions$);
  }

  init() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.push(
      this.socket.observe('LibraryUpdate').pipe(
        tap(update => this.store.dispatch(new LibraryUpdate(update)))
      ).subscribe()
    );
  }

  getAll(): Observable<Library[]> {
    return this.store.select(getAllLibraries);
  }

  getByName(name: string): Observable<Library> {
    return this.store.select(getLibraryByName, name);
  }

  load(): Observable<Library[]> {
    return this.dispatchActionObservable(
      new LoadLibraries(),
      LibrariesActionTypes.LoadLibrariesSuccess,
      LibrariesActionTypes.LoadLibrariesError
    );
  }

  add(library: Library): Observable<Library> {
    return this.dispatchActionObservable(
      new AddLibrary(library),
      LibrariesActionTypes.AddLibrarySuccess,
      LibrariesActionTypes.AddLibraryError
    );
  }

  remove(library: Library): Observable<string> {
    return this.dispatchActionObservable(
      new RemoveLibrary(library),
      LibrariesActionTypes.RemoveLibrarySuccess,
      LibrariesActionTypes.RemoveLibraryError
    );
  }

  scan(library: Library): Observable<LibraryFile[]> {
    return this.dispatchActionObservable(
      new ScanLibrary(library),
      LibrariesActionTypes.ScanLibrarySuccess,
      LibrariesActionTypes.ScanLibraryError
    );
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getLibrariesLoaded);
  }

}

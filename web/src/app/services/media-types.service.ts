import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {MediaType} from '@app/models';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {getAllMediaTypes, getMediaTypeBySubType, getMediaTypesLoaded, State} from '@app/reducers';
import {AddMediaType, LoadMediaTypes, MediaTypesActionTypes, RemoveMediaType} from '@app/actions/media-types.actions';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from '@app/services/service-helper';

@Injectable()
export class MediaTypesService extends ServiceHelper {

  constructor(private httpClient: HttpClient, store: Store<State>, actions$: Actions) {
    super(store, actions$);
  }

  load(): Observable<void> {
    return this.dispatchActionObservable(
      new LoadMediaTypes(),
      MediaTypesActionTypes.LoadMediaTypesSuccess,
      MediaTypesActionTypes.LoadMediaTypesError
    );
  }

  add(mediaType: MediaType): Observable<MediaType> {
    return this.dispatchActionObservable(
      new AddMediaType(mediaType),
      MediaTypesActionTypes.AddMediaTypeSuccess,
      MediaTypesActionTypes.AddMediaTypeError
    );
  }

  remove(subType: string): Observable<string> {
    return this.dispatchActionObservable(
      new RemoveMediaType(subType),
      MediaTypesActionTypes.RemoveMediaTypeSuccess,
      MediaTypesActionTypes.RemoveMediaTypeError
    );
  }

  getAll(): Observable<MediaType[]> {
    return this.store.select(getAllMediaTypes);
  }

  getBySubType(subType: string): Observable<MediaType> {
    return this.store.select(getMediaTypeBySubType, subType);
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getMediaTypesLoaded);
  }

}

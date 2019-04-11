import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {MediaType} from '@app/models/file';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {
  getAllMediaTypes,
  getMediaTypeBySubType,
  getMediaTypesAdding,
  getMediaTypesLoaded,
  getMediaTypesValidationError,
  State
} from '@app/reducers';
import {AddMediaType, LoadMediaTypes, RemoveMediaType} from '@app/actions/media-types.actions';
import {ValidationError} from '@app/models/validation-error';

@Injectable()
export class MediaTypesService {

  constructor(private httpClient: HttpClient, private store: Store<State>) {}

  load() {
    this.store.dispatch(new LoadMediaTypes());
  }

  getAll(): Observable<MediaType[]> {
    return this.store.select(getAllMediaTypes);
  }

  getBySubType(subType: string): Observable<MediaType> {
    return this.store.select(getMediaTypeBySubType, subType);
  }

  getValidationError(): Observable<ValidationError> {
    return this.store.select(getMediaTypesValidationError);
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getMediaTypesLoaded);
  }

  getAdding(): Observable<boolean> {
    return this.store.select(getMediaTypesAdding);
  }

  addMediaType(mediaType: MediaType) {
    this.store.dispatch(new AddMediaType(mediaType));
  }

  removeMediaType(subType: string) {
    this.store.dispatch(new RemoveMediaType(subType));
  }

}

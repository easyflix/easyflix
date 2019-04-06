import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {Folder, Library, LibraryFile} from '@app/models/file';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {getFilesOfFolder, State} from '@app/reducers';
import {LoadFiles} from '@app/actions/files.actions';

@Injectable()
export class FilesService {

  constructor(private httpClient: HttpClient, private store: Store<State>) {}

  getFilesOfFolder(folder: Folder | Library): Observable<LibraryFile[]> {
    return this.store.select(getFilesOfFolder, folder);
  }

  getLibraries(): Observable<Library[]> {
    return this.httpClient.get('http://localhost:8081/api/libraries').pipe(
      map(object => object as Array<Library>),
    );
  }

  loadFiles() {
    this.store.dispatch(new LoadFiles());
  }

}

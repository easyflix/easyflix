import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {File} from '@app/models/file';
import {Library} from '@app/models/library';

@Injectable()
export class FilesService {

  movies: Library = { path: '/f', name: 'Movies' };
  shows: Library = { path: '/s', name: 'TV Shows' };

  constructor() {}

  getFiles(): Observable<File[]> {
    return of([
      { path: '/test.mkv', isDirectory: false, size: 1, lastModified: new Date(), parent: this.movies },
      { path: '/test2', isDirectory: false, size: 1, lastModified: new Date(), parent: this.movies },
      { path: '/t3', isDirectory: true, lastModified: new Date(), parent: this.movies },
      { path: '/t3/test.mkv', isDirectory: false, size: 1, lastModified: new Date(), parent: '/t3' },
      { path: '/t4', isDirectory: false, size: 1, lastModified: new Date(), parent: this.movies },
    ]);
  }

  getLibraries(): Observable<Library[]> {
    return of([
      this.movies,
      this.shows,
    ]);
  }

}

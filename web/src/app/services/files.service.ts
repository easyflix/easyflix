import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {File} from '@app/models/file';
import {Library} from '@app/models/library';
import {map} from 'rxjs/operators';
import {Folder} from '@app/models/folder';

@Injectable()
export class FilesService {

  movies: Library = { path: '/f', name: 'Movies' };
  shows: Library = { path: '/f/s', name: 'TV Shows' };

  files: File[] = [
    { path: '/f/movie1.mkv', parent: '/f', isDirectory: false, size: 1 },
    { path: '/f/movie2.mkv', parent: '/f', isDirectory: false, size: 1 },
    { path: '/f/subfolder', parent: '/f', isDirectory: true },
    { path: '/f/subfolder/sub-movie1.mkv', parent: '/f/subfolder', isDirectory: false },
    { path: '/f/subfolder/sub-movie2.mkv', parent: '/f/subfolder', isDirectory: false },
    { path: '/f/s', parent: '/f', isDirectory: true },
    { path: '/f/s/sub', parent: '/f/s', isDirectory: true },
    { path: '/f/s/sub/test.mkv', parent: '/f/s/sub', isDirectory: false, size: 1 },
    { path: '/f/s/show1.mkv', parent: '/f/s', isDirectory: false, size: 1 },
    { path: '/f/s/show2.mkv', parent: '/f/s', isDirectory: false, size: 1 },
  ];

  constructor() {}

  getFiles(folder: Folder): Observable<File[]> {
    return of(this.files).pipe(
      map(files => files.filter(file => file.parent === folder.path))
    );
  }

  getLibraries(): Observable<Library[]> {
    return of([
      this.movies,
      this.shows,
    ]);
  }

}

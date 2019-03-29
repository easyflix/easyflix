import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {File, Folder, Library} from '@app/models/file';

@Injectable()
export class FilesService {

  movies: Library = { type: 'library', path: '/f', name: 'Movies', numberOfVideos: 7 };
  shows: Library = { type: 'library', path: '/f/s', name: 'TV Shows', numberOfVideos: 3 };

  testUrl = 'http://127.0.0.1:8887/Captain.Fantastic.2016.1080p.BluRay.6CH.ShAaNiG.mkv?static=1';

  files: File[] = [
    { path: '/f/movie2.mkv', name: 'movie2.mkv', parent: '/f', type: 'file', size: 1, url: 'http://127.0.0.1:8887/Assassins.Creed.2016.1080p.BluRay.x265.ShAaNiG.mkv?static=1' },
    { path: '/f/movie1.mkv', name: 'movie1.mkv', parent: '/f', type: 'file', size: 1, url: 'http://127.0.0.1:8887/Alice%20Au%20Pays%20Des%20Merveilles%20-%20Multi%20-%201080p%20mHDgz.mkv?static=1' },
    { path: '/f/subfolder', name: 'subfolder', parent: '/f', type: 'folder', numberOfVideos: 2 },
    { path: '/f/subfolder/sub-movie1.mkv', name: 'sub-movie1.mkv', parent: '/f/subfolder', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/subfolder/sub-movie2.mkv', name: 'sub-movie2.mkv', parent: '/f/subfolder', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s/sub', name: 'sub', parent: '/f/s', type: 'folder', numberOfVideos: 1 },
    { path: '/f/s/sub/test.mkv', name: 'test.mkv', parent: '/f/s/sub', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s/show1.mkv', name: 'show1.mkv', parent: '/f/s', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s/show2.mkv', name: 'show2.mkv', parent: '/f/s', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s', name: 's', parent: '/f', type: 'folder', numberOfVideos: 3 },
  ];

  constructor() {}

  getFiles(folder: Folder): Observable<File[]> {
    return of(this.files).pipe(
      map(files => files.filter(file => file.parent === folder.path)),
      map(files => files.sort((a, b) => a.path.localeCompare(b.path))),
      /*map(files => files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') {
          return -1;
        }
        if (a.type !== 'directory' && b.type === 'directory') {
          return 1;
        }
        return 0;
      }))*/
    );
  }

  getLibraries(): Observable<Library[]> {
    return of([
      this.movies,
      this.shows,
    ]);
  }

}

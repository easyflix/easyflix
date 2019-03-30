import {Component, ElementRef, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {FilesService} from '@app/services/files.service';
import {Folder, URLFile} from '@app/models/file';
import {VideoService} from '@app/services/video.service';
import {Router} from '@angular/router';
import {Focusable} from '@app/components/library/library.component';

@Component({
  selector: 'app-folder',
  template: `
    <mat-action-list dense>
      <button mat-list-item (click)='prev.emit()' #back>
        <mat-icon matListIcon class="back-icon">chevron_left</mat-icon>
        <p matLine>Back</p>
        <p matLine></p>
        <mat-divider></mat-divider>
      </button>
      <ng-template ngFor let-file [ngForOf]='folders$ | async'>
        <mat-list-item tabindex='0'
                       (click)='next.emit(file)'
                       (keyup.space)='next.emit(file)'
                       (keyup.enter)='next.emit(file)'>
          <mat-icon matListIcon>
            folder
          </mat-icon>
          <h3 matLine>{{ file.name }}</h3>
          <p matLine>
            <span>{{ file.numberOfVideos }} videos</span>
          </p>
          <mat-icon>chevron_right</mat-icon>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-template>
      <ng-template ngFor let-file [ngForOf]='files$ | async'>
        <mat-list-item tabindex='0'
                       (click)='playFile(file)'>
          <mat-icon matListIcon class='material-icons-outlined'>
            movie
          </mat-icon>
          <h3 matLine>{{ file.name }}</h3>
          <p matLine>
            <span>{{ file.size }} ko : {{ file.url }}</span>
          </p>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-template>
    </mat-action-list>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      min-width: 50%;
      display: flex;
      flex-direction: column;
    }
    mat-action-list {
      padding: 0 !important;
      flex-grow: 1;
      overflow-y: auto
    }
    mat-list-item {
      cursor: pointer;
    }
    .back-icon {
      width: 24px !important;
      height: 24px !important;
      font-size: 24px !important;
      padding: 2px !important;
    }
  `]
})
export class FileListComponent implements OnInit, Focusable {

  next: EventEmitter<Folder> = new EventEmitter();
  prev: EventEmitter<void> = new EventEmitter();

  folders$: Observable<Folder[]>;
  files$: Observable<URLFile[]>;
  current: Folder;

  @ViewChild('back', { read: ElementRef })
  back: ElementRef;

  constructor(
    private filesService: FilesService,
    private video: VideoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.files$ = this.filesService.getFiles(this.current).pipe(
      map(files => files.filter(f => f.type === 'file') as URLFile[])
    );
    this.folders$ = this.filesService.getFiles(this.current).pipe(
      map(files => files.filter(f => f.type === 'folder') as Folder[])
    );
  }

  playFile(file: URLFile) {
    this.router.navigate(['/player']).then(
      () => this.video.setSource(file.url)
    );
  }

  focus() {
    const back = this.back.nativeElement as HTMLElement;
    const first = back.nextElementSibling as HTMLElement;
    if (first) { first.focus(); }
  }

}

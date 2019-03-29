import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {FilesService} from '@app/services/files.service';
import {File, Folder} from '@app/models/file';

@Component({
  selector: 'app-folder',
  template: `
    <mat-action-list dense>
      <button mat-list-item (click)="prev.emit()" #back>
        <mat-icon matListIcon>chevron_left</mat-icon>
        <p matLine>Back</p>
        <p matLine></p>
        <mat-divider></mat-divider>
      </button>
      <ng-template ngFor let-file [ngForOf]="folders$ | async">
        <mat-list-item tabindex="0"
                       (click)="next.emit(file)"
                       (keyup.space)="next.emit(file)"
                       (keyup.enter)="next.emit(file)">
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
      <ng-template ngFor let-file [ngForOf]="files$ | async">
        <mat-list-item tabindex="0">
          <mat-icon matListIcon class="material-icons-outlined">
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
    .back {
      min-height: 60px;
      display: flex !important;
      flex-direction: row;
      align-items: center;
      cursor: pointer;
      font-size: 12px;
    }
    .back button {
      margin: 0 0.6rem;
    }
  `]
})
export class FileListComponent implements OnInit {

  next: EventEmitter<Folder> = new EventEmitter();
  prev: EventEmitter<void> = new EventEmitter();

  folders$: Observable<Folder[]>;
  files$: Observable<File[]>;
  current: Folder;

  @ViewChild('back')
  back: MatButton;

  constructor(private filesService: FilesService) {
  }

  ngOnInit() {
    this.files$ = this.filesService.getFiles(this.current).pipe(
      map(files => files.filter(f => f.type === 'file'))
    );
    this.folders$ = this.filesService.getFiles(this.current).pipe(
      map(files => files.filter(f => f.type === 'folder') as Folder[])
    );
  }

  focus() {
    this.back._elementRef.nativeElement.focus();
  }

}

import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {FilesService} from '../../services/files.service';
import {File, Folder} from '../../models/file';

@Component({
  selector: 'app-folder',
  template: `
    <div (click)="prev.emit()" class="back">
      <button mat-icon-button (click)="prev.emit(); $event.stopPropagation()" #back>
        <mat-icon>chevron_left</mat-icon>
      </button>
      <span>..</span>
    </div>
    <mat-divider></mat-divider>
    <mat-list dense>
      <ng-template ngFor let-file [ngForOf]="folders$ | async">
        <mat-list-item (click)="next.emit(file)">
          <mat-icon matListIcon>
            folder
          </mat-icon>
          <h3 matLine>{{ file.name }}</h3>
          <p matLine>
            <span>{{ file.numberOfVideos }} videos</span>
          </p>
          <button mat-icon-button (click)="next.emit(file); $event.stopPropagation()">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-template>
      <ng-template ngFor let-file [ngForOf]="files$ | async">
        <mat-list-item>
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
    </mat-list>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      min-width: 50%;
      display: flex;
      flex-direction: column;
    }
    mat-list {
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
      cursor: pointer
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

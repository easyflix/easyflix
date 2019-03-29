import {Component, EventEmitter, OnInit} from '@angular/core';
import {Observable} from 'rxjs';

import {FilesService} from '@app/services/files.service';
import {Library} from '@app/models/file';

@Component({
  selector: 'app-libraries-view',
  template: `
    <mat-action-list dense>
      <ng-template ngFor let-library [ngForOf]="libraries$ | async">
        <mat-list-item tabindex="0"
                       (click)="openLibrary.emit(library)"
                       (keyup.space)="openLibrary.emit(library)"
                       (keyup.enter)="openLibrary.emit(library)">
          <mat-icon matListIcon>
            video_library
          </mat-icon>
          <h3 matLine>{{ library.name }}</h3>
          <p matLine>
            <span>{{ library.numberOfVideos }} videos</span>
          </p>
          <mat-icon>chevron_right</mat-icon>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-template>
      <mat-list-item tabindex="0">
        <mat-icon matListIcon>
          library_add
        </mat-icon>
        <h3 matLine>Add a library</h3>
        <p matLine></p>
        <mat-divider></mat-divider>
      </mat-list-item>
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
  `]
})
export class LibraryListComponent implements OnInit {

  libraries$: Observable<Library[]>;

  openLibrary: EventEmitter<Library> = new EventEmitter();

  constructor(private filesService: FilesService) {
    this.libraries$ = this.filesService.getLibraries();
  }

  ngOnInit() {
  }

}

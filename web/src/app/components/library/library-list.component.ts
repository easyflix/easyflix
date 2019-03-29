import {Component, EventEmitter, OnInit} from '@angular/core';
import {FilesService} from '../../services/files.service';
import {Observable} from 'rxjs';
import {Library} from '../../models/file';

@Component({
  selector: 'app-libraries-view',
  template: `
    <mat-list dense>
      <ng-template ngFor let-library [ngForOf]="libraries$ | async">
        <mat-list-item (click)="openLibrary.emit(library)">
          <mat-icon matListIcon>
            video_library
          </mat-icon>
          <h3 matLine>{{ library.name }}</h3>
          <p matLine>
            <span>{{ library.numberOfVideos }} videos</span>
          </p>
          <button mat-icon-button (click)="openLibrary.emit(library); $event.stopPropagation()">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-template>
      <mat-list-item>
        <mat-icon matListIcon>
          library_add
        </mat-icon>
        <h3 matLine>Add a library</h3>
        <p matLine></p>
        <mat-divider></mat-divider>
      </mat-list-item>
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

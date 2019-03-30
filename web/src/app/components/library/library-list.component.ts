import {Component, ElementRef, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';

import {FilesService} from '@app/services/files.service';
import {Library} from '@app/models/file';
import {Focusable} from '@app/components/library/library.component';

@Component({
  selector: 'app-libraries-view',
  template: `
    <header>
      <h2>Video Libraries</h2>
    </header>
    <mat-divider></mat-divider>
    <mat-action-list dense #matList>
      <ng-template ngFor let-library [ngForOf]="libraries$ | async">
        <mat-list-item tabindex="0"
                       (click)="openLibrary.emit(library)"
                       (keyup.space)="openLibrary.emit(library)"
                       (keyup.enter)="openLibrary.emit(library)"
                       (keyup.arrowright)="openLibrary.emit(library)"
                       (keyup.arrowdown)="focusNext($event)"
                       (keyup.arrowup)="focusPrev($event)">
          <mat-icon matListIcon class="material-icons-outlined">
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
      <mat-list-item tabindex="0"
                     (keyup.arrowdown)="focusNext($event)"
                     (keyup.arrowup)="focusPrev($event)">
        <mat-icon matListIcon class="material-icons-outlined">
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
    h2 {
      height: 59px;
      font-size: 18px;
      margin: 0 0 0 1.25rem;
      display: flex;
      align-items: center;
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
export class LibraryListComponent implements OnInit, Focusable {

  libraries$: Observable<Library[]>;

  openLibrary: EventEmitter<Library> = new EventEmitter();

  @ViewChild('matList', { read: ElementRef })
  matList: ElementRef;

  constructor(private filesService: FilesService) {
    this.libraries$ = this.filesService.getLibraries();
  }

  ngOnInit() {
  }

  focus() {
    setTimeout(() => this.matList.nativeElement.children[0].focus(), 0);
  }

  focusNext(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const next = target.nextElementSibling as HTMLElement;
    if (next) {
      next.focus();
    } else {
      const first = target.parentElement.children[0] as HTMLElement;
      first.focus();
    }
  }

  focusPrev(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const prev = target.previousElementSibling as HTMLElement;
    if (prev) {
      prev.focus();
    } else {
      const last = target.parentElement.children[target.parentElement.children.length - 1] as HTMLElement;
      last.focus();
    }
  }

}

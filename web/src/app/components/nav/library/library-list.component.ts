import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Library} from '@app/models';
import {AnimatableComponent} from '@app/components/nav/library/library.component';
import {LibrariesService} from '@app/services/libraries.service';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {LibraryCreationDialogComponent} from '@app/components/dialogs/library-creation-dialog/library-creation-dialog.component';
import {FilesService} from '@app/services/files.service';
import {FTPLibrary, LocalLibrary, S3Library} from '@app/models/library';
import {ConfirmDialogComponent} from '@app/components/dialogs/confirm-dialog.component';

@Component({
  selector: 'app-libraries-view',
  template: `
    <mat-action-list>

      <ng-container *ngIf="(localLibraries$ | async).length > 0">
        <h3 matSubheader>Local</h3>
        <mat-divider></mat-divider>
        <mat-list-item tabindex="0" *ngFor="let library of localLibraries$ | async" (click)="openLibrary.emit(library)">
          <mat-icon matListIcon>video_library</mat-icon>
          <h4 matLine>{{ library.name }}</h4>
          <p matLine class="subtext">{{ library.path }}</p>
          <mat-progress-bar mode="determinate"
                            [value]="getSpace(library)"
                            [color]="getSpace(library) > 95 ? 'warn' : 'accent'"
                            class="mat-elevation-z4">
          </mat-progress-bar>
          <p class="videos" *ngIf="getLibraryVideoCount(library) | async; let count">
            {count, plural,
              =0 {No video}
              =1 {1 video}
              other {{{count}} videos}}
          </p>
          <button mat-mini-fab color="primary" *ngIf="!library.scanning" (click)="scanLibrary(library); $event.stopPropagation()">
            <mat-icon>refresh</mat-icon>
          </button>
          <mat-spinner diameter="40" *ngIf="library.scanning"></mat-spinner>
          <button mat-mini-fab color="warn" (click)="removeLibrary(library); $event.stopPropagation()">
            <mat-icon>close</mat-icon>
          </button>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-container>

      <ng-container *ngIf="(ftpLibraries$ | async).length > 0">
        <h3 matSubheader>FTP</h3>
        <mat-divider></mat-divider>
        <mat-list-item tabindex="0" *ngFor="let library of ftpLibraries$ | async" (click)="openLibrary.emit(library)">
          <mat-icon matListIcon>video_library</mat-icon>
          <h4 matLine>{{ library.name }}</h4>
          <p matLine class="subtext">{{library.username}}@{{library.hostname}}:{{library.port}}/{{library.path}}</p>
          <p class="videos" *ngIf="getLibraryVideoCount(library)  | async; let count">
            {count, plural,
              =0 {No video}
              =1 {1 video}
              other {{{count}} videos}}
          </p>
          <button mat-mini-fab color="primary" *ngIf="!library.scanning" (click)="scanLibrary(library); $event.stopPropagation()">
            <mat-icon>refresh</mat-icon>
          </button>
          <mat-spinner diameter="40" *ngIf="library.scanning"></mat-spinner>
          <button mat-mini-fab color="warn" (click)="removeLibrary(library); $event.stopPropagation()">
            <mat-icon>close</mat-icon>
          </button>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-container>

      <ng-container *ngIf="(s3Libraries$ | async).length > 0">
        <h3 matSubheader>S3</h3>
        <mat-divider></mat-divider>
        <mat-list-item tabindex="0" *ngFor="let library of s3Libraries$ | async" (click)="openLibrary.emit(library)">
          <mat-icon matListIcon>video_library</mat-icon>
          <h4 matLine>{{ library.name }}</h4>
          <p matLine class="subtext">{{library.bucket}}@{{library.region}}/{{library.path}}</p>
          <p class="videos" *ngIf="getLibraryVideoCount(library)  | async; let count">
            {count, plural,
              =0 {No video}
              =1 {1 video}
              other {{{count}} videos}}
          </p>
          <button mat-mini-fab color="primary" *ngIf="!library.scanning" (click)="scanLibrary(library); $event.stopPropagation()">
            <mat-icon>refresh</mat-icon>
          </button>
          <mat-spinner diameter="40" *ngIf="library.scanning"></mat-spinner>
          <button mat-mini-fab color="warn" (click)="removeLibrary(library); $event.stopPropagation()">
            <mat-icon>close</mat-icon>
          </button>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-container>

      <!--<h3 matSubheader>S3</h3>
      <mat-divider></mat-divider>
      <mat-list-item>
        <mat-icon matListIcon>video_library</mat-icon>
        <h4 matLine>Note</h4>
        <p matLine class="subtext"> Date </p>
        <button mat-mini-fab color="primary">
          <mat-icon>refresh</mat-icon>
        </button>
        <button mat-mini-fab color="warn">
          <mat-icon>close</mat-icon>
        </button>
      </mat-list-item>
      <mat-divider></mat-divider>-->
    </mat-action-list>

    <p class="add">
      <button mat-button mat-raised-button color="primary" (click)="openLibraryCreationDialog()">
        <mat-icon>library_add</mat-icon>
        Add a library
      </button>
    </p>

    <!--<mat-action-list dense #matList>
      <ng-template ngFor let-library [ngForOf]="libraries$ | async">
        <mat-list-item tabindex="0"
                       (click)="openLibrary.emit(library)"
                       (keyup.space)="openLibrary.emit(library)"
                       (keyup.enter)="openLibrary.emit(library)"
                       (keyup.arrowright)="openLibrary.emit(library)"
                       (keyup.arrowdown)="focusNext($event)"
                       (keyup.arrowup)="focusPrev($event)">
          <mat-icon matListIcon>
            video_library
          </mat-icon>
          <h3 matLine>{{ library.name }}</h3>
          <p matLine class="subtext">
            {getLibraryVideoCount(library) | async, plural,
              =0 {No video}
              =1 {1 video}
              other {{{getLibraryVideoCount(library) | async}} videos}
            }
          </p>
          <mat-icon>chevron_right</mat-icon>
          <mat-divider></mat-divider>
        </mat-list-item>
      </ng-template>
      <mat-list-item tabindex="0"
                     (keyup.arrowdown)="focusNext($event)"
                     (keyup.arrowup)="focusPrev($event)"
                     (click)="openLibraryCreationDialog()">
        <mat-icon matListIcon>
          library_add
        </mat-icon>
        <h3 matLine>Add a library</h3>
        <p matLine></p>
        <mat-divider></mat-divider>
      </mat-list-item>
    </mat-action-list>-->
  `,
  styles: [`
    :host {
      flex-grow: 1;
      min-width: 50%;
      display: flex;
      flex-direction: column;
    }
    mat-action-list {
      margin: 0.5rem 0 0 0;
      padding: 0;
    }
    mat-action-list button {
      margin-left: 1rem;
    }
    h3 {
      padding: 1rem 1.25rem;
    }
    mat-list-item {
      font-size: 14px !important;
    }
    mat-progress-bar {
      margin: 0 1rem 0 0;
      height: 12px;
    }
    mat-spinner {
      min-width: 40px;
      margin-left: 1rem;
    }
    .subtext {
      margin-top: 0.25rem !important;
      font-size: 11px !important;
    }
    .videos {
      white-space: nowrap;
      min-width: 70px;
      text-align: right;
    }
    .add {
      text-align: left;
      padding: 0 1rem;
    }
    .add button {
      padding-left: 0.5rem;
    }
    .add mat-icon {
      margin-right: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryListComponent implements OnInit, AnimatableComponent {

  localLibraries$: Observable<LocalLibrary[]>;
  ftpLibraries$: Observable<FTPLibrary[]>;
  s3Libraries$: Observable<S3Library[]>;

  openLibrary: EventEmitter<Library> = new EventEmitter();

  @ViewChild('matList', { read: ElementRef, static: false })
  matList: ElementRef;

  constructor(
    private libraries: LibrariesService,
    private files: FilesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {

  }

  ngOnInit() {

    this.localLibraries$ = this.libraries.getAll().pipe(
      map(libs => libs.filter(lib => lib.type === 'local') as LocalLibrary[])
    );
    this.ftpLibraries$ = this.libraries.getAll().pipe(
      map(libs => libs.filter(lib => lib.type === 'ftp') as FTPLibrary[])
    );
    this.s3Libraries$ = this.libraries.getAll().pipe(
      map(libs => libs.filter(lib => lib.type === 's3') as S3Library[])
    );
    // setTimeout(() => this.openLibraryCreationDialog());
  }

  beforeAnimation() {}

  afterAnimation() {
    // setTimeout(() => this.matList.nativeElement.children[0].focus(), 0);
  }

  /*focusNext(event: KeyboardEvent) {
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
  }*/

  openLibraryCreationDialog() {
    const dialogRef =
      this.dialog.open(
        LibraryCreationDialogComponent,
        { minWidth: '500px', width: '80%', maxWidth: '1000px', disableClose: true }
      );

    // dialogRef.afterClosed().subscribe(() => {});
  }

  getLibraryVideoCount(library: Library): Observable<string> {
    return this.files.getLibraryCount(library).pipe(map(n => n.toString()));
  }

  scanLibrary(library: Library) {
    this.libraries.scan(library).subscribe(
      files => this.snack.open(
        'Scan complete. Found ' + files.filter(f => !f.isDirectory).length + ' videos.',
        'OK',
        { duration: 4000 }
      )
    );
  }

  removeLibrary(library: Library) {
    const dialogRef =
      this.dialog.open(
        ConfirmDialogComponent,
        { data: { title: 'Please confirm', message: 'Are you sure that you want to delete the library \'' + library.name + '\'?' } }
      );

    dialogRef.afterClosed().pipe(
      switchMap(confirmed => {
        if (confirmed) {
          return this.libraries.remove(library);
        } else {
          return EMPTY;
        }
      })
    ).subscribe();

  }

  getSpace(library: LocalLibrary): number {
    return (library.totalSpace - library.freeSpace) / library.totalSpace * 100;
  }

}

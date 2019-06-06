import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Observable} from 'rxjs';

import {FilesService} from '@app/services/files.service';
import {LibraryFile} from '@app/models';
import {VideoService} from '@app/services/video.service';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-file-list',
  template: `
    <h4 class="path">
      {{ currentFolder.path }}
    </h4>
    <mat-divider></mat-divider>
    <mat-action-list dense class="back">
      <button mat-list-item (click)='prev.emit()' #back>
        <mat-icon matListIcon class="back-icon">chevron_left</mat-icon>
        <p matLine>Back</p>
        <p matLine></p>
        <mat-divider></mat-divider>
      </button>
    </mat-action-list>
    <cdk-virtual-scroll-viewport itemSize="60" #scrollable [minBufferPx]="800" [maxBufferPx]="1000">
      <mat-action-list dense class="files">
        <ng-template cdkVirtualFor let-file [cdkVirtualForOf]='files$ | async'>
          <mat-list-item tabindex='0'
                         *ngIf="file.isDirectory === true"
                         (click)='next.emit(file)'
                         (keyup.space)='next.emit(file)'
                         (keyup.enter)='next.emit(file)'>
            <mat-icon matListIcon>
              folder
            </mat-icon>
            <h3 matLine>{{ file.name }}</h3>
            <span matLine class="subtext" i18n>
              {getFolderCount(file) | async, plural,
                =0 {No video}
                =1 {1 video}
                other {{{getFolderCount(file) | async}} videos}
              }
            </span>
            <mat-icon>chevron_right</mat-icon>
            <mat-divider></mat-divider>
          </mat-list-item>
          <mat-list-item tabindex='0'
                         *ngIf="file.isDirectory === false"
                         (click)='playVideo(file)'>
            <mat-icon matListIcon class='material-icons-outlined'>
              movie
            </mat-icon>
            <h3 matLine>{{ file.name }}</h3>
            <span matLine class="subtext">{{ file.size | sgFileSize }}</span>
            <mat-divider></mat-divider>
          </mat-list-item>
        </ng-template>
      </mat-action-list>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      min-width: 50%;
      display: flex;
      flex-direction: column;
    }
    .path {
      margin: 0;
      height: 48px;
      box-sizing: border-box;
      line-height: 16px;
      font-size: 14px;
      font-weight: 500;
      padding: 1rem 1.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    cdk-virtual-scroll-viewport {
      flex-grow: 1;
      width: 100%;
    }
    .back {
      padding: 0 !important;
    }
    .files {
      padding: 0 !important;
      /* overflow-y: auto */
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
    .subtext {
      margin-top: 0.25rem !important;
      font-size: 11px !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileListComponent implements OnInit {

  @Input()
  currentFolder: LibraryFile;

  @Output()
  next: EventEmitter<LibraryFile> = new EventEmitter();

  @Output()
  prev: EventEmitter<void> = new EventEmitter();

  files$: Observable<LibraryFile[]>;

  @ViewChild('back', { read: ElementRef, static: true })
  back: ElementRef;

  @ViewChild('scrollable', { read: ElementRef, static: true })
  scrollable: ElementRef;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService
  ) {}

  ngOnInit() {
    this.files$ = this.files.getFilesOfFolder(this.currentFolder);
  }

  playVideo(video: LibraryFile) {
    this.core.closeSidenav();
    setTimeout(() => this.video.playVideo(video));
  }

  getFolderCount(folder: LibraryFile): Observable<number> {
    return this.files.getFolderCount(folder);
  }

}

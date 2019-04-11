import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';

import {FilesService} from '@app/services/files.service';
import {Folder, Library, LibraryFile, Video} from '@app/models/file';
import {VideoService} from '@app/services/video.service';
import {AnimatableComponent} from '@app/components/library/library.component';

@Component({
  selector: 'app-folder',
  template: `
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
                         *ngIf="file.type === 'folder'"
                         (click)='next.emit(file)'
                         (keyup.space)='next.emit(file)'
                         (keyup.enter)='next.emit(file)'>
            <mat-icon matListIcon>
              folder
            </mat-icon>
            <h3 matLine>{{ file.name }}</h3>
            <span matLine class="subtext" i18n>
              {file.numberOfVideos, plural, =0 {No video} =1 {1 video} other {{{file.numberOfVideos}} videos}}
            </span>
            <mat-icon>chevron_right</mat-icon>
            <mat-divider></mat-divider>
          </mat-list-item>
          <mat-list-item tabindex='0'
                         *ngIf="file.type === 'video'"
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
export class FileListComponent implements OnInit, AnimatableComponent {

  next: EventEmitter<Folder> = new EventEmitter();
  prev: EventEmitter<void> = new EventEmitter();

  files$: Observable<LibraryFile[]>;
  currentFolder: Folder | Library;

  @ViewChild('back', { read: ElementRef })
  back: ElementRef;

  @ViewChild('scrollable', { read: ElementRef })
  scrollable: ElementRef;

  constructor(
    private filesService: FilesService,
    private video: VideoService
  ) {}

  ngOnInit() {
    this.files$ = this.filesService.getFilesOfFolder(this.currentFolder);
  }

  playVideo(video: Video) {
    this.video.playVideo(video);
  }

  beforeAnimation() {
    const container = this.scrollable.nativeElement as HTMLElement;
    // wake up cdk-virtual-scroll (uses polyfill)
    container.scrollTo(0, 1);
    container.scrollTo(0, 0);
  }

  afterAnimation() {
/*    const container = this.scrollable.nativeElement as HTMLElement;
    // wake up cdk-virtual-scroll (uses polyfill)
    container.scrollTo(0, 1);
    container.scrollTo(0, 0);*/
  /*    const back = this.back.nativeElement as HTMLElement;
      const container = this.scrollable.nativeElement as HTMLElement;
      /!*const first = back.nextElementSibling as HTMLElement;
      if (first) { first.focus(); }*!/
      // back.focus();
      console.log(container.children[0]);
      (container.children[0] as HTMLElement).translate = false;
      container.scrollBy(0, 1);*/
    // setTimeout(() => back.focus(), 0);
  }

/*  getCurrentPath() {
    switch (this.currentFolder.type) {
      case 'library': return this.currentFolder.name;
      case 'folder': return this.currentFolder.parent + this.currentFolder.name;
    }
  }*/

}

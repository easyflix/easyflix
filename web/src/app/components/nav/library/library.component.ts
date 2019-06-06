import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Library, LibraryFile} from '@app/models';
import {ActivatedRoute, Router} from '@angular/router';
import {first, tap} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';
import {combineLatest} from 'rxjs';
import {transition, trigger} from '@angular/animations';
import {debugAnimation, slideLeft, slideRight} from '@app/animations';

export function isNext(from, to) {
  return to.startsWith('next');
}

export function isPrev(from, to) {
  return to.startsWith('prev');
}

@Component({
  selector: 'app-library',
  template: `
    <header>
      <h2>Video Libraries</h2>
    </header>
    <mat-divider></mat-divider>
    <div class='content' [@foldersAnimation]="getAnimation()">
      <app-library-list *ngIf="currentFolder === null" (openLibrary)="openLibrary($event)"></app-library-list>
      <ng-container *ngFor="let folder of openFolders">
        <app-file-list *ngIf="currentFolder === folder"
                       [currentFolder]="folder"
                       (next)="openFolder($event)"
                       (prev)="closeCurrentFolder()">
        </app-file-list>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow-x: hidden
    }
    header {
      height: 59px;
      min-height: 59px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
    }
    h2 {
      margin: 0;
      font-size: 18px;
      white-space: nowrap;
    }
    .content {
      overflow-y: auto;
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      position: relative;
    }
  `],
  animations: [trigger('foldersAnimation', [
    // transition(debugAnimation('folders'), []),
    transition('void => *', []),
    transition(isNext, slideLeft),
    transition(isPrev, slideRight),
  ])],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryComponent implements OnInit {

  currentFolder: LibraryFile = null;
  openFolders: LibraryFile[] = [];
  animateNext = true;

  constructor(
    private files: FilesService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const path = this.route.snapshot.queryParamMap.get('path');
    const ids = path ? path.split(':') : [];
    combineLatest(ids.map(id => this.files.getById(id).pipe(first(f => !!f)))).pipe(
      tap(folders => {
        this.openFolders = folders;
        this.currentFolder = folders[folders.length - 1];
      })
    ).subscribe();
  }

  openLibrary(library: Library): void {
    this.files.getByPath(library.name).pipe(
      first(file => !!file),
    ).subscribe(folder => {
      this.animateNext = true;
      this.openFolders.push(folder);
      this.currentFolder = folder;
      this.navigate();
    });
  }

  openFolder(file: LibraryFile): void {
    this.files.getById(file.id).pipe(
      first(folder => !!folder)
    ).subscribe(folder => {
      this.animateNext = true;
      this.openFolders.push(folder);
      this.currentFolder = folder;
      this.navigate();
    });
  }

  closeCurrentFolder(): void {
    this.animateNext = false;
    this.openFolders.pop();
    this.currentFolder = this.openFolders[this.openFolders.length - 1] || null;
    this.navigate();
  }

  navigate() {
    const id = this.openFolders.length === 0 ?
      null : this.openFolders.map(f => f.id).reduce((a, b) => `${a}:${b}`);
    this.router.navigate(
      [],
      { queryParams: { path: id }, queryParamsHandling: 'merge', replaceUrl: true }
    );
  }

  getAnimation(): string {
    return (this.animateNext ? 'next-' : 'prev-') + (this.currentFolder && this.currentFolder.id || 'void');
  }

}

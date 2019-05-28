import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FilesService} from '@app/services/files.service';
import {Observable, of, Subject, Subscription} from 'rxjs';
import {LibraryFile} from '@app/models';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {VideoService} from '@app/services/video.service';
import {FilesUtils} from '@app/utils/files.utils';

@Component({
  selector: 'app-search',
  template: `
    <header>
      <h2>Search</h2>
    </header>
    <mat-divider></mat-divider>
    <div class="search-container">
      <mat-form-field [floatLabel]="'never'">
        <mat-label>File path, name, extension</mat-label>
        <input matInput
               name="webflix-search"
               [(ngModel)]="search"
               spellcheck="false"/>
        <mat-icon class="close" matSuffix (click)="search = ''" *ngIf="search !== ''">close</mat-icon>
      </mat-form-field>
      <span class="results">{{ (files$ | async)?.length || 0 }} results</span>
    </div>
    <mat-divider></mat-divider>
    <cdk-virtual-scroll-viewport itemSize="60" [minBufferPx]="800" [maxBufferPx]="1000">
      <mat-action-list dense>
        <ng-template cdkVirtualFor let-file [cdkVirtualForOf]='files$ | async'>
          <mat-list-item tabindex='0' (click)="playVideo(file)">
            <mat-icon matListIcon class='material-icons-outlined'>
              movie
            </mat-icon>
            <h3 matLine [innerHTML]="file.name | sgSearchTerms:searchTerms"></h3>
            <span matLine class="subtext" [innerHTML]="getParentPath(file) | sgSearchTerms:searchTerms"></span>
            <mat-divider></mat-divider>
          </mat-list-item>
        </ng-template>
      </mat-action-list>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    header {
      height: 59px;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
    }
    h2 {
      margin: 0 1.25rem 0 0;
      font-size: 18px;
      font-weight: 500;
    }
    .search-container {
      height: 59px;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
    }
    cdk-virtual-scroll-viewport {
      flex-grow: 1;
    }
    mat-form-field {
      flex-grow: 1;
      margin: 0 1.25rem 0 0;
      height: 59px;
    }
    .close {
      font-size: 16px;
      height: 16px;
      width: 16px;
      line-height: 16px;
      vertical-align: middle;
      cursor: pointer;
    }
    .results {
      min-width: 70px;
      text-align: right;
      font-size: 14px;
    }
    mat-action-list[dense] {
      padding: 0;
    }
    .subtext {
      margin-top: 0.25rem !important;
      font-size: 11px !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {

  files$: Observable<LibraryFile[]>;

  private searchVar = '';
  get search() {
    return this.searchVar;
  }
  set search(val: string) {
    this.searchVar = val;
    this.searchTerms = val.trim().replace(/[ ]+/g, ' ').split(' ').filter(s => s !== '');
    this.searchSubject.next(this.searchTerms);
  }

  searchTerms: string[] = [];

  searchSubject: Subject<string[]> = new Subject();

  navSubscription: Subscription;

  constructor(
    private files: FilesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private video: VideoService
  ) {}

  static matchesSearch(video: LibraryFile, searchTerms: string[]): boolean {
    return searchTerms.every(term =>
      video.name.toLowerCase().includes(term.toLowerCase()) || video.path.toLowerCase().includes(term.toLowerCase())
    );
  }

  ngOnInit() {
    this.files$ = this.searchSubject.asObservable().pipe(
      switchMap(searchTerms => {
        return searchTerms.length === 0 ? of([]) : this.files.getAll().pipe(
          map(f => f.filter(file => file.isDirectory === false && SearchComponent.matchesSearch(file, searchTerms))),
        );
      })
    );
    this.navSubscription = this.searchSubject.asObservable().subscribe(() =>
      this.router.navigate([], { queryParams: { search: this.search.trim() || null }, queryParamsHandling: 'merge', replaceUrl: true })
    );
  }

  ngAfterViewInit() {
    this.activatedRoute.queryParamMap.pipe(
      take(1),
      tap(params => {
        const searchParam = params.get('search');
        if (searchParam !== null) {
          this.search = searchParam;
        }
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.navSubscription.unsubscribe();
  }

  playVideo(video: LibraryFile) {
    this.video.playVideo(video);
  }

  getParentPath(file: LibraryFile): string {
    return FilesUtils.getParentPath(file);
  }

}

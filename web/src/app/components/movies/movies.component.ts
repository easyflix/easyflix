import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {EMPTY, Observable} from 'rxjs';
import {LibraryFile, Movie} from '@app/models';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material';
import {FileSelectionComponent} from '@app/components/dialogs/file-selection.component';
import {animate, style, transition, trigger} from '@angular/animations';
import {MovieSortStrategy} from '@app/actions/movie-filters.actions';

@Directive({ selector: '[appItem]' })
export class ItemDirective {
  constructor(public elementRef: ElementRef) {}
}

@Component({
  selector: 'app-movies',
  template: `
    <div class="controls animation-hidden">
      <button mat-icon-button class="filters" (click)="toggleFilters()" *ngIf="!(hasAppliedFilters$ | async)">
        <mat-icon>filter_list</mat-icon>
      </button>
      <button mat-mini-fab color="accent" class="filters" (click)="toggleFilters()" *ngIf="hasAppliedFilters$ | async">
        <mat-icon>filter_list</mat-icon>
      </button>
    </div>
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav position="end" [opened]="showFilters$ | async" mode="side">
        <div class="sidenav-content">
          <h2>Sort and filter</h2>
          <mat-form-field class="sort" appearance="standard">
            <mat-label>Sort</mat-label>
            <mat-select placeholder="Sort" (selectionChange)="setSort($event.value)" [value]="sortStrategy$ | async">
              <mat-option value="alphabetical">
                Alphabetical
              </mat-option>
              <mat-option value="release">
                Latest Release
              </mat-option>
              <mat-option value="addition">
                Latest Addition
              </mat-option>
            </mat-select>
          </mat-form-field>
          <app-movies-filters></app-movies-filters>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <section class="items" #items>
          <ng-container *ngIf="movies$ | async as movies">
            <div class="item" appItem
                 @gridAnimation
                 *ngFor="let movie of movies; trackBy: trackByFunc" tabindex="0"
                 (click)="openMovie(movie, movies)"
                 (keydown.enter)="openMovie(movie, movies)"
                 (keydown.space)="openMovie(movie, movies)">
              <div class="poster" [style]="getStyle(movie) | async"></div>
              <button class="play" mat-mini-fab color="primary" (click)="$event.stopPropagation(); play(movie);"
                      tabindex="-1">
                <mat-icon>play_arrow</mat-icon>
              </button>
            </div>
          </ng-container>
        </section>
      </mat-sidenav-content>
    </mat-sidenav-container>

  `,
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .controls {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 11;
      display: flex;
      align-items: center;
    }
    .controls mat-form-field {
      height: 85px;
      margin-right: 1rem;
    }
    .sidenav-container {
      flex-grow: 1;
    }
    .sidenav-content {
      width: 220px;
      padding: 1rem;
      box-sizing: border-box;
    }
    h2 {
      font-weight: 500;
    }
    mat-form-field {
      width: 100%;
    }
    .items {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 22px 0 60px 44px;
    }
    .item {
      box-sizing: content-box;
      position: relative;
      transition: transform 300ms ease;
      cursor: pointer;
      padding: 38px 16px;
    }
    .item:hover, .item:focus {
      transform: scale(1.25);
      z-index: 2;
      outline: none;
    }
    .item:hover {
      z-index: 1;
    }
    .item:hover .play, .item:focus .play {
      opacity: 1;
    }
    .item:focus .poster {
      outline: 1px solid;
    }
    .poster {
      height: 255px; /* 450 */
      width: 170px; /* 300 */
      background-size: cover;
      transition: box-shadow 300ms ease;
    }
    .play {
      position: absolute;
      bottom: 46px;
      right: 24px;
      opacity: 0;
      transition: opacity ease 300ms;
      transform: scale(0.77);
    }
  `],
  animations: [trigger('gridAnimation', [
    // transition(debugAnimation('grid'), []),
    transition(':enter', [
      style({ width: 0, paddingLeft: 0, paddingRight: 0, opacity: 0 }),
      animate('300ms ease-in-out', style({ width: '170px', paddingLeft: '16px', paddingRight: '16px', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('300ms ease-in-out', style({ width: 0, paddingLeft: 0, paddingRight: 0, opacity: 0 }))
    ])
  ])],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesComponent implements OnInit {

  movies$: Observable<Movie[]>;
  hasAppliedFilters$: Observable<boolean>;
  sortStrategy$: Observable<MovieSortStrategy>;
  showFilters$: Observable<boolean>;

  @ViewChild('items', { static: true })
  itemsContainer: ElementRef;

  @ViewChildren(ItemDirective)
  items: QueryList<ItemDirective>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private movies: MoviesService,
    private filters: MovieFiltersService,
    private router: Router,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
  ) {
  }

  ngOnInit() {
    this.movies$ = this.movies.getAll().pipe(
      switchMap(movies => this.filters.filterAndSort(movies)),
    );
    this.hasAppliedFilters$ = this.filters.hasAppliedFilters();
    this.sortStrategy$ = this.filters.getSortStrategy();
    this.showFilters$ = this.filters.getShow();
  }

  getStyle(movie: Movie): Observable<SafeStyle> {
    if (movie.poster) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}w300${movie.poster})`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  trackByFunc(index: number, movie: Movie) {
    return movie.id;
  }

  play(movie: Movie) {
    let file$;
    if (movie.files.length > 1) {
      const fileRef = this.dialog.open(FileSelectionComponent, {
        minWidth: '650px',
        maxWidth: '85%',
        data: {files: movie.files}
      });
      file$ = fileRef.afterClosed().pipe(
        switchMap((file: LibraryFile) =>
          file ? this.files.getByPath(file.path) : EMPTY
        )
      );
    } else {
      file$ = this.files.getByPath(movie.files[0].path);
    }
    file$.subscribe(
      file => this.video.playVideo(file)
    );
  }

  openMovie(movie: Movie, movies: Movie[]): void {
    const ids = movies.map(i => i.id).join(',');
    this.router.navigate(
      ['/', { outlets: { details: ['movie', movie.id] } }],
      { queryParamsHandling: 'preserve', state: { ids } }
    );
  }

  setSort(strategy: MovieSortStrategy): void {
    this.filters.setSort(strategy);
  }

  // @HostListener('keydown.f')
  toggleFilters() {
    this.filters.toggleFilters();
  }

  /*@HostListener('keydown.space', ['$event'])
  noScroll(event: KeyboardEvent) {
    event.preventDefault();
  }*/

  @HostListener('keydown.arrowRight')
  right() {
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex + 1];
    if (nextElement) {
      nextElement.focus();
    } else if (activeElement) {
      activeElement.focus();
    }
  }

  @HostListener('keydown.arrowLeft')
  left() {
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex - 1];
    if (nextElement) {
      nextElement.focus();
    } else if (activeElement) {
      activeElement.focus();
    }
  }

  @HostListener('keydown.arrowUp', ['$event'])
  up(event: KeyboardEvent) {
    const numberPerLine = Math.floor(
      this.itemsContainer.nativeElement.clientWidth / this.items.first.elementRef.nativeElement.clientWidth
    );
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex - numberPerLine] as HTMLElement;
    if (nextElement) {
      nextElement.focus({ preventScroll: true });
      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    event.preventDefault();
  }

  @HostListener('keydown.arrowDown', ['$event'])
  down(event: KeyboardEvent) {
    const numberPerLine = Math.floor(
      this.itemsContainer.nativeElement.clientWidth / this.items.first.elementRef.nativeElement.clientWidth
    );
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex + numberPerLine];
    if (nextElement) {
      nextElement.focus({preventScroll: true});
      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    event.preventDefault();
  }

}

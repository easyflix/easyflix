import {ChangeDetectionStrategy, Component, HostListener, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {EMPTY, Observable} from 'rxjs';
import {LibraryFile, Movie} from '@app/models';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {Router} from '@angular/router';
import {MovieFiltersComponent} from '@app/components/dialogs/movie-filters.component';
import {MatDialog} from '@angular/material';
import {FileSelectionComponent} from '@app/components/dialogs/file-selection.component';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-movies',
  template: `
    <button mat-icon-button class="filters" (click)="showFiltersDialog()" *ngIf="!(hasAppliedFilters$ | async)">
      <mat-icon>filter_list</mat-icon>
    </button>
    <button mat-mini-fab color="accent" class="filters" (click)="showFiltersDialog()" *ngIf="hasAppliedFilters$ | async">
      <mat-icon>filter_list</mat-icon>
    </button>
    <section class="movies">
      <div class="item"
           @gridAnimation
           *ngFor="let movie of movies$ | async; trackBy: trackByFunc" tabindex="0"
           (click)="openMovie(movie)"
           (keydown.enter)="openMovie(movie)"
           (keydown.space)="openMovie(movie)">
        <div class="poster" [style]="getStyle(movie) | async"></div>
        <button class="play" mat-mini-fab color="primary" (click)="$event.stopPropagation(); play(movie);" tabindex="-1">
          <mat-icon>play_arrow</mat-icon>
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .filters {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 11;
    }
    .movies {
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
      switchMap(movies => this.filters.filterMovies(movies))
    );
    this.hasAppliedFilters$ = this.filters.hasAppliedFilters();
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

  openMovie(movie: Movie): void {
    this.router.navigate(
      ['/', { outlets: { details: ['movie', movie.id] } }],
      { queryParamsHandling: 'preserve' }
    );
  }

  @HostListener('keydown.f')
  showFiltersDialog() {
    this.dialog.open(MovieFiltersComponent, {
      maxWidth: '750px',
      minWidth: '500px'
    });
  }

}

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {Observable} from 'rxjs';
import {Movie} from '@app/models';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {Configuration} from '@app/models/configuration';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {FilterService} from '@app/services/filter.service';
import {FiltersComponent} from '@app/components/filters.component';

@Component({
  selector: 'app-movies-grid',
  template: `
    <nav>
      <div class="item"
           *ngFor="let movie of movies$ | async; trackBy: trackByFunc" tabindex="0"
           [routerLink]="['/', {outlets: {movie: [movie.id]}}]">
        <div class="poster" [style]="getStyle(movie)"></div>
        <button class="play" mat-mini-fab color="primary" (click)="$event.stopPropagation(); play(movie);" tabindex="-1">
          <mat-icon>play_arrow</mat-icon>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    nav {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      overflow-y: auto;
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesGridComponent implements OnInit {

  movies$: Observable<Movie[]>;
  config: Configuration;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private movies: MoviesService,
    private filters: FilterService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.core.getConfig().pipe(filter(s => !!s), take(1)).subscribe(
      conf => {
        this.config = conf;
        this.cdr.markForCheck();
      }
    );
  }

  ngOnInit() {
    this.movies$ = this.movies.getAll().pipe(
      switchMap(movies => this.filters.getFilters().pipe(
        map(filters => movies.filter(movie =>
          FiltersComponent.isWithinSearch(movie, filters) &&
          FiltersComponent.isWithinRating(movie, filters) &&
          FiltersComponent.isWithinTags(movie, filters) &&
          FiltersComponent.isWithinLanguages(movie, filters) &&
          FiltersComponent.isWithinYears(movie, filters)
        ))
      ))
    );
  }

  getStyle(movie: Movie): SafeStyle {
    if (this.config !== undefined) {
      return this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${this.config.images.secure_base_url}w300${movie.poster})`
      );
    }
  }

  trackByFunc(index: number, movie: Movie) {
    return movie.id;
  }

  play(movie: Movie) {
    this.files.getByPath(movie.file.path).subscribe(
      file => this.video.playVideo(file)
    );
  }

}

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable} from 'rxjs';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, map, take} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {FilterService} from '@app/services/filter.service';
import {Router} from '@angular/router';
import {ShowsService} from '@app/services/shows.service';
import {Show} from '@app/models/show';

@Component({
  selector: 'app-shows',
  template: `
    <nav>
      <div class="item"
           *ngFor="let show of shows$ | async; trackBy: trackByFunc" tabindex="0"
           (click)="openShow(show)"
           (keydown.enter)="openShow(show)"
           (keydown.space)="openShow(show)">
        <div class="poster" [style]="getStyle(show) | async"></div>
        <!--<button class="play" mat-mini-fab color="primary" (click)="$event.stopPropagation(); play(movie);" tabindex="-1">
          <mat-icon>play_arrow</mat-icon>
        </button>-->
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
      transition: box-shadow 300ms ease;
    }
    /*.play {
      position: absolute;
      bottom: 46px;
      right: 24px;
      opacity: 0;
      transition: opacity ease 300ms;
      transform: scale(0.77);
    }*/
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowsComponent implements OnInit {

  shows$: Observable<Show[]>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private shows: ShowsService,
    private filters: FilterService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {

  }

  ngOnInit() {
    this.shows$ = this.shows.getAll(); /*.pipe(
      switchMap(movies => this.filters.getFilters().pipe(
        map(filters => movies.filter(movie =>
          FiltersComponent.isWithinSearch(movie, filters) &&
          FiltersComponent.isWithinRating(movie, filters) &&
          FiltersComponent.isWithinTags(movie, filters) &&
          FiltersComponent.isWithinLanguages(movie, filters) &&
          FiltersComponent.isWithinYears(movie, filters) &&
          FiltersComponent.isWithinGenres(movie, filters)
        ))
      ))
    );*/
  }

  getStyle(show: Show): Observable<SafeStyle> {
    if (show.poster) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}w300${show.poster})`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  trackByFunc(index: number, show: Show) {
    return show.id;
  }

/*  play(movie: Movie) {
    this.files.getByPath(movie.files[0].path).subscribe( // TODO present a dialog with file choice
      file => this.video.playVideo(file)
    );
  }*/

  openShow(show: Show): void {
    this.router.navigate(
      ['/', { outlets: { details: ['show', show.id] } }],
      { queryParamsHandling: 'preserve' }
    );
  }

}

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {Observable} from 'rxjs';
import {Movie} from '@app/models';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, take} from 'rxjs/operators';
import {Configuration} from '@app/models/configuration';

@Component({
  selector: 'app-movies-grid',
  template: `
    <a class="item"
       tabindex="0"
       *ngFor="let movie of movies$ | async"
       [style]="getStyle(movie)"
       [routerLink]="['/movies', movie.id]">
    </a>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      padding-left: 60px;
      padding-bottom: 30px;
    }
    .item {
      display: block;
      height: 255px; /* 450 */
      min-width: 170px; /* 300 */
      margin: 60px 32px 15px 0;
      box-sizing: border-box;
      transition: transform 300ms ease;
      background-size: cover;
    }
    .item:hover, .item:focus {
      transform: scale(1.3);
      z-index: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesGridComponent implements OnInit {

  movies$: Observable<Movie[]>;
  config: Configuration;

  constructor(
    private core: CoreService,
    private movies: MoviesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.movies$ = movies.getAll();
    this.core.getConfig().pipe(filter(s => !!s), take(1)).subscribe(
      conf => {
        this.config = conf;
        this.cdr.markForCheck();
      }
    );
  }

  ngOnInit() {

  }

  getStyle(movie: Movie): SafeStyle {
    if (this.config !== undefined) {
      return this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${this.config.images.secure_base_url}w300${movie.poster})`
      );
    }
  }

}

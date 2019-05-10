import {Component, Input, OnInit} from '@angular/core';
import {Movie} from '@app/models';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {Observable} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';

@Component({
  selector: 'app-movie',
  template: `
    <div class="container" [style]="getBackdropStyle() | async"  tabindex="0">
      <div class="filter">
        <div class="movie">
          <div class="poster" [style]="getPosterStyle() | async"></div>
          <div class="meta">
            <h1>{{ movie.title }} <span class="year">({{ movie.year }})</span></h1>
          </div>
          <div class="description">
          </div>
          <div class="cast">
            <div class="people"></div>
            <div class="people"></div>
            <div class="people"></div>
            <div class="people"></div>
            <div class="people"></div>
            <div class="people"></div>
            <div class="people"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      background-size: cover;
      background-position: 50% 50%;
      height: 1080px;
    }
    .container:focus {
      outline: none;
    }
    .filter {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
    }
    .movie {
      padding: 2rem 0;
      display: grid;
      grid-template-columns: 300px 740px;
      grid-template-rows: 450px 220px auto;
      grid-template-areas:
        "poster meta"
        "description description"
        "cast cast";
      justify-items: stretch;
    }
    .poster {
      grid-area: poster;
    }
    .meta {
      grid-area: meta;
      margin-left: 2rem;
    }
    .description {
      grid-area: description;
      overflow-y: auto;
      line-height: 1.5;
      margin-top: 2rem;
    }
    h1 {
      font-size: 3rem;
      margin: 0;
    }
    p {
      margin-top: 0
    }
    .cast {
      grid-area: cast;
      display: flex;
      flex-direction: row;
      margin-top: 2rem;
      justify-content: space-between;
    }
    .people {
      height: 150px;
      width: 100px;
    }
  `]
})
export class MovieComponent implements OnInit {

  @Input() movie: Movie;

  constructor(
    private core: CoreService,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
  }

  getPosterStyle(): Observable<SafeStyle> {
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${config.secure_base_url}w300${this.movie.poster})`
      ))
    );
  }

  getBackdropStyle(): Observable<SafeStyle> {
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${config.secure_base_url}original${this.movie.backdrop})`
      ))
    );
  }

}

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {moviesAnimations} from '@app/animations';
import {Observable} from 'rxjs';
import {MoviesService} from '@app/services/movies.service';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css'],
  animations: [moviesAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesComponent implements OnInit {

  years$: Observable<string[]>;

  languages$: Observable<{ code: string; name: string }[]>;

  tags$: Observable<string[]>;

  constructor(
    private core: CoreService,
    private movies: MoviesService
  ) { }

  ngOnInit() {
    this.years$ = this.movies.getAll().pipe(
      map(movies => movies.map(movie => movie.release_date.substr(0, 4))),
      map(years => Array.from(new Set(years)).sort().reverse())
    );
    this.tags$ = this.movies.getAll().pipe(
      map(movies => movies.map(movie => movie.tags).reduce((previous, current) => [...previous, ...current], [])),
      map(tags => Array.from(new Set(tags)).sort())
    );
    this.languages$ = this.core.getConfig().pipe(
      filter(c => !!c),
      take(1),
      mergeMap(config => this.movies.getAll().pipe(
        map(movies => movies.map(movie => movie.original_language)),
        map(codes => codes.map(code => {
          const language = config.languages.find(l => l.iso_639_1 === code);
          return { code: language.iso_639_1, name: language.english_name };
        }))
      )),
      map(languages => Array.from(new Set(languages.map(l => l.code))).map(
        code => ({ code, name: languages.find(l => l.code === code).name })
      ).sort((a, b) => a.name.localeCompare(b.name)))
    );

  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
  }

}

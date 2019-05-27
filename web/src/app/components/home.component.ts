import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {MoviesService} from '@app/services/movies.service';
import {ShowsService} from '@app/services/shows.service';
import {Observable} from 'rxjs';
import {LibraryFile, Movie, Show} from '@app/models';
import {filter, map} from 'rxjs/operators';
import {Router} from '@angular/router';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {ShowFiltersService} from '@app/services/show-filters.service';

@Component({
  selector: 'app-home',
  template: `
      <!--<section>
        <header>
          <h2>Continue watching</h2>
        </header>
        <app-video-list></app-video-list>
      </section>-->
      <section *ngIf="newMovies$ | async as movies">
        <header>
          <h2>New Movies</h2>
          <mat-icon>arrow_right</mat-icon>
          <a tabindex="0" (click)="exploreMovies()" (keydown.enter)="exploreMovies()">explore all</a>
        </header>
        <app-video-list [items]="movies"></app-video-list>
      </section>
      <section *ngIf="newShows$ | async as shows">
        <header>
          <h2>New TV Shows</h2>
          <mat-icon>arrow_right</mat-icon>
          <a tabindex="0" (click)="exploreShows()" (keydown.enter)="exploreShows()">explore all</a>
        </header>
        <app-video-list [items]="shows"></app-video-list>
      </section>
      <section *ngFor="let genre of mainGenres$ | async">
        <header>
          <h2>{{ genre }}</h2>
          <mat-icon>arrow_right</mat-icon>
          <a tabindex="0" (click)="exploreMovies(genre)" (keydown.enter)="exploreMovies(genre)">explore all</a>
        </header>
        <app-video-list [items]="getGenreObservable(genre) | async"></app-video-list>
      </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 25px;
    }
    section {
      padding-left: 60px;
      margin-bottom: 16px;
      height: 315px;
    }
    header {
      height: 60px;
      margin: 0;
      display: flex;
      align-items: center;
    }
    h2 {
      margin: 0;
      line-height: 1;
    }
    a {
      padding-left: .15rem;
      width: 0;
      overflow: hidden;
      transition: width ease 300ms;
      white-space: nowrap;
      text-decoration: none;
      cursor: pointer;
    }
    section:hover a, a:focus {
      width: 75px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  newMovies$: Observable<Movie[]>;
  newShows$: Observable<Show[]>;

  mainGenres$: Observable<string[]>;
  sortedMovies$: Observable<Movie[]>;

  constructor(
    private movies: MoviesService,
    private shows: ShowsService,
    private movieFilters: MovieFiltersService,
    private showFilters: ShowFiltersService,
    private router: Router
  ) { }

  ngOnInit() {

    this.mainGenres$ = this.movies.getAll().pipe(
      map(movies => movies.filter(movie => movie.details !== undefined)),
      map(movies => movies.map(movie =>
        movie.details.genres.map(g => g.name)
      )),
      map(genres => genres.reduce((p, c) => [...p, ...c], [])),
      map((genres: string[]) => {
        const genresMap = new Map();
        genres.forEach(genre => genresMap.set(genre, +(genresMap.get(genre) || 0) + 1));
        return genresMap;
      }),
      map(genresMap => Array.from(genresMap)
        .filter(arr => arr[1] >= 9) // Take only if there are more than 9 movies for this genre
        .sort((a, b) => b[1] - a[1]) // Most represented genres first
        .map(arr => arr[0])
      ),
      // tap(g => console.log(g))
    );

    function getLastModified(files: LibraryFile[]): number {
      return [...files].sort((a, b) => b.lastModified - a.lastModified)[0].lastModified;
    }

    this.newShows$ = this.shows.getAll().pipe(
      map(shows => [...shows].sort((a, b) => getLastModified(b.files) - getLastModified(a.files))),
      map(shows => shows.slice(0, 18)),
      filter(shows => shows.length > 0)
    );

    this.sortedMovies$ = this.movies.getAll().pipe(
      map(movies => [...movies].sort((a, b) => getLastModified(b.files) - getLastModified(a.files)))
    );

    this.newMovies$ = this.sortedMovies$.pipe(
      map(movies => movies.slice(0, 18)),
      filter(movies => movies.length > 0)
    );

  }

  getGenreObservable(genre: string): Observable<Movie[]> {
    return this.sortedMovies$.pipe(
      map(movies => movies
        .filter(movie => movie.details !== undefined)
        .filter(movie => movie.details.genres.map(g => g.name).includes(genre))
      ),
      map(movies => movies.slice(0, 18))
    );
  }

  exploreMovies(genre?: string): void {
    this.router.navigate(['movies'], { queryParamsHandling: 'preserve' }).then(
      () => {
        this.movieFilters.clear();
        if (genre) {
          this.movieFilters.setGenres([genre]);
        }
      }
    );
  }

  exploreShows(): void {
    this.router.navigate(['shows'], { queryParamsHandling: 'preserve' }).then(
      () => this.showFilters.clear()
    );
  }

}

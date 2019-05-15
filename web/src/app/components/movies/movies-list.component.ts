import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {Observable} from 'rxjs';
import {Movie} from '@app/models';
import {map, switchMap} from 'rxjs/operators';
import {FiltersComponent} from '@app/components/filters.component';
import {FilterService} from '@app/services/filter.service';

@Component({
  selector: 'app-movies-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="1020" minBufferPx="1020" maxBufferPx="2040">
      <app-movie *cdkVirtualFor="let movie of movies$ | async; trackBy: trackByFunc; templateCacheSize: 0"
                 [movie]="movie">
      </app-movie>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    app-movie {
      display: flex;
      flex-direction: column;
      height: 1020px;
    }
    cdk-virtual-scroll-viewport {
      flex-grow: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesListComponent implements OnInit {

  movies$: Observable<Movie[]>;

  constructor(
    private core: CoreService,
    private movies: MoviesService,
    private filters: FilterService
  ) {
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

  trackByFunc(index: number, movie: Movie) {
    return movie.id;
  }

}

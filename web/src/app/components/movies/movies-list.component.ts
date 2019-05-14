import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {Observable} from 'rxjs';
import {Movie} from '@app/models';

@Component({
  selector: 'app-movies-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="1080" minBufferPx="1080" maxBufferPx="2160">
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
      height: 1080px;
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
    private movies: MoviesService
  ) {
    this.movies$ = movies.getAll();
  }

  ngOnInit() {
  }

  trackByFunc(index: number, movie: Movie) {
    return movie.id;
  }

}

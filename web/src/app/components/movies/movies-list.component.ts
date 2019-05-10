import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {Movie} from '@app/models';

@Component({
  selector: 'app-movies-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="1080" minBufferPx="1080" maxBufferPx="2160">
      <app-movie *cdkVirtualFor="let movie of movies$ | async; trackBy: trackByFunc" [movie]="movie"></app-movie>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
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
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.movies$ = movies.getAll();
  }

  ngOnInit() {
  }

  trackByFunc(index: number, movie: Movie) {
    return movie.file.path;
  }

}

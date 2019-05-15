import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Movie} from '@app/models';
import {MovieComponent} from '@app/components/movies/movie.component';

@Component({
  selector: 'app-movie-details',
  template: `
    <app-movie [movie]="movie" cdkTrapFocus>
      <button mat-icon-button
              [routerLink]="['/', {outlets: {movie: null}}]"
              queryParamsHandling="preserve"
              class="animation-hide">
        <mat-icon>close</mat-icon>
      </button>
    </app-movie>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      overflow: auto;
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 20;
    }
    app-movie {
      min-height: 900px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    button {
      position: absolute;
      top: 10px;
      right: .65rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieDetailsComponent implements OnInit {

  movie: Movie;

  @ViewChild(MovieComponent) movieComponent;

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.data
      .subscribe((data: { movie: Movie }) => this.movie = data.movie);

    this.movieComponent.focus();
  }

}

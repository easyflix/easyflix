import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Movie} from '@app/models';

@Component({
  selector: 'app-movie-details',
  template: `
    <app-movie [movie]="movie"></app-movie>
    <button mat-icon-button
            [routerLink]="['/', {outlets: {movie: null}}]"
            class="animation-hide">
      <mat-icon>close</mat-icon>
    </button>
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

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.data
      .subscribe((data: { movie: Movie }) => this.movie = data.movie);
  }

}

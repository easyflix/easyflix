import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Movie} from '@app/models';

@Component({
  selector: 'app-movie-details',
  template: `
    <app-movie [movie]="movie"></app-movie>
    <button mat-icon-button routerLink="/movies" class="animation-hide">
      <mat-icon>close</mat-icon>
    </button>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 850px;
      max-height: 1020px;
      height: calc(100vh - 60px);
      overflow: hidden;
      position: relative;
      justify-content: center;
    }
    app-movie {
      width: 100%;
    }
    button {
      position: absolute;
      top: 1rem;
      right: 1rem;
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

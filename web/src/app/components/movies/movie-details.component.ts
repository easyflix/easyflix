import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Movie} from '@app/models';
import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-movie-details',
  template: `
    <ng-container *ngIf="movie$ | async as movie; else loading">
      <app-movie [movie]="movie" cdkTrapFocus [focusOnLoad]="true">
        <button mat-icon-button
                [routerLink]="['/', {outlets: {movie: null}}]"
                queryParamsHandling="preserve"
                class="animation-hide">
          <mat-icon>close</mat-icon>
        </button>
      </app-movie>
    </ng-container>
    <ng-template #loading>
      <div class="loading-movie">Loading...</div>
    </ng-template>
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
    .loading-movie {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
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

  movie$: Observable<Movie>;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.movie$ = this.route.data.pipe(
      switchMap((data: { movie$: Observable<Movie> }) => data.movie$)
    );
  }

}

import {ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {moviesAnimations} from '@app/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {EMPTY, Observable} from 'rxjs';
import {Show} from '@app/models/show';
import {Movie} from '@app/models';
import {filter, map, switchMap, take, tap} from 'rxjs/operators';
import {ShowsService} from '@app/services/shows.service';
import {MoviesService} from '@app/services/movies.service';

@Component({
  selector: 'app-details',
  template: `
    <section class="details" cdkTrapFocus tabindex="0" #container>
      <app-show *ngIf="show$ | async as show" [show]="show"></app-show>
      <app-movie *ngIf="movie$ | async as movie" [movie]="movie"></app-movie>
      <button mat-icon-button
              [disabled]="nextDisabled() | async"
              (click)="next()"
              class="right">
        <mat-icon>keyboard_arrow_right</mat-icon>
      </button>
      <button mat-icon-button
              [disabled]="previousDisabled() | async"
              (click)="previous()"
              class="left">
        <mat-icon>keyboard_arrow_left</mat-icon>
      </button>
      <button mat-icon-button
              [routerLink]="['/', {outlets: {details: null}}]"
              queryParamsHandling="preserve"
              class="close">
        <mat-icon>close</mat-icon>
      </button>
    </section>
  `,
  styles: [`
    .details {
      display: flex;
      flex-direction: column;
      overflow: auto;
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 20;
    }
    app-movie, app-show {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .close {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    .right {
      position: absolute;
      top: calc(50% - 20px);
      right: 10px;
    }
    .left {
      position: absolute;
      top: calc(50% - 20px);
      left: 10px;
    }
  `],
  animations: [moviesAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsComponent implements OnInit {

  type: string; // 'movie' or 'show'

  show$: Observable<Show>;
  movie$: Observable<Movie>;

  @ViewChild('container', {static: true}) container: ElementRef;

  constructor(
    private movies: MoviesService,
    private shows: ShowsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.type = this.route.snapshot.data.type;
    if (this.type === 'movie') {
      this.movie$ = this.route.data.pipe(
        switchMap((data: { movie$: Observable<Movie> }) => data.movie$)
      );
    } else {
      this.show$ = this.route.data.pipe(
        switchMap((data: { show$: Observable<Show> }) => data.show$)
      );
    }
    this.container.nativeElement.focus();
  }

  previousId(): Observable<number> {
    if (this.type === 'movie') {
      return this.movies.getAll().pipe(
        filter(movies => movies.length > 0),
        switchMap(movies => this.movie$.pipe(
          map(movie => {
            const currentIndex = movies.map(s => s.id).indexOf(movie.id);
            return (movies[currentIndex - 1] && movies[currentIndex - 1].id) || undefined;
          })
        ))
      );
    } else {
      return this.shows.getAll().pipe(
        filter(shows => shows.length > 0),
        switchMap(shows => this.show$.pipe(
          map(show => {
            const currentIndex = shows.map(s => s.id).indexOf(show.id);
            return (shows[currentIndex - 1] && shows[currentIndex - 1].id) || undefined;
          })
        ))
      );
    }
  }

  nextId(): Observable<number> {
    if (this.type === 'movie') {
      return this.movies.getAll().pipe(
        filter(movies => movies.length > 0),
        switchMap(movies => this.movie$.pipe(
          map(movie => {
            const currentIndex = movies.map(s => s.id).indexOf(movie.id);
            return (movies[currentIndex + 1] && movies[currentIndex + 1].id) || undefined;
          })
        ))
      );
    } else {
      return this.shows.getAll().pipe(
        filter(shows => shows.length > 0),
        switchMap(shows => this.show$.pipe(
          map(show => {
            const currentIndex = shows.map(s => s.id).indexOf(show.id);
            return (shows[currentIndex + 1] && shows[currentIndex + 1].id) || undefined;
          })
        ))
      );
    }
  }

  previous(): void {
    this.previousId().pipe(
      take(1),
      tap(id => this.router.navigate(
        ['/', { outlets: { details: [this.type, id.toString()] } }],
        {relativeTo: this.route, state: {transition: 'left'}})
      )
    ).subscribe();
  }

  next(): void {
    this.nextId().pipe(
      take(1),
      tap(id => this.router.navigate(
        ['/', { outlets: { details: [this.type, id.toString()] } }],
        {relativeTo: this.route, state: {transition: 'right'}})
      )
    ).subscribe();
  }

  previousDisabled(): Observable<boolean> {
    return this.previousId().pipe(
      map(id => id === undefined)
    );
  }

  nextDisabled(): Observable<boolean> {
    return this.nextId().pipe(
      map(id => id === undefined)
    );
  }

}

import {ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {filter, map, switchMap, take, tap} from 'rxjs/operators';
import {ShowsService} from '@app/services/shows.service';
import {MoviesService} from '@app/services/movies.service';
import {KeyboardService} from '@app/services/keyboard.service';
import {detailsAnimations} from '@app/animations';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {FocusTrap, FocusTrapFactory} from '@angular/cdk/a11y';
import {ShowFiltersService} from '@app/services/show-filters.service';

@Component({
  selector: 'app-details',
  template: `
    <section class="details" [@detailsAnimation]="getAnimationData(details)">
      <router-outlet #details="outlet"></router-outlet>
      <button mat-icon-button
              [disabled]="nextDisabled | async"
              (click)="next()"
              (keydown.space)="$event.stopPropagation()"
              class="right">
        <mat-icon>keyboard_arrow_right</mat-icon>
      </button>
      <button mat-icon-button
              [disabled]="prevDisabled | async"
              (click)="previous()"
              (keydown.space)="$event.stopPropagation()"
              class="left">
        <mat-icon>keyboard_arrow_left</mat-icon>
      </button>
      <button mat-icon-button
              (click)="close()"
              (keydown.space)="$event.stopPropagation()"
              class="close">
        <mat-icon>close</mat-icon>
      </button>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 20;
    }
    .details {
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
  animations: [detailsAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsComponent implements OnInit, OnDestroy {

  type: string; // 'movie' or 'show'

  subscriptions: Subscription[] = [];

  nextId: Observable<number | undefined>;
  prevId: Observable<number | undefined>;

  nextDisabled: Observable<boolean>;
  prevDisabled: Observable<boolean>;

  previousActiveElement: HTMLElement;
  focusTrap: FocusTrap;

  constructor(
    private appDetails: ElementRef,
    private movies: MoviesService,
    private movieFilters: MovieFiltersService,
    private showFilters: ShowFiltersService,
    private shows: ShowsService,
    private keyboard: KeyboardService,
    private route: ActivatedRoute,
    private router: Router,
    private focusTrapFactory: FocusTrapFactory
  ) {
  }

  ngOnInit(): void {
    this.type = this.route.snapshot.data.type;

    // Keyboard events
    this.subscriptions.push(
/*      this.keyboard.ArrowLeft.subscribe(
        () => this.previous()
      ),
      this.keyboard.ArrowRight.subscribe(
        () => this.next()
      )*/
    );

    // Trap focus within component
    this.focusTrap = this.focusTrapFactory.create(this.appDetails.nativeElement);
    this.previousActiveElement = document.activeElement as HTMLElement;
    setTimeout(() => this.focusTrap.focusFirstTabbableElementWhenReady());

    // NextId and PreviousId observables
    const movies$ = this.movies.getAll().pipe(
      filter(movies => movies.length > 0),
      switchMap(movies => this.movieFilters.filterMovies(movies))
    );
    const shows$ = this.shows.getAll().pipe(
      filter(shows => shows.length > 0),
      switchMap(shows => this.showFilters.filterShows(shows))
    );
    const id$ = this.route.url.pipe(
      switchMap(() => this.route.firstChild.paramMap),
      map(params => +params.get('id'))
    );
    const items$: Observable<{id: number}[]> = this.type === 'movie' ? movies$ : shows$;

    const fn = (array: {id: number}[], offset: 1 | -1) => (id: number) => {
      const currentIndex = array.map(o => o.id).indexOf(id);
      return (array[currentIndex + offset] && array[currentIndex + offset].id) || undefined;
    };

    this.nextId = items$.pipe(
      switchMap(items => id$.pipe(
        map(fn(items, 1))
      ))
    );
    this.prevId = items$.pipe(
      switchMap(items => id$.pipe(
        map(fn(items, -1))
      ))
    );
    this.nextDisabled = this.nextId.pipe(
      map(id => id === undefined)
    );
    this.prevDisabled = this.prevId.pipe(
      map(id => id === undefined)
    );

  }

  ngOnDestroy(): void {
    this.subscriptions.map(sub => sub.unsubscribe());
    this.focusTrap.destroy();
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }

  @HostListener('keydown.space')
  next(): void {
    this.nextId.pipe(
      take(1),
      tap(id => id !== undefined && this.router.navigate(
        ['/', { outlets: { details: [this.type, id.toString()] } }],
        { relativeTo: this.route, state: { transition: 'right', id }, queryParamsHandling: 'preserve' }
      )),
      tap(() => setTimeout(() => this.focusTrap.focusFirstTabbableElementWhenReady(), 400))
    ).subscribe();
  }

  @HostListener('keydown.shift.space')
  previous(): void {
    this.prevId.pipe(
      take(1),
      tap(id => id !== undefined && this.router.navigate(
        ['/', { outlets: { details: [this.type, id.toString()] } }],
        { relativeTo: this.route, state: { transition: 'left', id }, queryParamsHandling: 'preserve' }
      )),
      tap(() => setTimeout(() => this.focusTrap.focusFirstTabbableElementWhenReady(), 400))
    ).subscribe();
  }

  @HostListener('keydown.esc')
  close() {
    this.router.navigate(
      ['/', { outlets: { details: null } }],
      { relativeTo: this.route, queryParamsHandling: 'preserve' }
    );
  }

  getAnimationData(outlet: RouterOutlet) {
    const primary =
      history.state && history.state.transition && history.state.id ?
        history.state.transition + '-' + history.state.id : '';

    const fallback = outlet
      && outlet.activatedRouteData
      && outlet.activatedRouteData.animation || 'empty';

    return primary || fallback;
  }

}

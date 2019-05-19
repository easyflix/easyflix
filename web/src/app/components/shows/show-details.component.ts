import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Show} from '@app/models/show';
import {Observable} from 'rxjs';
import {filter, map, switchMap, take, tap} from 'rxjs/operators';
import {ShowsService} from '@app/services/shows.service';

@Component({
  selector: 'app-show-details',
  template: `
    <ng-container *ngIf="show$ | async as show; else loading">
      <app-show [show]="show" cdkTrapFocus [focusOnLoad]="true">
        <button mat-icon-button
                [routerLink]="['/', {outlets: {show: null}}]"
                queryParamsHandling="preserve"
                class="close">
          <mat-icon>close</mat-icon>
        </button>
        <button mat-icon-button
                [disabled]="(nextId() | async) === undefined"
                (click)="nextShow()"
                class="right">
          <mat-icon>keyboard_arrow_right</mat-icon>
        </button>
        <button mat-icon-button
                [disabled]="(previousId() | async) === undefined"
                (click)="previousShow()"
                class="left">
          <mat-icon>keyboard_arrow_left</mat-icon>
        </button>
      </app-show>
    </ng-container>
    <ng-template #loading>
      <div class="loading-show">Loading...</div>
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
    app-show {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    .loading-show {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowDetailsComponent implements OnInit {

  show$: Observable<Show>;

  constructor(
    private shows: ShowsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.show$ = this.route.data.pipe(
      switchMap((data: { show$: Observable<Show> }) => data.show$)
    );
  }

  nextId(): Observable<number> {
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

  previousId(): Observable<number> {
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

  previousShow(): void {
    this.previousId().pipe(
      take(1),
      tap(id => this.router.navigate(
        ['/', {outlets: {show: id.toString()}}],
        {relativeTo: this.route, state: {transition: 'left'}})
      )
    ).subscribe();
  }

  nextShow(): void {
    this.nextId().pipe(
      take(1),
      tap(id => this.router.navigate(
        ['/', {outlets: {show: id.toString()}}],
        {relativeTo: this.route, state: {transition: 'right'}})
      )
    ).subscribe();
  }

}

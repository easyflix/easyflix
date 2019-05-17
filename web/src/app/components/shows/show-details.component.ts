import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Show} from '@app/models/show';
import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-show-details',
  template: `
    <ng-container *ngIf="show$ | async as show; else loading">
      <app-show [show]="show" cdkTrapFocus [focusOnLoad]="true">
        <button mat-icon-button
                [routerLink]="['/', {outlets: {show: null}}]"
                queryParamsHandling="preserve"
                class="animation-hide">
          <mat-icon>close</mat-icon>
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
    button {
      position: absolute;
      top: 10px;
      right: .65rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowDetailsComponent implements OnInit {

  show$: Observable<Show>;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.show$ = this.route.data.pipe(
      switchMap((data: { show$: Observable<Show> }) => data.show$)
    );
  }

}

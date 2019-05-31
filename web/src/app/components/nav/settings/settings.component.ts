import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTabNav} from '@angular/material/tabs';
import {CoreService} from '@app/services/core.service';
import {Observable, Subscription} from 'rxjs';
import {SidenavWidthType} from '@app/reducers/core.reducer';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  template: `
    <header>
      <h2>Settings</h2>
    </header>
    <mat-divider></mat-divider>
    <section class="settings">
      <nav mat-tab-nav-bar mat-stretch-tabs>
        <a mat-tab-link
           [routerLink]="['./', { section: 'client' }]"
           [active]="clientTabActive$ | async"
           queryParamsHandling="preserve">
          Client
        </a>
        <a mat-tab-link
           [routerLink]="['./', { section: 'server' }]"
           [active]="serverTabActive$ | async"
           queryParamsHandling="preserve">
          Server
        </a>
      </nav>
      <app-local *ngIf="clientTabActive$ | async"></app-local>
      <app-global *ngIf="serverTabActive$ | async"></app-global>
    </section>
  `,
  styles: [`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow-y: hidden;
    }
    header {
      height: 59px;
      min-height: 59px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
    }
    h2 {
      margin: 0;
      font-size: 18px;
    }
    h3 {
      margin: 1.25rem 0;
      font-size: 18px;
    }
    p {
      margin: 0 0 1rem 0;
    }
    .settings {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      padding: 0.75rem 1.25rem 0.25rem 1.25rem;
      overflow-y: auto;
    }
    .settings form {
      margin-bottom: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

  @ViewChild(MatTabNav, { static: true }) navBar: MatTabNav;

  clientTabActive$: Observable<boolean>;
  serverTabActive$: Observable<boolean>;

  sidenavWidth$: Observable<SidenavWidthType>;

  subscriptions: Subscription[] = [];

  constructor(
    private core: CoreService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.sidenavWidth$ = this.core.getSidenavWidth();
    this.clientTabActive$ = this.route.paramMap.pipe(
      map(params => params.get('section') === null || params.get('section') === 'client')
    );
    this.serverTabActive$ = this.route.paramMap.pipe(
      map(params => params.get('section') === 'server')
    );
    this.subscriptions.push(
      this.sidenavWidth$.subscribe(
        () => this.navBar._alignInkBar()
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}

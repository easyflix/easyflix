import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Season, Show} from '@app/models/show';
import {CoreService} from '@app/services/core.service';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {FilterService} from '@app/services/filter.service';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {map, switchMap} from 'rxjs/operators';
import {episodesAnimations} from '@app/animations';

@Component({
  selector: 'app-season',
  template: `
    <ng-container *ngIf="season$ | async as season">
      <section class="season">
        <div>
          <dl>
            <dt>Name</dt>
            <dd>{{ season.name }}</dd>
            <dt>First air date</dt>
            <dd>{{ season.air_date ? (season.air_date | date) : 'N/A' }}</dd>
            <dt>Episodes</dt>
            <dd>{{ season.episode_count }}</dd>
          </dl>
          <p class="overview">{{ season.overview }}</p>
        </div>
      </section>
      <section class="episodes">
        <div class="before">
          <button mat-button [routerLink]="[1]">
            <mat-icon>arrow_drop_up</mat-icon>
          </button>
        </div>
        <div class="episode" [@episodesAnimation]="getAnimationData(episode) | async">
          <router-outlet #episode="outlet"></router-outlet>
        </div>
        <div class="after">
          <button mat-button [routerLink]="[2]">
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
        </div>
      </section>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
    }
    .season{
      display: flex;
      height: 120px;
    }
    dl {
      padding: 0 1rem 0 0;
      float: left;
      width: 350px;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-weight: 300;
      margin: 0;
      line-height: 1.9;
    }
    dt {
      width: 9rem;
      padding-right: 1rem;
      box-sizing: border-box;
      font-weight: 400;
      margin: 0;
      text-align: right;
    }
    dd {
      width: calc(100% - 9rem);
      align-items: center;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .overview {
      font-weight: 300;
      line-height: 30px;
      margin: 0;
      max-height: 120px;
      overflow-y: auto;
    }
    .episodes {
      display: flex;
      flex-direction: column;
      height: 290px;
      padding-top: 15px;
      box-sizing: border-box;
      width: 100%;
      max-width: 1300px;
      position: relative;
    }
    .episode {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .before, .after {
      position: absolute;
      display: flex;
      height: 45px;
      align-items: center;
      justify-content: center;
      width: 100%;
      z-index: 1;
    }
    .before {
      top: 15px;
    }
    .after {
      bottom: 0;
    }
    .before button, .after button {
      width: 100%;
      border-radius: 0;
    }
  `],
  animations: [episodesAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeasonComponent implements OnInit {

  season$: Observable<Season>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private filters: FilterService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.season$ = this.route.paramMap.pipe(
      switchMap(params => {
        const seasonNumber = +params.get('season');
        return this.route.parent.data.pipe(
          switchMap((data: { show$: Observable<Show> }) => data.show$),
          map(show => show.details.seasons.filter(season => season.season_number === seasonNumber)[0])
        );
      })
    );
  }

  getAnimationData(outlet: RouterOutlet): Observable<string> {
    // return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
    return outlet.activatedRoute.paramMap.pipe(
      map(params => (outlet.activatedRouteData && outlet.activatedRouteData.animation) || params.get('episode') || 'info')
    );
  }

}

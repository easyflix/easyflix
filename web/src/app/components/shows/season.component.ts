import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Season, Show} from '@app/models/show';
import {CoreService} from '@app/services/core.service';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {FilterService} from '@app/services/filter.service';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {map, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-season',
  template: `
    <ng-container *ngIf="season$ | async as season">
      <section class="season">
        <div class="season-content">
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
          <button mat-button>
            <mat-icon>arrow_drop_up</mat-icon>
          </button>
        </div>
        <div class="episode" *ngFor="let episode of [0]">
          <div class="still">
            <img src="https://image.tmdb.org/t/p/w300/lNXkxjiVwWKXalBcDCpntXBBfOh.jpg">
          </div>
          <div>
            <header class="tabs">
              <h3 class="tab" [class.selected]="true">Episode Info</h3>
              <h3 class="tab" [class.selected]="false">File Info</h3>
            </header>
            <dl>
              <dt>Number</dt>
              <dd>1</dd>
              <dt>Name</dt>
              <dd>eps1.0_hellofriend.mov</dd>
              <dt>Directed by</dt>
              <dd>David Nutter</dd>
              <dt>Written by</dt>
              <dd>Dave Hill</dd>
            </dl>
            <p class="overview">Elliot, a cyber-security engineer by day and vigilante hacker by night,
              is recruited by a mysterious underground group to destroy the firm he's paid to protect.
              Elliot must decide how far he'll go to expose the forces he believes are running (and ruining)
              the world.</p>
          </div>
        </div>
        <div class="after">
          <button mat-button>
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
      line-height: 1.9;
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
    }
    .episode {
      /*flex-grow: 1;*/
      box-sizing: border-box;
      width: 100%;
      font-weight: 300;
      display: flex;
    }
    .episode .still {
      margin-right: 2rem;
      font-size: 0;
    }
    .episode .tabs {
      margin-top: 0;
    }
    .episode dl {
      float: left;
      width: 350px;
    }
    .before, .after {
      min-height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .before button, .after button {
      width: 100%;
      border-radius: 0;
    }

    .tabs {
      display: flex;
      flex-direction: row;
      margin-bottom: 15px;
      border-bottom: 1px solid;
    }
    .tab {
      font-weight: 400;
      font-size: 16px;
      width: 8.5rem;
      text-align: center;
      margin: 0 0 -1px 0;
      padding: .75rem 0;
      cursor: pointer;
    }
  `],
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

}
